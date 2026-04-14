# Tunnel 跨框架路由中间件 - 架构设计与实施方案

**版本**: v2.0
**状态**: 已实施（代码与文档同步）

## 一、 核心价值与架构定位

`Tunnel` 是一个极致轻量、高性能、框架无关的路由代理层中间件。

1. **零代价热更新 (HMR)**：通过内存哈希表（SMI Key）和代理闭包（Proxy），实现 O(1) 复杂度的路由热替换，无须触碰底层框架复杂的路由树。
2. **面向返回值编程 (Return-Oriented)**：业务侧摒弃传统的 `req/res` 交互模式，仅通过 `return` 不同类型的数据结构，由 Tunnel 自动推导并完成 JSON、SSE 流或 WebSocket 的协议响应。
3. **绝对类型安全 (Strict Types)**：全源码零 `any`，引入 `Awaitable` 和泛型自动推断，全面使用 `unknown` 强制业务层做类型断言，利用泛型 `R` 保留对底层框架上下文的安全逃生舱。
4. **高度解耦 (Stateless)**：核心包零外部依赖，适配器（Adapter）被设计为无状态纯函数。

---

## 二、 完整架构蓝图

### 1. 目录结构规划

```text
packages/tunnel/
├── index.ts        # 统一导出 (export *)
├── utils.ts       # FNV-1a Hash 算法, Method, Endpoint 类型
├── types.ts       # 核心泛型与 Context/Handler 接口, SockletUpgrade
├── response.ts    # Response 类, redirect 工厂
├── adapter.ts     # 适配器标准契约
├── tunnel.ts      # 核心调度引擎
├── adapters/
│   └── express.ts # Express 适配器
├── tests/
│   ├── tunnel.test.ts
│   └── hash.test.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### 2. 核心算法与工具 (`utils.ts`)

为了压榨 V8 引擎对 `Map` 的寻址性能，将路由字符串（如 `"GET /api/users"`）转换为 32 位整型（Small Integer）。

```typescript
export type Method =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'
  | 'OPTIONS'
  | 'TRACE'
  | 'CONNECT';

/** 模板字面量约束，提供 IDE 的严格格式提示 */
export type Endpoint = `${Method} ${string}`;

const FNV_PRIME = 0x01000193;
const FNV_OFFSET_BASIS = 0x811c9dc5;

/**
 * 高性能 FNV-1a 32-bit 哈希算法
 * 纯位运算，无加密开销，适合短字符串哈希
 */
export function hash(endpoint: Endpoint | string): number {
  let hash = FNV_OFFSET_BASIS;

  for (let i = 0; i < endpoint.length; i++) {
    hash ^= endpoint.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }

  return hash >>> 0;
}
```

### 3. 统一门面与处理器签名 (`types.ts`)

设计精细的上下文接口，明确区分 `pathname` 和 `path`，并彻底消灭 `any`。通过 `Awaitable` 和 `Reply` 泛型，实现端到端的完美类型推推断。

```typescript
/** 通用工具类型：表示值可能是同步的，也可能是异步的 Promise */
export type Awaitable<T> = T | Promise<T>;

/**
 * 统一上下文门面
 * @template R 底层框架的原始 Request/Context 实例类型 (逃生舱)
 */
export interface Context<R = unknown> {
  readonly method: Method;
  readonly pathname: string;                                        // 注册路由时的原始路径定义，如: /api/users/:id
  readonly path: string;                                            // 客户端请求的真实路径，如: /api/users/123
  readonly query: Record<string, string | string[] | undefined>;   // 查询参数
  readonly params: Record<string, string | undefined>;              // 路径参数
  readonly headers: Record<string, string | string[] | undefined>; // 请求头
  readonly body: unknown;                                          // 请求体（需业务侧断言类型）
  readonly raw: R;                                                 // 逃生舱：框架原生的实例
}

/**
 * 业务处理函数的有效返回值结构
 * @template T 业务真实的返回数据泛型
 */
export type Reply<T = unknown> =
  | T                    // 1. 业务数据泛型 T (如 { id: number }) -> JSON/Text (默认)
  | Response             // 2. 自定义 Status/Headers -> HTTP 响应
  | AsyncIterable<T>     // 3. 异步迭代器 -> Server-Sent Events (SSE) 流
  | SockletUpgrade;      // 4. WebSocket 升级信号 -> WS 全双工通信

/**
 * 统一路由处理器签名
 * 核心规约：业务侧通过 return 不同的类型，驱动 Adapter 执行不同的协议响应
 * @template R 底层原生请求上下文泛型
 * @template T 业务处理返回结果泛型 (默认 unknown)
 */
export type Handler<R = unknown, T = unknown> = (ctx: Context<R>) => Awaitable<Reply<T>>;

/** WebSocket 升级信号标识 */
export class SockletUpgrade {
  constructor(public readonly socklet: Socklet) {}
}

/** WebSocket 生命周期接口 */
export interface Socklet {
  onopen?: (ws: Socket) => void;
  onmessage?: (data: unknown, ws: Socket) => void;
  onclose?: (code: number, reason: string, ws: Socket) => void;
  onerror?: (error: Error, ws: Socket) => void;
}

export interface Socket {
  send(data: unknown): void;
  close(): void;
}
```

### 4. 复杂协议实体 (`response.ts`)

为业务层提供纯粹的协议载体工厂函数。

```typescript
export type ResponseInit = {
  status?: number;
  statusText?: string;
  headers?: Record<string, string | string[]>;
};

export class Response {
  readonly status: number;
  readonly statusText: string;
  readonly headers: Record<string, string | string[]>;
  readonly body: unknown;

  constructor(body: unknown, init: ResponseInit = {}) {
    this.status = init.status ?? 200;
    this.statusText = init.statusText ?? defaultStatusText(this.status);
    this.headers = { ...init.headers };
    this.body = body;
  }
}

/** 辅助工厂：标准重定向 */
export function redirect(location: string, status = 302): Response {
  return new Response(null, {
    status,
    headers: { Location: location },
  });
}
```

### 5. 适配器标准契约 (`adapter.ts`)

定义 Tunnel 与具体 Web 框架交互的规范。

```typescript
import type { Method } from './utils';
import type { Context } from './types';

/**
 * @template App 底层 Web 框架应用实例 (如 express app)
 * @template R   底层框架请求上下文 (如 express req)
 */
export interface Adapter<App, R> {
  readonly name: string;

  /**
   * 向底层框架注册代理函数
   * @param proxy Tunnel 生成的代理分发器，Adapter 需负责解析其返回值并智能响应客户端
   */
  register(
    app: App,
    method: Method,
    pathname: string,
    proxy: (raw: R) => Promise<unknown>
  ): void;

  /**
   * 将宿主框架的原生上下文转换为 Tunnel 的标准 Context
   */
  transform(raw: R, pathname: string, method: Method): Context<R>;
}
```

### 6. 核心调度引擎 (`tunnel.ts`)

极简的引擎实现，专注于注册表的维护和享元代理的生成。支持泛型字典推断，完美适配现代 RPC 需求。

```typescript
import { hash, type Method, type Endpoint } from './utils';
import type { Handler } from './types';
import type { Adapter } from './adapter';

export class Tunnel<App, R> {
  // 采用 O(1) 性能最优的 32位整型 HashMap
  private registry = new Map<number, Handler<R>>();

  constructor(
    private app: App,
    private adapter: Adapter<App, R>
  ) {}

  /**
   * 批量注册/热更新路由
   * @template Routes 泛型字典，自动推断每个路由的返回类型 T
   */
  register<const Routes extends Record<string, Handler<R>>>(routes: Routes): void {
    for (const [key, handler] of Object.entries(routes)) {
      const [method, pathname] = this.parse(key);
      const endpoint = `${method} ${pathname}` as Endpoint;
      const routeId = hash(endpoint);

      const isLinked = this.registry.has(routeId);

      // O(1) 内存更新，热替换业务处理函数
      this.registry.set(routeId, handler);

      // 首次注册，向底层框架注入闭包代理桩
      if (!isLinked) {
        this.adapter.register(
          this.app,
          method,
          pathname,
          this.proxy(routeId, method, pathname) // method 和 pathname 通过闭包捕获
        );
      }
    }
  }

  /**
   * 动态卸载路由
   */
  unregister(key: string): void {
    const [method, pathname] = this.parse(key);
    const endpoint = `${method} ${pathname}` as Endpoint;
    const routeId = hash(endpoint);
    this.registry.delete(routeId);
  }

  // 享元模式：通过闭包捕获 method 和 pathname，避免运行时二次 Map 寻址
  private proxy(routeId: number, method: Method, pathname: string) {
    return async (raw: R): Promise<unknown> => {
      const handler = this.registry.get(routeId);

      // 路由未命中（被动态卸载）：直接抛错，由底层框架的错误中间件兜底处理
      if (!handler) {
        throw new Error(`[Tunnel] Route Not Found: ${routeId}`);
      }

      const ctx = this.adapter.transform(raw, pathname, method);
      return await handler(ctx);
    };
  }

  /**
   * 解析路由键 "GET /api/:id" -> ["GET", "/api/:id"]
   */
  private parse(key: string): [Method, string] {
    const idx = key.indexOf(' ');
    if (idx === -1) throw new Error(`[Tunnel] Invalid Endpoint: "${key}"`);

    const method = key.slice(0, idx).toUpperCase() as Method;
    const pathname = key.slice(idx + 1);

    return [method, pathname];
  }
}
```

---

## 三、 实施状态

### ✅ Phase 1: 基础设施构建 (Foundation)
- [x] 工程初始化 (`package.json`, `tsconfig.json`)
- [x] FNV-1a Hash 算法 (`hash`)
- [x] 核心类型定义 (`Method`, `Endpoint`, `Context`, `Handler`, `Reply`, `Awaitable`)
- [x] 响应实体 (`Response`, `redirect`)
- [x] Socklet 生命周期 (`SockletUpgrade`, `Socklet`, `Socket`)
- [x] 适配器契约 (`Adapter`)

### ✅ Phase 2: 核心引擎实现 (Core Engine)
- [x] `Tunnel` 核心类
- [x] O(1) 内存注册表 + 热更新
- [x] 闭包捕获优化（移除冗余 `handlers` Map）
- [x] 统一导出 (`export *`)

### ✅ Phase 3: 官方框架适配器 (Adapters)
- [x] Express Adapter (`adapters/express.ts`)
  - [x] 零开销 `transform`
  - [x] 智能响应推导（JSON / SSE / Response）
  - [x] 错误处理 (`next(err)`)

### ✅ Phase 4: 测试与文档
- [x] 单元测试 (12 tests, 100% passing)
- [x] Hash 算法稳定性测试
- [x] README 文档

---

## 四、 性能设计

| 优化点 | 实现方式 | 收益 |
|--------|---------|------|
| O(1) 路由查找 | FNV-1a 32-bit SMI Hash | V8 Map 极致寻址性能 |
| 热更新零拷贝 | 直接替换 Map 中的 Handler 引用 | 无锁无 GC 压力 |
| Transform 零分配 | 类型断言透传，避免对象拷贝 | 高并发下无 GC 抖动 |
| 闭包捕获元数据 | method/pathname 闭包绑定 | 运行时仅一次 Map 寻址 |
