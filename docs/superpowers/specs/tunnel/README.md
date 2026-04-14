# Tunnel 跨框架路由适配器方案

**版本**: v1.1.0
**状态**: 进行中

Tunnel 是一套基于 Proxy/Wrapper 模式的跨框架服务端路由管理方案，旨在解决 Node.js 框架中路由热更新（HMR）和动态卸载的痛点。

---

## 文档索引

| 文档名称 | 说明 |
|------|------|
| [Tunnel 设计方案](00-tunnel/00-tunnel-design.md) | 核心原理、代理模式架构、API定义及示例 |

## 核心能力

- **极速热更新**: 通过代理模式实现 O(1) 复杂度的路由替换，无须重启服务或重载底层框架。
- **跨框架支持**: 抽象出统一的 `Adapter` 接口，轻松适配 Express, Koa, Fastify, Hono 等主流框架。
- **动态卸载路由**: 卸载路由后，请求到达时代理抛出错误，交给框架错误中间件处理。
- **极致性能**: 采用字符串 Key (`METHOD /path`) 进行 O(1) 的 Map 寻址，0 哈希开销。
- **异常隔离安全**: 安全捕获动态路由引发的异常并抛给框架，防止进程崩溃。
- **面向返回值编程**: 业务 Handler 只 return 数据，由 Adapter 负责序列化响应。

## 设计模式

| 模式 | 应用 | 价值 |
|------|------|------|
| **Facade** | Context 统一门面 | 抹平框架差异，业务代码与底层解耦 |
| **Adapter** | 框架适配器接口 | 隔离框架特定逻辑，支持扩展 |
| **Registry** | 内存 Map 路由表 | O(1) 热更新，无须触碰框架路由树 |
| **Flyweight** | 共享 proxy 函数 | 所有路由共享一个代理分发器 |

## 核心接口

```typescript
// 路由标识
export type RouteKey = `${string} ${string}`;

// 统一上下文
export interface Context<Raw = any> {
  readonly method: string;
  readonly path: string;
  readonly raw: Raw;
}

// 处理器签名
export type Handler<Raw = any> = (ctx: Context<Raw>) => any | Promise<any>;

// 适配器接口
export interface Adapter<App = any, Raw = any> {
  readonly name: string;
  register(app: App, method: string, path: string, proxy: (raw: Raw) => Promise<any>): void;
  transform(raw: Raw): Context<Raw>;
}
```
