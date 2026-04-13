# Router - 跨框架路由适配器

基于 Proxy/Wrapper 模式，支持运行时热更新与卸载。

## 特性

- **代理模式**：首次注册时向框架注册 Proxy Handler，之后热更新只改内存 Map
- **跨框架安全**：不依赖框架的 `unregister`，通过 `notFound` 处理已卸载路由
- **热更新**：重复注册同一路由只更新内存 Handler，O(1) 复杂度
- **确定性 ID**：stable-hash + base64url

## 目录结构

```
packages/router/
├── index.ts      # 统一导出
├── types.ts     # 核心类型
├── Route.ts     # 路由注册器
├── Registry.ts  # 路由注册表
├── hash.ts      # stable-hash 封装
└── design.md    # 本文档
```

## 类型

```typescript
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

export type Handler<Ctx = any, Res = any> = (ctx: Ctx) => Res | Promise<Res>;

export interface Descriptor<Ctx = any, Res = any> {
  readonly method: HttpMethod;
  readonly path: string;
  readonly handler: Handler<Ctx, Res>;
}

export type Id = string & { readonly __brand: unique symbol };

export interface Adapter<APP = any, Ctx = any, Res = any> {
  readonly name: string;
  readonly methods: HttpMethod[];
  register(app: APP, route: Descriptor<Ctx, Res>): void;
  notFound(ctx: Ctx): Res;
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
│  │  "abc123" → handler          │  │
│  └───────────────────────────────┘  │
│                 ▲                   │
│                 │                   │
│  ┌─────────────┴───────────────┐   │
│  │  Proxy Handler              │   │
│  │  → registry.get(key)        │   │
│  │  → current(ctx)             │   │
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
│  Registry.update("abc123", newH)    │
│  (只改内存 Map，不碰框架)           │
└─────────────────────────────────────┘

卸载 "GET /api/hello"
┌─────────────────────────────────────┐
│  Registry.remove("abc123")          │
│  Proxy 命中时调用 adapter.notFound() │
└─────────────────────────────────────┘
```

### 热更新流程

1. 用户调用 `register("GET", "/api/hello", handler)`
2. 若路由已存在 → 仅更新 `Registry` 中的 Handler
3. 若路由不存在 → 调用 `adapter.register()` 向框架注册 Proxy

### 卸载流程

1. 用户调用 `unregister(key)`
2. 从 `Registry` 中删除该 Handler
3. 后续请求到达时，Proxy 调用 `adapter.notFound(ctx)`

## 使用示例

```typescript
import { Route, hash } from "./index";
import type { Adapter } from "./index";

// 实现适配器
const expressAdapter: Adapter = {
  name: "express",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  
  register(app, route) {
    const method = route.method.toLowerCase();
    app[method](route.path, route.handler);
  },
  
  notFound(ctx) {
    ctx.status(404).json({ error: "Not Found" });
  },
};

// 创建路由实例
const router = new Route(expressApp, expressAdapter);

// 单个注册
router.register("GET", "/api/hello", (ctx) => ({
  message: "Hello World!",
}));

// 批量注册
router.register({
  "GET /api/user/:id": (ctx) => ({ id: ctx.params.id }),
  "POST /api/user": (ctx) => ({ success: true }),
});

// 查看路由 ID
console.log(router.keys());

// 卸载
router.unregister(hash("GET", "/api/hello"));
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
| `register(app, route)` | 注册路由到底层框架 |
| `notFound(ctx)` | 处理已卸载路由的请求 |
