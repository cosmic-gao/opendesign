# @opentunnel 通用路由解析器设计文档

**版本**: v0.0.1  
**日期**: 2026-04-12  
**状态**: 设计中

---

## 1. 项目概述

### 1.1 核心定位

- **一句话描述**：运行时无关的 API 路由参数解析库，通过适配器支持 Deno/Node/Bun 环境
- **核心价值**：零依赖、纯 TypeScript、高度类型安全

### 1.2 设计原则

| 原则 | 说明 |
|------|------|
| **严格类型安全** | 利用 TypeScript 模板字面量类型自动推断路由参数 |
| **统一命名风格** | 描述性强、现代 TS 风格 |
| **合理抽象关系** | 适配器模式隔离环境差异 |
| **最小依赖** | 核心包零外部依赖 |

---

## 2. 架构设计

### 2.1 整体架构

采用 **Facade + Adapter + Pure Parser** 三层架构：

```
┌─────────────────────────────────────────────────────────────┐
│                     Tunnel Facade                           │
│                     (Tunnel<TRequest>)                      │
│                                                              │
│  public match<TPath>(req, pattern): RouteMatchResult<TPath> │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐   ┌─────────────────────────────┐
│    TunnelAdapter        │   │      Pure Parser             │
│    (环境适配器接口)       │   │      (路由解析器)             │
│                          │   │                              │
│  extractInfo(req):      │   │  parsePath(pathname, pattern)│
│    StandardRouteInfo    │   │    → Record<string, ...> |   │
│                          │   │      null                    │
└─────────────────────────┘   └─────────────────────────────┘
```

**层级职责：**

| 层级 | 职责 | 特点 |
|------|------|------|
| **Pure Parser** | 字符串级别路由模式编译与匹配 | 无副作用、无环境依赖 |
| **Adapter** | 消化不同运行时的 Request 差异 | 输出 StandardRouteInfo |
| **Facade (Tunnel)** | 整合 Parser 与 Adapter | 提供类型安全的 `match` API |

---

## 3. 目录结构

```
packages/tunnel/
├── core/                         # @opentunnel/core (运行时无关)
│   ├── types.ts                  # 类型定义与推断
│   ├── parser.ts                 # 路由解析逻辑
│   ├── adapter.ts                # 适配器接口
│   ├── tunnel.ts                 # 核心 Facade
│   ├── errors.ts                 # 错误定义
│   ├── index.ts                  # 统一导出
│   ├── package.json
│   └── tsconfig.json
│
└── deno/                         # @opentunnel/deno (Deno运行时)
    ├── adapter.ts                # Deno 适配器实现
    ├── index.ts                  # 统一导出与工厂函数
    ├── package.json
    └── tsconfig.json
```

---

## 4. 核心类型设计

### 4.1 类型推断引擎 (`core/types.ts`)

```typescript
// 辅助类型：简化交叉类型提示
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

// 核心推断引擎：解析 RESTful 和 Wildcard 模式
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

### 4.2 类型推断表现

| 模式 | 推断类型 |
|------|----------|
| `/users/:id` | `{ id: string }` |
| `/users/:id?` | `{ id?: string }` |
| `/*filepath` | `{ filepath: string }` |
| `/users/:userId/posts/:postId?` | `{ userId: string; postId?: string }` |

### 4.3 路由匹配结果

```typescript
export type RouteMatchResult<TParams> = 
  | { matched: true; params: TParams }
  | { matched: false; reason: 'PATH_MISMATCH' | 'METHOD_MISMATCH' | 'INTERNAL_ERROR' };
```

---

## 5. 适配器接口

### 5.1 标准路由信息 (`core/adapter.ts`)

```typescript
export interface StandardRouteInfo {
  pathname: string;
  method?: string;
  searchParams?: URLSearchParams;
}

export interface TunnelAdapter<TRequest> {
  extractInfo(req: TRequest): StandardRouteInfo;
}
```

### 5.2 适配器实现 (`deno/adapter.ts`)

```typescript
import type { TunnelAdapter, StandardRouteInfo } from '@opentunnel/core';

export class DenoTunnelAdapter implements TunnelAdapter<Request> {
  public extractInfo(req: Request): StandardRouteInfo {
    const url = new URL(req.url);
    return {
      pathname: url.pathname,
      method: req.method,
      searchParams: url.searchParams,
    };
  }
}
```

---

## 6. 错误定义

### 6.1 错误类型 (`core/errors.ts`)

```typescript
export type TunnelErrorCode = 
  | 'PATH_MISMATCH'
  | 'MISSING_REQUIRED'
  | 'INVALID_FORMAT'
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

## 7. 路由解析器

### 7.1 纯解析函数 (`core/parser.ts`)

```typescript
type Segment =
  | { type: 'static'; value: string }
  | { type: 'param'; name: string; optional?: boolean }
  | { type: 'wildcard'; name: string };

export function parsePath(
  pathname: string,
  pattern: string
): Record<string, string | undefined> | null {
  const segments = compilePattern(pattern);
  const pathParts = pathname.split('/').filter(Boolean);
  
  const params: Record<string, string | undefined> = {};
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const pathPart = pathParts[i];
    
    if (segment.type === 'static') {
      if (pathPart !== segment.value) return null;
    } else if (segment.type === 'param') {
      if (pathPart === undefined && !segment.optional) return null;
      params[segment.name] = pathPart;
    } else if (segment.type === 'wildcard') {
      params[segment.name] = pathParts.slice(i).join('/');
      break;
    }
  }
  
  return params;
}
```

---

## 8. 门面层

### 8.1 Tunnel 核心 (`core/tunnel.ts`)

```typescript
import type { TunnelAdapter, RouteMatchResult, ExtractRouteParams } from './types';
import { parsePath } from './parser';

export class Tunnel<TRequest> {
  constructor(private readonly adapter: TunnelAdapter<TRequest>) {}

  public match<TPath extends string>(
    req: TRequest, 
    pattern: TPath
  ): RouteMatchResult<ExtractRouteParams<TPath>> {
    try {
      const info = this.adapter.extractInfo(req);
      const params = parsePath(info.pathname, pattern);
      
      if (params === null) {
        return { matched: false, reason: 'PATH_MISMATCH' };
      }
      
      return { matched: true, params: params as ExtractRouteParams<TPath> };
    } catch {
      return { matched: false, reason: 'INTERNAL_ERROR' };
    }
  }
}

export function createTunnel<TRequest>(
  adapter: TunnelAdapter<TRequest>
): Tunnel<TRequest> {
  return new Tunnel(adapter);
}
```

---

## 9. 包配置

### 9.1 @opentunnel/core

**`package.json`**

```json
{
  "name": "@opentunnel/core",
  "version": "0.0.1",
  "type": "module",
  "main": "./index.ts",
  "types": "./index.ts",
  "exports": {
    ".": "./index.ts"
  }
}
```

**`tsconfig.json`**

```json
{
  "extends": "@opendesign/tsconfig/lib",
  "compilerOptions": {
    "rootDir": ".",
    "noEmit": true
  },
  "include": ["*.ts"]
}
```

### 9.2 @opentunnel/deno

**`package.json`**

```json
{
  "name": "@opentunnel/deno",
  "version": "0.0.1",
  "type": "module",
  "main": "./index.ts",
  "types": "./index.ts",
  "exports": {
    ".": "./index.ts"
  },
  "peerDependencies": {
    "@opentunnel/core": "workspace:*"
  }
}
```

**`tsconfig.json`**

```json
{
  "extends": "@opendesign/tsconfig/lib",
  "compilerOptions": {
    "rootDir": ".",
    "noEmit": true
  },
  "include": ["*.ts"]
}
```

---

## 10. 使用示例

```typescript
import { createDenoTunnel } from '@opentunnel/deno';

const tunnel = createDenoTunnel();
const request = new Request('https://api.example.com/users/123/posts?sort=desc');

const result = tunnel.match(request, '/users/:userId/posts/:postId?');

if (result.matched) {
  // 完美推断：{ userId: string; postId?: string }
  console.log(result.params.userId); // "123"
  console.log(result.params.postId);  // undefined
} else {
  console.error(result.reason);
}
```

---

## 11. 后续扩展方向

| 扩展项 | 优先级 | 说明 |
|--------|--------|------|
| `@opentunnel/node` | P2 | Node.js 适配器 |
| `@opentunnel/bun` | P2 | Bun 适配器 |
| 参数验证集成 (zod) | P2 | 提供 validate 方法 |
| Hono 中间件 | P3 | 开箱即用的 Hono 集成 |
| Express 中间件 | P3 | 开箱即用的 Express 集成 |

---

## 12. 相关文档

- [Graph 概述](../01-summary/00-overview.md)
- [核心架构](../05-architecture/00-overview.md)
