# TypeScript 配置包设计方案

- **版本**: 1.0.0
- **更新日期**: 2026-02-27
- **状态**: 草稿

---

## 修改记录 (Changelog)

| 版本 | 日期 | 修改内容 | 作者 |
|------|------|----------|------|
| 1.0.0 | 2026-02-27 | 初始版本 | - |

---

## 一、概述

本方案旨在构建一个通用、可扩展的 TypeScript 配置包，支持 monorepo 架构下的多环境、多场景需求。通过分层配置和组合机制，实现一次定义、多处复用的目标。

### 设计目标

- **环境适配**：支持 Node.js、Browser、React、Vue、Electron 等多种运行环境
- **模块化**：配置层级清晰，按需引用，避免配置冗余
- **类型安全**：提供完整的类型定义和 IDE 支持
- **可扩展**：便于自定义和扩展新的配置场景

---

## 二、架构设计

### 2.1 目录结构

```
tsconfig/
├── base/                    # 基础配置（所有项目共享）
│   ├── base.json           # 基础编译选项
│   ├── types/              # 内置类型引用
│   │   ├── node.json       # Node.js 类型
│   │   └── browser.json    # 浏览器类型
│   └── strict.json         # 严格模式配置
├── environments/           # 环境特定配置
│   ├── node.json           # Node.js 环境
│   ├── node18.json         # Node.js 18+
│   ├── browser.json        # 浏览器环境
│   ├── vite.json           # Vite 构建工具
│   ├── react.json          # React 项目
│   ├── next.json           # Next.js 项目
│   ├── vue.json            # Vue 项目
│   ├── nuxt.json           # Nuxt.js 项目
│   └── electron.json       # Electron 项目
├── modules/                # 模块系统配置
│   ├── commonjs.json       # CommonJS 输出
│   ├── esm.json            # ESM 输出
│   └── umd.json            # UMD 输出
├── packages/               # 特殊场景配置
│   ├── lib.json            # 类库开发
│   ├── app.json            # 应用开发
│   ├── test.json           # 测试配置
│   └── monorepo.json       # Monorepo 根项目
├── package.json            # 包配置
└── README.md               # 使用说明
```

### 2.2 配置层级

```
┌─────────────────────────────────────────────────────────────┐
│                   项目 tsconfig.json                        │  ← 用户配置层（覆盖）
├─────────────────────────────────────────────────────────────┤
│                      extends 引用链                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐  │
│   │   app.json  │     │   lib.json  │     │  test.json  │  │  ← 场景层
│   └──────┬──────┘     └──────┬──────┘     └──────┬──────┘  │
│          │                  │                  │          │
│   ┌──────┴──────┐     ┌──────┴──────┐     ┌──────┴──────┐  │
│   │ react.json  │     │  vue.json   │     │  node.json  │  │  ← 环境层
│   │ next.json   │     │  nuxt.json  │     │ electron.json│  │
│   └──────┬──────┘     └──────┬──────┘     └──────┬──────┘  │
│          │                  │                  │          │
│   ┌──────┴──────────────────┴──────────────────┴──────┐  │
│   │                  vite.json                           │  │  ← Vite 构建层
│   └──────────────────────┬───────────────────────────────┘  │
│                          │                                  │
│   ┌──────────────────────┴───────────────────────────────┐ │
│   │                  browser.json                        │  │  ← 浏览器基础层
│   └──────────────────────┬───────────────────────────────┘  │
│                          │                                  │
│   ┌──────────────────────┴───────────────────────────────┐ │
│   │                       base.json                        │  │  ← 通用基础层
│   └──────────────────────┬───────────────────────────────┘  │
│                          │                                  │
│   ┌──────────────────────┴───────────────────────────────┐ │
│   │                     strict.json                        │ │  ← 严格模式层
│   └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**层级优先级**（从低到高）：

1. **strict.json** - 严格模式层（最底层）
2. **base.json** - 通用基础层
3. **browser.json** - 浏览器基础层
4. **vite.json** - Vite 构建工具层（继承浏览器基础）
5. **environments/** - 环境配置层
   - `node.json` - Node.js 环境
   - `browser.json` - 浏览器环境（继承通用基础）
   - `vite.json` - Vite 构建工具（继承浏览器基础）
   - `react.json` - React + Vite 项目（继承 Vite）
   - `next.json` - Next.js 项目（继承浏览器基础）
   - `vue.json` - Vue + Vite 项目（继承 Vite）
   - `nuxt.json` - Nuxt.js 项目（继承浏览器基础）
   - `electron.json` - Electron 项目（继承 Node.js）
6. **modules/** - 模块系统配置
7. **packages/** - 场景配置层
8. **项目自身配置** - 最高优先级

> **设计原则**：
> - React/Vue 项目通常使用 Vite 构建，继承自 vite.json
> - Next.js/Nuxt.js 是全栈框架，直接继承 browser.json
> - Node.js/Electron 框架继承自 node.json
> - 确保配置层次清晰、避免重复

---

## 三、包导出配置

### 3.1 package.json 配置

通过 `exports` 字段导出各配置文件，使包可以被其他项目引用：

```json
{
  "name": "@opendesign/tsconfig",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    "./base": "./base.json",
    "./strict": "./strict.json",
    "./browser": "./environments/browser.json",
    "./vite": "./environments/vite.json",
    "./node": "./environments/node.json",
    "./node18": "./environments/node18.json",
    "./react": "./environments/react.json",
    "./next": "./environments/next.json",
    "./vue": "./environments/vue.json",
    "./nuxt": "./environments/nuxt.json",
    "./electron": "./environments/electron.json",
    "./lib": "./packages/lib.json",
    "./app": "./packages/app.json",
    "./test": "./packages/test.json",
    "./monorepo": "./packages/monorepo.json",
    "./modules/commonjs": "./modules/commonjs.json",
    "./modules/esm": "./modules/esm.json",
    "./modules/umd": "./modules/umd.json"
  },
  "keywords": ["typescript", "tsconfig", "config"],
  "license": "MIT"
}
```

### 3.2 引用方式

安装后，其他项目可通过以下方式引用配置：

```json
{
  "extends": "@opendesign/tsconfig/react.json"
}
```

### 3.3 组合引用

项目可根据需要组合多个配置：

```json
{
  "extends": [
    "@opendesign/tsconfig/react.json",
    "@opendesign/tsconfig/lib.json"
  ]
}
```

---

## 四、配置详情

### 4.1 基础配置

#### base.json - 核心编译选项

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": false,
    "checkJs": false,
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "removeComments": true,
    "noEmit": false,
    "isolatedModules": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "exclude": ["node_modules", "dist", "build", ".turbo"]
}
```

#### strict.json - 严格模式配置

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### 4.2 环境配置

#### node.json - Node.js 通用环境

> **定位**：Node.js 项目的基础配置，继承自 base.json，添加 Node.js 类型支持。Electron 主进程等基于 Node 的框架可继承此配置。

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["node"],
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

#### node18.json - Node.js 18+

```json
{
  "extends": "./node.json",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

#### browser.json - 浏览器基础环境

> **定位**：浏览器项目的基础配置，继承自 base.json，添加 DOM 类型支持。所有面向浏览器的框架（React、Vue）应继承此配置。

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": [],
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

#### react.json - React 项目

> **定位**：React + Vite 项目配置，继承自 vite.json，添加 React 类型和 JSX 支持。

```json
{
  "extends": "./vite.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["react", "react-dom"]
  }
}
```

#### vue.json - Vue 项目

> **定位**：Vue + Vite 项目配置，继承自 vite.json，添加 Vue 类型和 JSX 支持。

```json
{
  "extends": "./vite.json",
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "@vitejs/plugin-vue"]
  }
}
```

#### nuxt.json - Nuxt.js 项目

> **定位**：Nuxt.js 全栈框架配置，继承自 browser.json，添加 Nuxt 类型和 Vue 支持。Nuxt 同时服务端渲染，需要 Node.js 和浏览器类型。

```json
{
  "extends": "./browser.json",
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["nuxt", "vite/client"]
  }
}
```

#### vite.json - Vite 项目

> **定位**：Vite 构建工具基础配置，继承自 browser.json，添加 Vite 客户端类型支持。Vite 可用于 Vue、React、Svelte 等前端框架项目。

```json
{
  "extends": "./browser.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"]
  }
}
```

#### next.json - Next.js 项目

> **定位**：Next.js React 全栈框架配置，继承自 browser.json，添加 Next.js 类型和 React JSX 支持。Next.js 同时支持服务端和客户端渲染。

```json
{
  "extends": "./browser.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "target": "ES2017",
    "types": ["next"]
  }
}
```

#### electron.json - Electron 项目

> **定位**：Electron 桌面应用配置，继承自 node.json，添加 DOM 和 Electron 类型支持。

```json
{
  "extends": "./node.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM"],
    "types": ["node", "electron"]
  }
}
```

### 4.3 模块配置

#### commonjs.json

```json
{
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node",
    "esModuleInterop": true
  }
}
```

#### esm.json

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

#### umd.json

```json
{
  "compilerOptions": {
    "module": "UMD",
    "moduleResolution": "Bundler"
  }
}
```

### 4.4 场景配置

#### lib.json - 类库开发

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "composite": false,
    "stripInternal": true,
    "emitDeclarationOnly": false
  }
}
```

#### app.json - 应用开发

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "declaration": false,
    "declarationMap": false,
    "noEmit": false,
    "composite": true
  }
}
```

#### test.json - 测试配置

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM"],
    "types": ["vitest", "node"],
    "skipLibCheck": true
  },
  "include": ["src/**/*", "tests/**/*", "*.test.ts", "*.spec.ts"]
}
```

#### monorepo.json - Monorepo 根项目

```json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "skipLibCheck": true
  },
  "files": [],
  "references": []
}
```

---

## 五、使用方式

### 5.1 安装

```bash
npm install @opendesign/tsconfig --save-dev
# 或
pnpm add @opendesign/tsconfig -D
```

### 5.2 项目引用

#### Node.js API 项目

```json
{
  "extends": "@opendesign/tsconfig/node.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

#### React 前端项目

```json
{
  "extends": "@opendesign/tsconfig/react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"]
}
```

#### Monorepo 内部包

```json
{
  "extends": "@opendesign/tsconfig/lib.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@opendesign/utils": ["../utils/src/index.ts"]
    }
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../utils" }
  ]
}
```

### 5.3 组合使用

项目可根据需要组合多个配置：

```json
{
  "extends": [
    "@opendesign/tsconfig/node.json",
    "@opendesign/tsconfig/lib.json"
  ],
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

---

## 六、类型定义

无需额外类型定义，使用 `resolveJsonModule` 可直接导入 JSON 配置。

---

---

## 七、最佳实践

### 6.1 Monorepo 最佳实践

1. **根项目配置**：使用 `monorepo.json` 作为根 tsconfig
2. **内部包**：使用 `lib.json` + 环境配置
3. **应用项目**：使用 `app.json` + 环境配置
4. **路径映射**：在根 tsconfig 中统一配置 paths

### 6.2 配置继承原则

```
环境配置 → 模块配置 → 基础配置 → 严格模式
     ↓           ↓          ↓         ↓
  node/esm   commonjs    base.json  strict.json
```

### 6.3 常见场景组合

| 场景 | 配置组合 | 继承链 |
|------|---------|--------|
| Node.js API 服务 | node.json + lib.json | lib → node → base → strict |
| Node.js CLI 工具 | node.json + app.json | app → node → base → strict |
| Vite 项目 | vite.json + app.json | app → vite → browser → base → strict |
| React Web 应用 (Vite) | react.json + app.json | app → react → vite → browser → base → strict |
| Next.js 应用 | next.json + app.json | app → next → browser → base → strict |
| Vue 3 应用 (Vite) | vue.json + app.json | app → vue → vite → browser → base → strict |
| Nuxt.js 应用 | nuxt.json + app.json | app → nuxt → browser → base → strict |
| React 组件库 (Vite) | react.json + lib.json | lib → react → vite → browser → base → strict |
| Electron 主进程 | electron.json | electron → node → base → strict |
| 单元测试 | test.json + node.json | test → node → base → strict |

---

## 八、扩展指南

### 7.1 添加新环境

1. 在 `environments/` 目录创建新配置文件
2. 继承合适的父级配置
3. 添加特定类型定义和编译选项
4. 更新 `index.json` 导出

### 7.2 自定义配置

项目可通过覆盖 `compilerOptions` 实现自定义：

```json
{
  "extends": "@opendesign/tsconfig/react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "strict": false
  }
}
```

---

## 九、版本兼容性

| Node.js 版本 | 推荐配置 |
|-------------|---------|
| 14.x | node.json + target ES2020 |
| 16.x | node.json + target ES2021 |
| 18.x | node18.json |
| 20.x+ | node.json (默认 ES2022) |

---

## 十、配置验证

### CI/CD 集成

```bash
# 验证配置有效性
npx tsc --project tsconfig.json --showConfig

# 类型检查
npx tsc --noEmit
```

---

## 十一、总结

本配置包通过分层设计实现了：
- **灵活性**：按需组合配置
- **一致性**：统一团队配置标准
- **可维护性**：集中管理公共配置
- **可扩展性**：便于添加新环境支持

建议团队根据实际项目情况，在本方案基础上进行裁剪和定制。
