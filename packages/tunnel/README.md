# @opendesign/tunnel

跨框架路由中间件 - 极致轻量、高性能、框架无关。

## 核心特性

- **零代价热更新 (O(1) HMR)**：基于 FNV-1a 哈希算法的内存路由表，热替换无性能损耗
- **面向返回值编程**：业务代码仅 `return` 数据，Adapter 自动处理序列化与协议响应
- **绝对类型安全**：全链路零 `any`，泛型自动推断
- **框架无关**：同一套核心，适配 Express/Fastify/Koa/Hono

## 快速开始

### 安装

```bash
npm install @opendesign/tunnel
```

### 基础用法

```typescript
import express from 'express';
import { Tunnel, redirect, Response } from '@opendesign/tunnel';
import { createExpressAdapter } from '@opendesign/tunnel/adapters/express';

const app = express();
const tunnel = new Tunnel(app, createExpressAdapter());

// 注册路由 - 只需 return 数据
tunnel.register({
  'GET /api/users': async () => [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ],

  'GET /api/users/:id': async (ctx) => ({
    id: ctx.params.id,
    name: 'Alice',
  }),

  'POST /api/users': async (ctx) => {
    const body = ctx.body as { name: string };
    return { id: 3, name: body.name };
  },
});

app.listen(3000);
```

### 返回值类型推导

| 返回值类型 | 响应方式 |
|-----------|---------|
| `T` (普通对象) | JSON 响应 |
| `Response` | 自定义状态码/Headers |
| `AsyncIterable<T>` | Server-Sent Events (SSE) |
| `SockletUpgrade` | WebSocket 升级 |

### 自定义响应

```typescript
import { redirect, Response } from '@opendesign/tunnel';

// 重定向
'GET /old-url': () => redirect('/new-url', 301),

// 自定义状态码和 Headers
'GET /api/private': () => new Response({ error: 'Unauthorized' }, {
  status: 401,
  headers: { 'WWW-Authenticate': 'Bearer' },
}),
```

### SSE 流式响应

```typescript
'GET /api/events': () => {
  return (async function* () {
    for (let i = 0; i < 5; i++) {
      yield { time: Date.now() };
      await new Promise(r => setTimeout(r, 1000));
    }
  })();
},
```

### 热更新

```typescript
// 更新处理器，无需重启
tunnel.register({
  'GET /api/users': () => [{ id: 1, name: 'Updated' }],
});

// 卸载路由
tunnel.unregister('GET /api/users');
```

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                        Tunnel                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Registry (Map<routeId, Handler>) - O(1) 寻址     │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                │
│              ┌─────────────┴─────────────┐                  │
│              ▼                           ▼                  │
│     ┌──────────────┐            ┌──────────────┐          │
│     │   register   │            │   unregister │          │
│     └──────────────┘            └──────────────┘          │
│                            │                                │
│                            ▼                                │
│     ┌──────────────────────────────────────────────┐        │
│     │              Proxy (Flyweight)                │        │
│     │   生成闭包代理，统一分发到 Adapter            │        │
│     └──────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │       Adapter           │
              │  ┌─────────────────┐   │
              │  │ transform()     │   │ ← 框架 req → 标准 Context
              │  │ register()      │   │ ← 注册路由 + 智能响应推导
              │  └─────────────────┘   │
              └─────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
         ┌────────┐   ┌─────────┐   ┌────────┐
         │ Express│   │ Fastify │   │  Koa   │
         └────────┘   └─────────┘   └────────┘
```

## API 参考

### Tunnel

```typescript
const tunnel = new Tunnel<App, R>(app, adapter);

tunnel.register(routes);  // 批量注册路由
tunnel.unregister(key);   // 卸载路由
```

### Context<R>

| 属性 | 类型 | 说明 |
|-----|------|------|
| `method` | `Method` | HTTP 方法 |
| `pathname` | `string` | 注册时的原始路径 |
| `path` | `string` | 实际请求路径 |
| `params` | `Record<string, string \| undefined>` | 路径参数 |
| `query` | `Record<string, string \| string[] \| undefined>` | 查询参数 |
| `headers` | `Record<string, string \| string[] \| undefined>` | 请求头 |
| `body` | `unknown` | 请求体（需业务侧断言） |
| `raw` | `R` | 框架原生 Request |

### Adapter

```typescript
interface Adapter<App, R> {
  readonly name: string;
  register(app: App, method: Method, pathname: string, proxy: (raw: R) => Promise<unknown>): void;
  transform(raw: R, pathname: string, method: Method): Context<R>;
}
```

## 性能

- **O(1) 路由查找**：FNV-1a 32-bit 哈希算法，将路由字符串转为 SMI Key
- **零拷贝热更新**：直接替换 Map 中的 Handler 引用，无锁无GC压力
- **极小体积**：核心包 < 5KB，无外部依赖

## 许可证

MIT
