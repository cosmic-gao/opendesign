# Tunnel - 跨框架路由适配器

基于 Proxy/Wrapper 模式，支持运行时热更新与卸载。

## 特性

- **代理模式**：首次注册时向框架注册 Proxy Handler，之后热更新只改内存 Map
- **跨框架安全**：不依赖框架的 `unregister`，通过 `notFound` 处理已卸载路由
- **极速热更新**：重复注册同一路由只更新内存 Handler，时间复杂度 O(1)
- **高性能路由匹配**：使用 `[Method]:[Path]` 组合字符串作为 Key，100% 防碰撞且极致提升 Map 寻址速度
- **异常隔离安全**：Proxy 代理层提供强大的异常捕获，避免未捕获的错误导致进程崩溃
- **优雅穿透 (Fallthrough)**：在找不到路由时，允许控制权穿透到框架底层的全局 `notFound` 中间件

## 目录结构

```
packages/tunnel/
├── index.ts      # 统一导出
├── types.ts     # 核心类型
├── Route.ts     # 路由注册器
├── Registry.ts  # 路由注册表
└── design.md    # 本文档
```

## 类型

```typescript
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

export type Handler<Ctx = any, Res = any> = (ctx: Ctx, next?: Function) => Res | Promise<Res>;

export interface Descriptor<Ctx = any, Res = any> {
  readonly method: HttpMethod;
  readonly path: string;
  readonly handler: Handler<Ctx, Res>;
}

export type Id = string & { readonly __brand: unique symbol };

export interface Adapter<APP = any, Ctx = any, Res = any> {
  readonly name: string;
  readonly methods: HttpMethod[];
  register(app: APP, route: Descriptor<Ctx, Res>, proxyHandler: Handler<Ctx, Res>): void;
  notFound(ctx: Ctx, next?: Function): Res | void;
}
```

## 核心机制

### 代理模式

```
首次注册 "GET /api/hello"
┌─────────────────────────────────────┐
│  Route                              │
│  ┌───────────────────────────────┐  │
│  │  Registry (Map)               │  │
│  │  "GET:/api/hello" → handler   │  │
│  └───────────────────────────────┘  │
│                 ▲                   │
│                 │                   │
│  ┌─────────────┴───────────────┐   │
│  │  Proxy Handler              │   │
│  │  → registry.get(key)        │   │
│  │  → catch Error → next(err)  │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│  Express / Fastify / Hono / Koa     │
│  app.get('/api/hello', proxy)       │
└─────────────────────────────────────┘

热更新 "GET /api/hello" (新 handler)
┌─────────────────────────────────────┐
│  Registry.update("GET:/api/hello", newH)
│  (只改内存 Map，不碰框架)           │
└─────────────────────────────────────┘

卸载 "GET /api/hello"
┌─────────────────────────────────────┐
│  Registry.remove("GET:/api/hello")  │
│  Proxy 命中时调用 adapter.notFound() │
└─────────────────────────────────────┘
```

### 热更新流程

1. 用户调用 `register("GET", "/api/hello", handler)`
2. 若路由已存在 → 仅更新 `Registry` 中的 Handler
3. 若路由不存在 → 调用 `adapter.register()` 向框架注册 Proxy

### 卸载流程

1. 用户调用 `unregister("GET:/api/hello")`
2. 从 `Registry` 中删除该 Handler
3. 后续请求到达时，Proxy 查找不到对应的 Handler，此时调用 `adapter.notFound(ctx, next)` 将控制流还给底层框架。

## 性能与健壮性保障设计

1. **组合字符串作为 Key**：取代复杂的 Hash 计算。使用 `GET:/api/hello` 直接作为 `Map` 的 key，不仅消除了 Hash 的 CPU 开销以及 Hash 碰撞风险，还充分利用了 V8 对字符串 Map 键的深度优化，同时在调试时可读性极高。
2. **轻量的 Proxy Handler**：Proxy 内部设计成一层“透传”逻辑，只有在处理异常和找不到路由时才执行特殊操作。通过直接 `return handler(ctx)`，消除多余的 `async/await` 包装。
3. **健壮的错误捕获隔离**：真实 Handler 中的错误（包括同步和异步的异常）由 Proxy 全面捕获，并通过 `next(err)` 或框架专用的错误机制进行安全传递，防止 Node.js 进程奔溃。
4. **僵尸路由优雅穿透**：当卸载了某个路由时，代理并不强制返回 `404 Not Found`，而是通过调用 `next()` (如果有) 将请求穿透给底层框架本身的 404 处理链路，遵循框架的原生行为，保持对用户配置链路的尊重。

## 使用示例

```typescript
import { Route } from "./index";
import type { Adapter } from "./index";

// 构造路由键名
const createKey = (method: string, path: string) => `${method.toUpperCase()}:${path}`;

// 实现适配器 (以 Express 为例)
const expressAdapter: Adapter = {
  name: "express",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  
  // 必须挂载代理函数，而不是直接挂载真实的 handler
  register(app, route, proxyHandler) {
    const method = route.method.toLowerCase();
    app[method](route.path, proxyHandler);
  },
  
  // 路由被卸载（找不到时），优雅地交给下方的 Express 错误/404 中间件
  notFound(ctx, next) {
    if (next) {
      next();
    } else {
      ctx.res.status(404).json({ error: "Not Found" });
    }
  },
};

// 创建路由实例
const router = new Route(expressApp, expressAdapter);

// 注册单个路由
router.register("GET", "/api/hello", async (req, res, next) => {
  res.json({ message: "Hello World!" });
});

// 查看所有已注册路由
console.log(router.keys());

// 卸载
router.unregister(createKey("GET", "/api/hello"));
```

## API

### Route

| 方法 | 说明 |
|------|------|
| `register(method, path, handler)` | 注册单个路由 |
| `register(routes)` | 批量注册路由 |
| `unregister(key)` | 卸载路由 |
| `reload()` | 重载所有路由 |
| `keys()` | 获取所有路由 ID |

### Adapter

| 属性 | 说明 |
|------|------|
| `name` | 适配器名称 |
| `methods` | 支持的 HTTP 方法 |
| `register(app, route, proxy)` | 注册 Proxy 到底层框架 |
| `notFound(ctx, next?)` | 处理已卸载路由的请求并穿透 |
