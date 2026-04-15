# Tunnel 跨框架路由适配器方案

**版本**: v2.0
**状态**: 已实施

Tunnel 是一套基于 Proxy/Wrapper 模式的跨框架服务端路由管理方案，旨在解决 Node.js 框架中路由热更新（HMR）和动态卸载的痛点。

---

## 文档索引

| 文档名称 | 说明 |
|------|------|
| [Tunnel 设计方案](00-tunnel/00-tunnel-design.md) | 核心原理、代理模式架构、API定义及实施状态 |

---

## 核心能力

- **极速热更新**: 通过代理模式实现 O(1) 复杂度的路由替换，无须重启服务或重载底层框架。
- **跨框架支持**: 抽象出统一的 `Adapter` 接口，轻松适配 Express, Koa, Fastify, Hono 等主流框架。
- **动态卸载路由**: 卸载路由后，请求到达时代理抛出错误，交给框架错误中间件处理。
- **极致性能**: 采用 FNV-1a 32-bit 哈希算法将路由转为 SMI Key，O(1) Map 寻址。
- **异常隔离安全**: 安全捕获动态路由引发的异常并抛给框架，防止进程崩溃。
- **面向返回值编程**: 业务 Handler 只 return 数据，由 Adapter 负责序列化响应。
- **绝对类型安全**: 全链路零 `any`，泛型自动推断。

---

## 设计模式

| 模式 | 应用 | 价值 |
|------|------|------|
| **Facade** | Context 统一门面 | 抹平框架差异，业务代码与底层解耦 |
| **Adapter** | 框架适配器接口 | 隔离框架特定逻辑，支持扩展 |
| **Registry** | 内存 Map 路由表 | O(1) 热更新，无须触碰框架路由树 |
| **Flyweight** | 闭包捕获 method/pathname | 运行时仅一次 Map 寻址 |

---

## 核心接口

```typescript
// 路由方法
export type Method =
  | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  | 'HEAD' | 'OPTIONS' | 'TRACE' | 'CONNECT';

// 路由标识（模板字面量约束）
export type Endpoint = `${Method} ${string}`;

// 统一上下文
export interface Context<R = unknown> {
  readonly method: Method;
  readonly pathname: string;                                      // 注册时的原始路径
  readonly path: string;                                        // 实际请求路径
  readonly query: Record<string, string | string[] | undefined>;
  readonly params: Record<string, string | undefined>;
  readonly headers: Record<string, string | string[] | undefined>;
  readonly body: unknown;
  readonly raw: R;                                              // 逃生舱
}

// 处理器签名
export type Handler<R = unknown, T = unknown> = (ctx: Context<R>) => Awaitable<Reply<T>>;

// 响应类型推导
export type Reply<T = unknown> =
  | T                    // JSON
  | Response             // 自定义状态码/Headers
  | AsyncIterable<T>     // SSE
  | SockletUpgrade;      // WebSocket

// 适配器接口
export interface Adapter<App, R> {
  readonly name: string;
  register(app: App, method: Method, pathname: string, proxy: (raw: R) => Promise<unknown>): void;
  transform(raw: R, pathname: string, method: Method): Context<R>;
}
```

---

## 实施状态

| Phase | 内容 | 状态 |
|-------|------|------|
| 1 | 基础设施（类型、工具、实体） | ✅ 完成 |
| 2 | 核心引擎（Tunnel + O(1) HMR） | ✅ 完成 |
| 3 | Hono Adapter | ✅ 完成 |
| 4 | 测试与文档 | ✅ 完成 |
