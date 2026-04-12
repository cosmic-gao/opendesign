# @opentunnel 通用路由解析器设计文档

**版本**: v1.0.0  
**日期**: 2026-04-12  
**状态**: 已批准

---

## 1. 项目概述

### 1.1 核心定位

- **一句话描述**：运行时无关的 API 路由参数解析库，通过适配器支持 Koa/Express/Hono 环境
- **核心价值**：零依赖、纯 TypeScript、高度类型安全

### 1.2 设计原则

| 原则 | 说明 |
|------|------|
| **严格类型安全** | 模板字面量类型推断 params，zod schema 推断 query/body |
| **统一命名风格** | 描述性强、现代 TS 风格 |
| **SSOT 原则** | 统一数据结构 `RequestInfo` 作为单一数据源 |
| **最小依赖** | 核心包仅依赖 `path-to-regexp` 和 `zod` |

---

## 2. 架构设计

### 2.1 整体架构

采用 **Facade + Adapter + Pure Parser** 三层架构，适配器包含解析器：

```
┌─────────────────────────────────────────────────────────────────┐
│                        Tunnel Facade                             │
│                     createTunnel(framework)                      │
└─────────────────────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────────┐   ┌─────────────────────────────────┐
│  ParserFactory    │   │       AdapterFactory              │
│  (path-to-regexp) │   │  KoaAdapter / ExpressAdapter /   │
│  - 解析路径参数     │   │  HonoAdapter                     │
│  - 管理缓存        │   │  - 提取 body/header/query        │
│  - 类型推断        │   │  - 包含解析器                      │
└───────────────────┘   └─────────────────────────────────┘
            │                      │
            └──────────┬───────────┘
                       ▼
              RequestInfo (统一结构)
```

### 2.2 层级职责

| 层级 | 职责 | 特点 |
|------|------|------|
| **Facade (Tunnel)** | 整合 Parser 与 Adapter，提供统一 API | 类型安全入口 |
| **AdapterFactory** | 创建框架适配器 Koa/Express/Hono | 框架相关 |
| **Adapter** | 提取请求信息（body/header/query） | 框架相关，包含解析器 |
| **ParserFactory** | 路由模式编译与匹配，缓存管理 | 框架无关 |

---

## 3. 目录结构

```
packages/tunnel/
├── core/                         # @opentunnel/core (运行时无关)
│   ├── types.ts                  # 类型定义与推断
│   ├── parser.ts                 # 路由解析逻辑 (path-to-regexp)
│   ├── adapter.ts                # 适配器接口
│   ├── tunnel.ts                 # 核心 Facade
│   ├── errors.ts                 # 错误定义
│   ├── index.ts                  # 统一导出
│   └── tsconfig.json
│
├── adapters/                     # 适配器实现
│   ├── koa/                      # @opentunnel/koa
│   │   ├── adapter.ts
│   │   ├── index.ts
│   │   └── tsconfig.json
│   ├── express/                  # @opentunnel/express
│   │   ├── adapter.ts
│   │   ├── index.ts
│   │   └── tsconfig.json
│   └── hono/                     # @opentunnel/hono
│       ├── adapter.ts
│       ├── index.ts
│       └── tsconfig.json
```

---

## 4. 核心类型设计

### 4.1 统一数据结构（SSOT）

```typescript
export interface RequestInfo {
  pathname: string   // 原始请求路径
  method: string      // HTTP 方法
  params: object      // 路径参数（静态推断）
  query: object       // 查询参数（zod schema 推断）
  body: object        // 请求体（zod schema 推断 + 自动解析）
  header: object      // 请求头
}
```

### 4.2 路径参数类型推断

```typescript
// 辅助类型：解析 RESTful 和 Wildcard 模式
export type ExtractRouteParams<TPath extends string> = Prettify<
  string extends TPath
    ? Record<string, string>
    : TPath extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? Param extends `${infer Name}?`
      ? { [K in Name]?: string } & ExtractRouteParams<`/${Rest}`>
      : { [K in Param]: string } & ExtractRouteParams<`/${Rest}`>
    : TPath extends `${infer _Start}:${infer Param}`
    ? Param extends `${infer Name}?`
      ? { [K in Name]?: string }
      : { [K in Param]: string }
    : TPath extends `${infer _Start}*${infer Wildcard}/${infer Rest}`
    ? { [K in Wildcard]: string } & ExtractRouteParams<`/${Rest}`>
    : TPath extends `${infer _Start}*${infer Wildcard}`
    ? { [K in Wildcard]: string }
    : {}
>;
```

### 4.3 类型推断表现

| 模式 | 推断类型 |
|------|----------|
| `/users/:id` | `{ id: string }` |
| `/users/:id?` | `{ id?: string }` |
| `/*filepath` | `{ filepath: string }` |

> **注意**：`path-to-regexp` 使用 `{/:id}` 语法表示可选参数

### 4.4 错误类型

```typescript
export type TunnelErrorCode = 
  | 'PATH_MISMATCH'
  | 'VALIDATION_ERROR'
  | 'INVALID_BODY'
  | 'ADAPTER_ERROR';

export class TunnelError extends Error {
  constructor(
    public readonly code: TunnelErrorCode,
    message: string,
    public readonly path?: string,
    public readonly value?: unknown
  ) {
    super(message);
    this.name = 'TunnelError';
  }
}
```

---

## 5. 适配器接口

### 5.1 适配器基类

```typescript
import type { RequestInfo } from './types';

export abstract class BaseAdapter<TRequest> {
  protected abstract parseBody(req: TRequest): Promise<object>;
  protected abstract extractHeaders(req: TRequest): object;
  protected abstract extractQuery(req: TRequest): object;
  
  public async extract(req: TRequest): Promise<RequestInfo> {
    const [body, header, query] = await Promise.all([
      this.parseBody(req),
      Promise.resolve(this.extractHeaders(req)),
      Promise.resolve(this.extractQuery(req))
    ]);
    
    return {
      pathname: this.extractPathname(req),
      method: this.extractMethod(req),
      params: {},      // 由 Parser 填充
      query,
      body,
      header
    };
  }
  
  protected abstract extractPathname(req: TRequest): string;
  protected abstract extractMethod(req: TRequest): string;
}
```

### 5.2 解析器接口

```typescript
import type { MatchFunction } from 'path-to-regexp';

export interface ParseResult {
  params: Record<string, string | undefined>;
}

export class RouteParser {
  private cache = new Map<string, MatchFunction>();
  
  public parse(pathname: string, pattern: string): ParseResult | null {
    let matcher = this.cache.get(pattern);
    if (!matcher) {
      matcher = match(pattern, { decode: decodeURIComponent });
      this.cache.set(pattern, matcher);
    }
    const result = matcher(pathname);
    if (!result) return null;
    return { params: result.params as Record<string, string | undefined> };
  }
}
```

---

## 6. Tunnel Facade

### 6.1 核心实现

```typescript
import type { Framework, RequestInfo, ExtractRouteParams, ZodSchema } from './types';
import { TunnelError, TunnelErrorCode } from './errors';
import { RouteParser } from './parser';
import { createAdapter } from './adapter-factory';

export interface TunnelOptions {
  framework: Framework;
  throwOnError?: boolean;  // 默认 true
}

export class Tunnel {
  private readonly parser: RouteParser;
  private readonly adapter: ReturnType<typeof createAdapter>;
  
  constructor(options: TunnelOptions) {
    this.parser = new RouteParser();
    this.adapter = createAdapter(options.framework);
  }
  
  public async match<TPath extends string>(
    req: unknown,
    pattern: TPath,
    schemas?: {
      query?: ZodSchema;
      body?: ZodSchema;
    }
  ): Promise<RequestInfo> {
    // 1. 提取请求信息
    const info = await this.adapter.extract(req);
    
    // 2. 解析路径参数
    const parseResult = this.parser.parse(info.pathname, pattern);
    if (!parseResult) {
      throw new TunnelError('PATH_MISMATCH', `Pattern "${pattern}" does not match "${info.pathname}"`);
    }
    info.params = parseResult.params;
    
    // 3. 验证 query
    if (schemas?.query) {
      const result = schemas.query.safeParse(info.query);
      if (!result.success) {
        throw new TunnelError('VALIDATION_ERROR', 'Query validation failed', 'query', result.error);
      }
      info.query = result.data;
    }
    
    // 4. 验证 body
    if (schemas?.body) {
      const result = schemas.body.safeParse(info.body);
      if (!result.success) {
        throw new TunnelError('VALIDATION_ERROR', 'Body validation failed', 'body', result.error);
      }
      info.body = result.data;
    }
    
    return info;
  }
}

export function createTunnel(options: TunnelOptions): Tunnel {
  return new Tunnel(options);
}
```

---

## 7. 框架适配器实现

### 7.1 Koa 适配器

```typescript
import type { Context } from 'koa';
import { BaseAdapter } from '@opentunnel/core';

export class KoaAdapter extends BaseAdapter<Context> {
  protected extractPathname(req: Context): string {
    return req.path;
  }
  
  protected extractMethod(req: Context): string {
    return req.method;
  }
  
  protected extractHeaders(req: Context): object {
    return req.headers as object;
  }
  
  protected extractQuery(req: Context): object {
    return req.query as object;
  }
  
  protected async parseBody(req: Context): Promise<object> {
    return req.body ?? {};
  }
}
```

### 7.2 Express 适配器

```typescript
import type { Request } from 'express';
import { BaseAdapter } from '@opentunnel/core';

export class ExpressAdapter extends BaseAdapter<Request> {
  protected extractPathname(req: Request): string {
    return req.path;
  }
  
  protected extractMethod(req: Request): string {
    return req.method;
  }
  
  protected extractHeaders(req: Request): object {
    return req.headers as object;
  }
  
  protected extractQuery(req: Request): object {
    return req.query as object;
  }
  
  protected async parseBody(req: Request): Promise<object> {
    return req.body ?? {};
  }
}
```

### 7.3 Hono 适配器

```typescript
import type { Context } from 'hono';
import { BaseAdapter } from '@opentunnel/core';

export class HonoAdapter extends BaseAdapter<Context> {
  protected extractPathname(req: Context): string {
    return req.path;
  }
  
  protected extractMethod(req: Context): string {
    return req.method;
  }
  
  protected extractHeaders(req: Context): object {
    return req.req.header() as object;
  }
  
  protected extractQuery(req: Context): object {
    return req.req.query() as object;
  }
  
  protected async parseBody(req: Context): Promise<object> {
    return req.req.json() ?? {};
  }
}
```

---

## 8. 使用示例

### 8.1 Koa 集成

```typescript
import Koa from 'koa';
import { createTunnel } from '@opentunnel/koa';
import { z } from 'zod';

const app = new Koa();
const tunnel = createTunnel({ framework: 'koa' });

app.use(async (ctx, next) => {
  try {
    const info = await tunnel.match(ctx, '/users/:id/posts', {
      body: z.object({ title: z.string(), content: z.string() })
    });
    
    console.log(info.params.id);      // string (静态推断)
    console.log(info.body.title);      // string (schema 推断)
    
    await next();
  } catch (e) {
    if (e instanceof TunnelError) {
      ctx.status = 400;
      ctx.body = { error: e.message };
    }
  }
});
```

### 8.2 Express 集成

```typescript
import express from 'express';
import { createTunnel } from '@opentunnel/express';

const app = express();
const tunnel = createTunnel({ framework: 'express' });

app.post('/users/:id', async (req, res) => {
  const info = await tunnel.match(req, '/users/:id', {
    body: z.object({ name: z.string() })
  });
  
  console.log(info.params.id);  // string
  console.log(info.body.name);  // string
  
  res.json(info);
});
```

### 8.3 Hono 集成

```typescript
import { Hono } from 'hono';
import { createTunnel } from '@opentunnel/hono';

const app = new Hono();
const tunnel = createTunnel({ framework: 'hono' });

app.get('/users/:id', async (c) => {
  const info = await tunnel.match(c, '/users/:id');
  
  console.log(info.params.id);  // string
  
  return c.json(info);
});
```

---

## 9. 类型安全保证

| 层级 | 类型安全机制 |
|------|-------------|
| **params** | 模板字面量类型自动推断，无需额外定义 |
| **query** | zod schema 推断，`.safeParse()` 验证 |
| **body** | zod schema 推断，自动解析 JSON |
| **header** | `Record<string, string>` 原始类型 |
| **method** | 字面量联合类型 `'GET' \| 'POST' \| ...` |
| **pathname** | `string` 类型 |

---

## 10. 扩展新框架

新增框架（如 Fastify）只需：

1. 在 `Framework` 类型中添加 `'fastify'`
2. 实现 `FastifyAdapter extends BaseAdapter<FastifyRequest>`
3. 在 `createAdapter` 工厂中添加 case 分支

**无需修改核心解析逻辑** — 符合开闭原则

---

## 11. 相关文档

- [Graph 概述](../01-summary/00-overview.md)
- [核心架构](../05-architecture/00-overview.md)