# @opendesign/tunnel 跨框架路由适配器方案

**版本**: v3.0
**状态**: 设计完成

***

## 一、核心价值

| 能力                               | 说明                                       |
| -------------------------------- | ---------------------------------------- |
| **零代价热更新 (HMR)**                 | FNV-1a 哈希 + 内存 Map，O(1) 路由热替换            |
| **13 个响应函数**                     | 统一 Hono 风格签名 `(data, status?, headers?)` |
| **Reply<T>** **= T \| Response** | 普通对象兜底 JSON / 响应函数直接透传                   |
| **前缀** **`**`** **通配符**          | 批量卸载路由                                   |
| **操作结果明确**                       | `register`/`unregister`/`has` 返回语义清晰     |
| **reply 二分支**                    | Response 透传 / T 兜底 json                  |
| **无 update**                     | register 注册时直接替换旧 handler                |

***

## 二、目录结构

```
packages/tunnel/
├── src/
│   ├── index.ts              # 统一导出
│   ├── utils.ts              # FNV-1a Hash, Method, Endpoint
│   ├── types.ts              # Context, Handler, Reply<T>, 响应函数签名
│   ├── mime.ts               # MIME_TYPES + ContentType 类型推导
│   ├── adapter.ts            # Adapter 接口
│   ├── tunnel.ts             # 核心引擎
│   └── adapters/
│       └── hono.ts           # Hono 适配器
├── tests/
│   ├── tunnel.test.ts
│   └── hash.test.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

***

## 三、核心工具 (`utils.ts`)

```typescript
export type Method =
  | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  | 'HEAD' | 'OPTIONS' | 'TRACE' | 'CONNECT';

export type Endpoint = `${Method} ${string}`;

const FNV_PRIME = 0x01000193;
const FNV_OFFSET_BASIS = 0x811c9dc5;

export function hash(endpoint: Endpoint | string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < endpoint.length; i++) {
    hash ^= endpoint.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}
```

***

## 四、MIME 类型 (`mime.ts`)

```typescript
export const MIME_TYPES = {
  aac: 'audio/aac',
  avi: 'video/x-msvideo',
  bmp: 'image/bmp',
  css: 'text/css',
  csv: 'text/csv',
  eot: 'application/vnd.ms-fontobject',
  epub: 'application/epub+zip',
  gif: 'image/gif',
  gz: 'application/gzip',
  htm: 'text/html',
  html: 'text/html',
  ico: 'image/x-icon',
  ics: 'text/calendar',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  js: 'text/javascript',
  json: 'application/json',
  jsonld: 'application/ld+json',
  m3u8: 'application/vnd.apple.mpegurl',
  m4a: 'audio/mp4',
  md: 'text/markdown',
  mid: 'audio/midi',
  midi: 'audio/midi',
  mjs: 'text/javascript',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  mpeg: 'video/mpeg',
  mpkg: 'application/vnd.apple.installer+xml',
  odb: 'application/vnd.oasis.opendocument.database',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  odt: 'application/vnd.oasis.opendocument.text',
  oga: 'audio/ogg',
  ogv: 'video/ogg',
  ogx: 'application/ogg',
  opus: 'audio/opus',
  otf: 'font/otf',
  pdf: 'application/pdf',
  png: 'image/png',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  rar: 'application/vnd.rar',
  rtf: 'application/rtf',
  s3tc: 'image/s3tc',
  sevenZ: 'application/x-7z-compressed',
  svg: 'image/svg+xml',
  svgz: 'image/svg+xml',
  t8gt: 'image/t8gt',
  tar: 'application/x-tar',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  ts: 'video/mp2t',
  ttf: 'font/ttf',
  txt: 'text/plain',
  vnd: 'application/vnd.oasis.opendocument.graphics',
  wasm: 'application/wasm',
  wav: 'audio/wav',
  webp: 'image/webp',
  woff: 'font/woff',
  woff2: 'font/woff2',
  xhtml: 'application/xhtml+xml',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xml: 'application/xml',
  xul: 'application/vnd.mozilla.xul+xml',
  zip: 'application/zip',
  '3gp': 'video/3gpp',
  '3g2': 'video/3gpp2',
  '7z': 'application/x-7z-compressed',
} as const;

export type ContentType = (typeof MIME_TYPES)[keyof typeof MIME_TYPES];
```

***

## 五、核心类型 (`types.ts`)

### 5.1 基础类型

```typescript
export type Awaitable<T> = T | Promise<T>;
```

### 5.2 Context

```typescript
export interface Context<P = unknown, L = unknown> {
  readonly method: Method;
  readonly pathname: string;
  readonly path: string;
  readonly query: Record<string, string | string[] | undefined>;
  readonly params: Record<string, string | undefined>;
  readonly headers: Record<string, string | string[] | undefined>;
  readonly body: L;
  readonly raw: P;
}
```

### 5.3 Reply 与 Handler

```typescript
export type Reply<R = unknown> = R | Response;

export type Handler<P = unknown, R = unknown, L = unknown> = (ctx: Context<P, L>) => Awaitable<Reply<R>>;

export type Routes<P = unknown> = Record<string, Handler<P>>;
```

### 5.4 Headers 与 StatusCode

```typescript
export type ResponseHeadersInit =
  | Record<string, string | string[]>
  | [string, string][]
  | Headers

export type StatusCode =
  | 100 | 101 | 102 | 103
  | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226
  | 300 | 301 | 302 | 303 | 304 | 305 | 307 | 308
  | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451
  | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 | 599
  | number
```

### 5.5 响应函数签名（统一 Hono 风格）

```typescript
// ========== JSON ==========
export function json<T extends JSONValue>(
  data: T,
  init?: ResponseHeadersInit | StatusCode
): Response

export function json<T extends JSONValue, U extends StatusCode = 200>(
  data: T,
  status?: U,
  headers?: ResponseHeadersInit
): Response

// ========== HTML ==========
export function html<T extends string>(
  html: T,
  init?: ResponseHeadersInit | StatusCode
): Response

export function html<T extends string, U extends StatusCode = 200>(
  html: T,
  status?: U,
  headers?: ResponseHeadersInit
): Response

// ========== TEXT ==========
export function text<T extends string>(
  text: T,
  init?: ResponseHeadersInit | StatusCode
): Response

export function text<T extends string, U extends StatusCode = 200>(
  text: T,
  status?: U,
  headers?: ResponseHeadersInit
): Response

// ========== XML ==========
export function xml<T extends string>(
  xml: T,
  init?: ResponseHeadersInit | StatusCode
): Response

export function xml<T extends string, U extends StatusCode = 200>(
  xml: T,
  status?: U,
  headers?: ResponseHeadersInit
): Response

// ========== BODY ==========
export type BodyData = string | ArrayBuffer | ReadableStream | Uint8Array

export function body<T extends BodyData>(
  data: T,
  init?: ResponseHeadersInit | StatusCode
): Response

export function body<T extends BodyData, U extends StatusCode = 200>(
  data: T,
  status?: U,
  headers?: ResponseHeadersInit
): Response

// ========== NOT_FOUND ==========
export function notFound(message?: string): Response

// ========== REDIRECT ==========
export function redirect(location: string, status?: StatusCode): Response

// ========== BLOB ==========
export function blob<T extends BodyData>(
  data: T,
  contentType?: ContentType,
  init?: ResponseHeadersInit | StatusCode
): Response

export function blob<T extends BodyData, U extends StatusCode = 200>(
  data: T,
  contentType?: ContentType,
  status?: U,
  headers?: ResponseHeadersInit
): Response

// ========== ARRAY_BUFFER ==========
export function arrayBuffer<T extends ArrayBuffer | ArrayBufferView | BodyData>(
  data: T,
  contentType?: ContentType,
  init?: ResponseHeadersInit | StatusCode
): Response

export function arrayBuffer<T extends ArrayBuffer | ArrayBufferView | BodyData, U extends StatusCode = 200>(
  data: T,
  contentType?: ContentType,
  status?: U,
  headers?: ResponseHeadersInit
): Response

// ========== STREAM ==========
export function stream<T extends ReadableStream>(
  readable: T,
  contentTypeOrInit?: ContentType | ResponseHeadersInit | StatusCode,
  statusOrHeaders?: StatusCode | ResponseHeadersInit,
  headers?: ResponseHeadersInit
): Response

// ========== STREAM_TEXT ==========
export function streamText<T extends string>(
  text: T,
  contentTypeOrInit?: ContentType | ResponseHeadersInit | StatusCode,
  statusOrHeaders?: StatusCode | ResponseHeadersInit,
  headers?: ResponseHeadersInit
): Response

// ========== STREAM_SSE ==========
export function streamSSE<T extends AsyncIterable<any>>(
  source: T,
  statusOrInit?: StatusCode | ResponseHeadersInit,
  headers?: ResponseHeadersInit
): Response

// ========== UPGRADE_WEBSOCKET ==========
export function upgradeWebSocket(
  statusOrInit?: StatusCode | ResponseHeadersInit,
  headers?: ResponseHeadersInit
): Response
```

### 5.6 响应函数汇总

| 函数                                                   | content-type      | 签名      |
| ---------------------------------------------------- | ----------------- | ------- |
| `json(data, status?, headers?)`                      | application/json  | Hono 重载 |
| `html(html, status?, headers?)`                      | text/html         | Hono 重载 |
| `text(text, status?, headers?)`                      | text/plain        | Hono 重载 |
| `xml(xml, status?, headers?)`                        | application/xml   | Hono 重载 |
| `body(data, status?, headers?)`                      | -                 | Hono 重载 |
| `notFound(message?)`                                 | -                 | 简洁      |
| `redirect(location, status?)`                        | -                 | Hono 风格 |
| `blob(data, contentType?, status?, headers?)`        | 自定义               | Hono 重载 |
| `arrayBuffer(data, contentType?, status?, headers?)` | 自定义               | Hono 重载 |
| `stream(readable, contentType?, status?, headers?)`  | 自定义               | Hono 重载 |
| `streamText(text, contentType?, status?, headers?)`  | text/plain        | Hono 重载 |
| `streamSSE(source, status?, headers?)`               | text/event-stream | Hono 重载 |
| `upgradeWebSocket(status?, headers?)`                | -                 | Hono 重载 |

***

## 六、适配器接口 (`adapter.ts`)

```typescript
export interface Adapter<T, P> {
  readonly app: T;
  readonly name: string;

  register(
    method: Method,
    pathname: string,
    proxy: (raw: P) => Promise<unknown>
  ): void;

  unregister(method: Method, pathname: string): boolean;

  transform<L = unknown>(raw: P, pathname: string, method: Method): Context<P, L>;
}
```

***

## 七、核心引擎 (`tunnel.ts`)

### 7.1 路由匹配分析

**`/api/*`** **和** **`/api/hello`** **不冲突**：

| 访问路径         | 匹配结果                                               |
| ------------ | -------------------------------------------------- |
| `/api/hello` | 精确路由 `/api/hello` **优先**匹配，然后 `/api/*` 作为 fallback |
| `/api/foo`   | 只匹配 `/api/*`                                       |

**Hono 优先级规则**：

1. 静态路由优先（不含 `*` 和 `:`）
2. 路径长度升序（短的在前）
3. 注册顺序决定相同优先级的顺序

### 7.2 HTTP Method 校验

使用 `VALID_METHODS` Set 校验所有 HTTP 方法，拒绝非法方法：

```typescript
const VALID_METHODS = new Set<Method>([
  'GET', 'POST', 'PUT', 'DELETE', 'PATCH',
  'HEAD', 'OPTIONS', 'TRACE', 'CONNECT'
]);
```

非法 method 会抛出 `[Tunnel] Invalid HTTP Method: "${method}"` 错误。

### 7.3 核心实现

```typescript
interface Route<P> {
  key: string;
  method: Method;
  pathname: string;
  handler: Handler<P>;
}

export class Tunnel<T, P> {
  private registry = new Map<number, Route<P>>();

  constructor(
    private adapter: Adapter<T, P>
  ) {}

  register<const Routes extends Routes<R>>(routes: Routes): void {
    for (const [key, handler] of Object.entries(routes)) {
      const [method, pathname] = this.parse(key);
      const endpoint = `${method} ${pathname}` as Endpoint;
      const routeId = hash(endpoint);

      const route: Route<R> = { key, method, pathname, handler };
      const isLinked = this.registry.has(routeId);

      this.registry.set(routeId, route);

      if (!isLinked) {
        this.adapter.register(
          method,
          pathname,
          this.proxy(routeId)
        );
      }
    }
  }

  has(key: string): boolean {
    const [method, pathname] = this.parse(key);
    const routeId = hash(`${method} ${pathname}`);
    return this.registry.has(routeId);
  }

  unregister(key: string): boolean {
    if (key === '*' || key === '**') {
      return false;
    }

    if (key.endsWith('**')) {
      const prefix = key.slice(0, -2);
      let deleted = false;
      for (const [id, route] of this.registry) {
        if (route.key.startsWith(prefix)) {
          this.registry.delete(id);
          this.adapter.unregister(route.method, route.pathname);
          deleted = true;
        }
      }
      return deleted;
    }

    const [method, pathname] = this.parse(key);
    const routeId = hash(`${method} ${pathname}`);
    const existed = this.registry.has(routeId);
    this.registry.delete(routeId);
    this.adapter.unregister(method, pathname);
    return existed;
  }

  private proxy(routeId: number) {
    return async (raw: R): Promise<unknown> => {
      const route = this.registry.get(routeId);
      if (!route) {
        throw new Error(`[Tunnel] Route Not Found: ${routeId}`);
      }
      const ctx = this.adapter.transform(raw, route.pathname, route.method);
      return await route.handler(ctx);
    };
  }

  private parse(key: string): [Method, string] {
    const idx = key.indexOf(' ');
    if (idx === -1) throw new Error(`[Tunnel] Invalid Endpoint: "${key}"`);
    const method = key.slice(0, idx).toUpperCase() as Method;
    if (!VALID_METHODS.has(method)) {
      throw new Error(`[Tunnel] Invalid HTTP Method: "${method}"`);
    }
    const pathname = key.slice(idx + 1);
    return [method, pathname];
  }
}
```

***

## 八、Hono 适配器 (`adapters/hono.ts`)

### 8.1 核心功能

```typescript
export class Hono implements Adapter<HonoApp, HonoContext> {
  private readonly routeMap = new Map<string, (raw: HonoContext) => void>();

  register(method: Method, pathname: string, proxy: (raw: HonoContext) => Promise<unknown>): void {
    const handler = async (c: HonoContext) => {
      try {
        const body = await this.body(c);
        const enhancedRaw = c as HonoContext & { body: unknown };
        enhancedRaw.body = body;
        const result = await proxy(enhancedRaw);
        return await reply(result, c);
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error(String(error));
      }
    };
    // ... route registration
  }

  unregister(method: Method, pathname: string): boolean {
    const routeKey = `${method} ${pathname}`;
    return this.routeMap.delete(routeKey);
  }

  async body(raw: HonoContext): Promise<unknown> {
    // 自动解析 JSON/formData/text 请求体
  }

  transform<L = unknown>(raw: HonoContext & { body?: unknown }, pathname: string, method: Method): Context<HonoContext, L> {
    // headers 多值支持
    // query 参数多值支持
    // body 从 body 获取
  }
}
```

### 8.2 Body 解析

自动根据 `Content-Type` 解析请求体（Hono 适配器使用 `c.req` 封装方法）：

| Content-Type | Hono 适配器解析方式 |
|--------------|---------|
| `application/json` | `c.req.json()` |
| `application/x-www-form-urlencoded` | `c.req.text()` |
| `multipart/form-data` | `c.req.formData()` |
| 其他 | `c.req.text()` |

### 8.3 Headers 多值支持

```typescript
const headers: Record<string, string | string[]> = {};
raw.req.raw.headers.forEach((value, key) => {
  // 多值 header 自动收集为数组
});
```

### 8.4 reply<T> 类型安全保证

```typescript
async function reply<T>(result: Reply<T>, c: HonoContext): Promise<Response> {
  if (result instanceof Response) {
    return result;         // 分支1: Response 直接透传
  }
  return c.json(result);  // 分支2: T 兜底 json
}
```

| 场景 | 输入类型 | 分支 |
|---|---|---|
| `json({a:1})` | `Reply<{a:number}>` | `c.json(result)` |
| `html('<h1>')` | `Reply<string>` | `return result` |
| `new Response()` | `Reply<unknown>` | `return result` |
| `notFound()` | `Reply<never>` | `return result` |

***

## 九、使用示例

```typescript
import { Tunnel, createHonoAdapter, json, html, notFound, redirect, stream } from '@opendesign/tunnel'

const app = new Hono()
const adapter = new HonoAdapter(app) // 或者使用 createHonoAdapter
const tunnel = new Tunnel(adapter)

// 注册路由（/api/* 和 /api/hello 不冲突）
tunnel.register({
  "GET /api/*": () => ({ fallback: true }),
  "GET /api/hello": () => html("<h1>Hello</h1>"),
  "GET /api/json": () => json({ a: 1 }, 201, { 'X-Cache': 'MISS' }),
  "GET /api/redirect": () => redirect("/new-location", 301),
})

// 热替换（直接 register 相同 key 即可）
tunnel.register({
  "GET /api/json": () => json({ b: 2 }, 200)  // 替换旧 handler
})

// 卸载
const deleted = tunnel.unregister("GET /api/*")
const prefixDeleted = tunnel.unregister("GET /api/**")
const exists = tunnel.has("GET /api/json")
```

***

## 十、向后兼容

| 场景                                         | 处理方式                                   |
| ------------------------------------------ | -------------------------------------- |
| `tunnel.register({ "GET /": () => ({}) })` | 兼容，Handler 返回对象由 `reply` 兜底 `c.json()` |
| 响应函数 `json()`, `html()` 等                  | 直接透传                                   |

***

## 十一、边界条件

| 操作                          | 行为                 |
| --------------------------- | ------------------ |
| `unregister('*')`           | 返回 `false`，拒绝执行    |
| `unregister('**')`          | 返回 `false`，拒绝执行    |
| `unregister('GET /api/**')` | 前缀卸载所有匹配路由，同时调用 `adapter.unregister()` |
| `register` 相同 key           | 直接替换旧 handler（热更新） |
| 非法 HTTP method             | 抛出 `[Tunnel] Invalid HTTP Method` |

***

## 十二、内存泄漏防护

> **重要**：Tunnel 的 `unregister` 现在会调用 `adapter.unregister()` 通知底层框架移除路由。

**适配器实现要求**：

- 适配器需要维护 `routeMap` 记录已注册的路由
- `unregister` 方法需要能够从底层框架中移除路由句柄
- 如果底层框架不支持路由卸载，`unregister` 应返回 `false`

**建议**：

- 适用于固定路径的 HMR 热更新或低频的动态路由增删
- **不要**频繁注册/卸载带有动态参数的新路径（如 `/api/temp-1`, `/api/temp-2`），这可能导致底层路由树膨胀

***

## 十三、文件变更

| 操作     | 文件                     |
| ------ | ---------------------- |
| **新增** | `src/mime.ts`          |
| **修改** | `src/types.ts`         |
| **修改** | `src/tunnel.ts`        |
| **修改** | `src/adapter.ts`       |
| **修改** | `src/adapters/hono.ts` |
| **修改** | `src/response.ts`     |
| **修改** | `src/index.ts`         |
| **新增** | `tests/` 适配器测试      |

***

## 十四、设计决策汇总

| 项目         | 决策                                     |
| ---------- | -------------------------------------- |
| MIME 类型    | 运行时对象 + `as const` + 类型推导              |
| Reply<R>   | `R \| Response`，简化为 2 种                |
| reply()    | 2 分支：Response 透传 / R 兜底 json           |
| unregister | 返回 `boolean`，同时调用 `adapter.unregister()` |
| 前缀通配符      | `**`，拒绝单独 `*`/`**`                     |
| 响应函数签名     | 统一 Hono 风格 `(data, status?, headers?)` |
| **update** | **废除**，register 注册时直接替换旧 handler       |
| 路由冲突       | `/api/*` 和 `/api/hello` 不冲突，精确优先       |
| HTTP method 校验 | 使用 `VALID_METHODS` Set，拒绝非法 method |
| Body 解析    | Hono 适配器自动解析 JSON/formData/text       |
| Headers 多值   | `forEach` 遍历收集多值 header 为数组            |
| streamSSE 错误处理 | 忽略错误，优雅关闭 (`controller.close()`)   |
| Adapter 接口  | `Adapter<T, P>` 泛型，`T`=app类型，`P`=platform类型 |
| 泛型命名 | 使用 `T、P、R、L` 单字母命名 |

***

## 十五、缺失的特性和局限性说明

在当前 v3.0 版本设计中，针对框架泛用性和轻量级的目标，部分功能被**刻意省略或存在局限性**。在选择本库或编写适配器时需要注意：

### 15.1 中间件与插件机制
- **现状**：`@opendesign/tunnel` 核心引擎不支持路由级或全局级别的中间件数组（如 `(ctx, next) => void` 机制）。
- **绕过方案**：
  1. 在底层框架级别应用中间件（如 `app.use('*', authMiddleware)`）。
  2. 在注册的 `handler` 内部进行函数式的高阶包装。

### 15.2 跨框架类型提取
- **现状**：不同的底层框架对于 Path Parameters (如 `/user/:id` 与 `/user/{id}`) 的定义语法不同，且提取到的 params 结构可能并不一致。
- **局限**：目前的 `Context<P, L>` 泛型未对 `params` 提供类型推导机制。虽然实际取值有效，但 IDE 中 `ctx.params` 被推导为 `Record<string, string | undefined>`。

### 15.3 Response 响应体状态同步
- **现状**：虽然统一使用 `reply` 包装器转换为了标准 Web `Response` 对象，但适配器实现并没有将最终状态码或自定义头部同步写回到底层框架的 Response API 中。
- **局限**：若底层框架的中间件依赖读取该响应的状态（例如 Express/Fastify 的 logger 中间件），因为适配器跳过了底层 `res.send()`，可能会记录为不正确的状态（比如始终显示 200 或未完成）。
- **要求**：在非 Web 标准请求模型的框架（如 Express/Fastify）中编写 Adapter 时，需要显式地从 Web Response 解包数据并调用如 `res.status().set().send()` 的方法。

