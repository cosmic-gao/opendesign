# Tunnel 跨框架路由中间件 - 架构设计与实施方案

**版本**: v1.6 (Final)
**状态**: 设计已冻结，准备实施

## 一、 核心价值与架构定位

`Tunnel` 是一个极致轻量、高性能、框架无关的路由代理层中间件。

1. **零代价热更新 (HMR)**：通过内存哈希表（SMI Key）和代理闭包（Proxy），实现 O(1) 复杂度的路由热替换，无须触碰底层框架复杂的路由树。
2. **面向返回值编程 (Return-Oriented)**：业务侧摒弃传统的 `req/res` 交互模式，仅通过 `return` 不同类型的数据结构，由 Tunnel 自动推导并完成 JSON、SSE 流或 WebSocket 的协议响应。
3. **绝对类型安全 (Strict Types)**：全源码零 `any`，全面使用 `unknown` 强制业务层做类型断言，利用泛型 `R` 保留对底层框架上下文的安全逃生舱。
4. **高度解耦 (Stateless)**：核心包零外部依赖，适配器（Adapter）被设计为无状态纯函数。

---

## 二、 完整架构蓝图

### 1. 目录结构规划

```text
packages/tunnel/
├── src/
│   ├── index.ts        # 统一导出
│   ├── utils.ts        # 内部工具 (FNV-1a Hash算法, RouteKey)
│   ├── types.ts        # 核心泛型与 Context/Handler 接口
│   ├── response.ts     # 复杂响应体 (Response, redirect)
│   ├── socklet.ts      # WebSocket 定义 (Socklet, SockletUpgrade, upgrade)
│   ├── adapter.ts      # 适配器标准契约
│   └── tunnel.ts       # 核心调度引擎
├── package.json
└── tsconfig.json
```

### 2. 核心算法与工具 (`src/utils.ts`)

为了压榨 V8 引擎对 `Map` 的寻址性能，将路由字符串（如 `"GET /api/users"`）转换为 32 位整型（Small Integer）。

```typescript
/** 
 * 高性能 FNV-1a 32-bit 哈希算法 
 * 纯位运算，无加密开销，适合短字符串哈希
 */
export function hash(str: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
    }
    return h;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS" | "WS";

/** 模板字面量约束，提供 IDE 的严格格式提示 */
export type RouteKey = `${HttpMethod} ${string}`;
```

### 3. 统一门面与处理器签名 (`src/types.ts`)

设计精细的上下文接口，明确区分 `pathname` 和 `path`，并彻底消灭 `any`。

```typescript
import type { Response } from './response';
import type { SockletUpgrade } from './socklet';
import type { HttpMethod } from './utils';

/**
 * 统一上下文门面
 * @template R 底层框架的原始 Request/Context 实例类型 (逃生舱)
 */
export interface Context<R> {
    readonly method: HttpMethod;
    readonly pathname: string;  // 注册路由时的原始路径定义，如: /api/users/:id
    readonly path: string;      // 客户端请求的真实路径，如: /api/users/123
    readonly query: Record<string, string | string[] | undefined>;
    readonly params: Record<string, string | undefined>;
    readonly headers: Record<string, string | string[] | undefined>;
    
    // 安全限制：body 为 unknown，强制业务侧在使用时显式断言 (e.g., ctx.body as MyDto)
    readonly body: unknown;     
    
    // 逃生舱：框架原生的实例
    readonly raw: R;            
}

/**
 * 统一路由处理器签名
 * 核心规约：业务侧通过 return 不同的类型，驱动 Adapter 执行不同的协议响应
 */
export type Handler<R> = (ctx: Context<R>) => 
    | unknown                       // 1. 普通对象/字符串 -> JSON/Text (默认)
    | Response                      // 2. 自定义 Status/Headers -> HTTP 响应
    | AsyncIterable<unknown>        // 3. 异步迭代器 -> Server-Sent Events (SSE) 流
    | SockletUpgrade<unknown>       // 4. WebSocket 升级信号 -> WS 全双工通信
    | Promise<unknown>;
```

### 4. 复杂协议实体 (`src/response.ts` & `src/socklet.ts`)

为业务层提供纯粹的协议载体工厂函数。

**`src/response.ts`**:
```typescript
/** 
 * 标准 HTTP 响应体，用于承载特殊状态码或 Header
 */
export class Response {
    constructor(
        public body: unknown,
        public init?: { status?: number; headers?: Record<string, string> }
    ) {}
}

/** 辅助工厂：标准重定向 */
export const redirect = (url: string, status: number = 302): Response => {
    return new Response(null, { status, headers: { Location: url } });
};
```

**`src/socklet.ts`**:
```typescript
/**
 * Socklet WebSocket 生命周期
 * @template W 底层真实的 WebSocket 实例泛型，保证不丢失原生的高级能力
 */
export interface Socklet<W> {
    onopen?: (event: Event, ws: W) => void;
    onmessage?: (event: MessageEvent, ws: W) => void;
    onclose?: (event: CloseEvent, ws: W) => void;
    onerror?: (event: ErrorEvent, ws: W) => void;
}

/** WebSocket 升级信号标识 */
export class SockletUpgrade<W> {
    constructor(public socklet: Socklet<W>) {}
}

/** 辅助工厂：触发 WebSocket 升级 */
export const upgrade = <W>(socklet: Socklet<W>) => new SockletUpgrade<W>(socklet);
```

### 5. 适配器标准契约 (`src/adapter.ts`)

定义 Tunnel 与具体 Web 框架交互的规范。

```typescript
import type { HttpMethod } from './utils';
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
        method: HttpMethod, 
        pathname: string, 
        proxy: (raw: R) => Promise<unknown>
    ): void;

    /**
     * 将宿主框架的原生上下文转换为 Tunnel 的标准 Context
     */
    transform(raw: R, pathname: string): Context<R>;
}
```

### 6. 核心调度引擎 (`src/tunnel.ts`)

极简的引擎实现，专注于注册表的维护和享元代理的生成。

```typescript
import { hash, type HttpMethod, type RouteKey } from './utils';
import type { Handler } from './types';
import type { Adapter } from './adapter';

export class Tunnel<App, R> {
    // 采用 O(1) 性能最优的 32位整型 HashMap
    private registry: Map<number, Handler<R>> = new Map();

    constructor(
        private app: App,
        private adapter: Adapter<App, R>
    ) {}

    /**
     * 批量注册/热更新路由
     */
    public register(routes: Record<RouteKey | string, Handler<R>>) {
        for (const [key, handler] of Object.entries(routes)) {
            const routeId = hash(key);
            
            // 语义化：是否已链接到底层框架路由树
            const linked = this.registry.has(routeId);
            
            // O(1) 内存更新，热替换业务处理函数
            this.registry.set(routeId, handler);

            // 首次注册，向底层框架注入闭包代理桩 (Proxy Stub)
            if (!linked) {
                const [method, pathname] = this.parse(key);
                this.adapter.register(
                    this.app, 
                    method, 
                    pathname, 
                    this.proxy(routeId, pathname)
                );
            }
        }
    }

    /**
     * 动态卸载路由
     */
    public unregister(key: string) {
        this.registry.delete(hash(key));
    }

    /**
     * 享元模式：生成闭包代理分发器
     */
    private proxy(routeId: number, pathname: string) {
        return async (raw: R): Promise<unknown> => {
            const handler = this.registry.get(routeId);
            
            // 路由未命中（被动态卸载）：直接抛错，由底层框架的错误中间件兜底处理
            if (!handler) {
                throw new Error(`[Tunnel] Route Hash Not Found: ${routeId}`);
            }

            const ctx = this.adapter.transform(raw, pathname);
            return await handler(ctx);
        };
    }

    /**
     * 解析路由键 "GET /api/:id" -> ["GET", "/api/:id"]
     */
    private parse(key: string): [HttpMethod, string] {
        const idx = key.indexOf(' ');
        if (idx === -1) throw new Error(`[Tunnel] Invalid Route Key: "${key}"`);
        
        const method = key.slice(0, idx).toUpperCase() as HttpMethod;
        const pathname = key.slice(idx + 1);
        
        return [method, pathname];
    }
}
```

---

## 三、 详细实施计划方案 (Implementation Plan)

本项目将采用增量交付策略，分为四个阶段（Phases）进行实施。

### Phase 1: 基础设施构建 (Foundation)
**目标**：搭建工程骨架，实现核心类型与算法，确保整个体系的类型安全性。

**详细任务**：
1. **工程初始化**：
   - 配置 `packages/tunnel/package.json`，声明 `main`, `types`, `exports` 字段。
   - 配置 `tsconfig.json`，确保 `"strict": true`, `"noImplicitAny": true`, `"exactOptionalPropertyTypes": true`，为零 `any` 打下基础。
2. **算法与工具集 (`src/utils.ts`)**：
   - 实现 FNV-1a Hash 函数 `hash(str: string): number`。
   - 定义基础类型：`HttpMethod` 和 `RouteKey`（模板字面量）。
3. **核心领域模型 (`src/types.ts`, `src/response.ts`, `src/socklet.ts`)**：
   - 定义严格泛型约束的 `Context<R>` 和 `Handler<R>`。
   - 实现 `Response` 类及 `redirect` 工厂。
   - 定义 `Socklet<W>` 接口、`SockletUpgrade<W>` 类及 `upgrade` 工厂。
4. **适配器契约 (`src/adapter.ts`)**：
   - 定义 `Adapter<App, R>` 接口，包含 `register` 和 `transform`。

**产出物**：`src` 目录下的基础类型和领域实体，编译无报错。

### Phase 2: 核心引擎实现 (Core Engine)
**目标**：完成 Tunnel 核心调度器，实现高内聚的路由注册、哈希代理分发和热更新机制。

**详细任务**：
1. **引擎编码 (`src/tunnel.ts`)**：
   - 实现 `Tunnel<App, R>` 核心类。
   - 实现 `register`：集成 Hash 算法、`linked` 状态判断、Map 内存替换以及 `adapter.register` 的触发逻辑。
   - 实现 `proxy`：闭包生成器，处理路由查找、未命中抛错逻辑，以及调用 `adapter.transform` 生成 `Context`。
   - 实现 `parse` 和 `unregister` 逻辑。
2. **统一导出 (`src/index.ts`)**：
   - 暴露 `Tunnel`, `Context`, `Handler`, `Adapter` 等核心 API。
   - 暴露 `Response`, `redirect`, `upgrade` 等工具函数。

**产出物**：完整的无框架依赖的核心引擎包，发布就绪的源码。

### Phase 3: 官方框架适配器生态 (Adapters Implementation)
**目标**：验证架构设计的灵活性，为常见框架提供开箱即用的支持。

*注：适配器实现可以选择作为单独的包 `@opendesign/tunnel-express`，或者在项目中以 `any` 或外部项目类型规避强依赖。*

**详细任务**：
1. **Express Adapter (`src/adapters/express.ts`)**：
   - **`transform`**: 解析 Express `req` 对象，生成符合 `Context<R>` 规范的结构，区分 `req.route.path` (pathname) 和 `req.path` (path)。
   - **`register`**: 
     - 包装 Express 的 `app[method](path, cb)`。
     - **智能响应推导**：解析代理返回值。
       - 识别 `Response` 实例：调用 `res.status()`, `res.set()`, `res.send()`。
       - 识别 `AsyncIterable`：设置 headers (`text/event-stream`)，遍历 yield 并调用 `res.write()`。
       - 识别 `SockletUpgrade`：结合 `express-ws` 提取 socket 实例并绑定生命周期。
       - 默认处理：调用 `res.json()` 或 `res.send()`。
     - 错误处理：`catch` 异常并调用 `next(err)`。
2. **Fastify Adapter (`src/adapters/fastify.ts`)** (规划中)：
   - 实现类似的智能响应推导，结合 Fastify 的 `reply.send()` 和 `fastify-websocket` 插件。

**产出物**：至少一个生产可用的 Express 适配器实现。

### Phase 4: 测试、文档与集成验证 (Testing & Docs)
**目标**：确保核心逻辑稳健，输出最佳实践文档。

**详细任务**：
1. **单元测试**：
   - Mock Adapter：验证 Tunnel 在多次 `register` 时的热更新行为（是否只注册了一次，闭包是否正确执行最新逻辑）。
   - 验证 Hash 算法在长短路由下的稳定性。
   - 验证路由卸载（unregister）后是否正确抛出未命中 Error。
2. **使用文档 (`README.md`)**：
   - 撰写快速入门指南。
   - 详细讲解“面向返回值编程”的最佳实践。
   - 提供 JSON, SSE, WebSocket 的代码示例。
3. **集成验证**：
   - 在真实 Express 应用中集成 Tunnel，验证冷启动、HMR 热替换的无缝体验。

**产出物**：高覆盖率的测试用例、完善的 README 和可运行的 Demo 项目。
