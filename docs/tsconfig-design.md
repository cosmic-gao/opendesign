# TypeScript 配置包设计方案

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
│   ├── react.json          # React 项目
│   ├── vue.json            # Vue 项目
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
├── index.json              # 入口配置（组合所有基础配置）
├── index.d.ts              # 类型定义
├── package.json            # 包配置
└── README.md               # 使用说明
```

### 2.2 配置层级

```
┌─────────────────────────────────────────────┐
│              项目 tsconfig.json             │  ← 用户配置层（覆盖）
├─────────────────────────────────────────────┤
│              extends 引用链                   │
├─────────────────────────────────────────────┤
│  app.json → node.json → base.json → strict  │  ← 基础配置层
└─────────────────────────────────────────────┘
```

**层级优先级**（从低到高）：
1. `base/` - 底层基础配置
2. `environments/` - 环境配置
3. `modules/` - 模块系统配置
4. `packages/` - 场景配置
5. 项目自身配置 - 最高优先级

---

## 三、配置详情

### 3.1 基础配置

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

### 3.2 环境配置

#### node.json - Node.js 通用

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

#### browser.json - 浏览器环境

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

```json
{
  "extends": "./browser.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["react", "react-dom"]
  }
}
```

#### vue.json - Vue 项目

```json
{
  "extends": "./browser.json",
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"]
  }
}
```

#### electron.json - Electron 项目

```json
{
  "extends": "./node.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM"],
    "types": ["node", "electron"]
  }
}
```

### 3.3 模块配置

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

### 3.4 场景配置

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

## 四、使用方式

### 4.1 安装

```bash
npm install @opendesign/tsconfig --save-dev
# 或
pnpm add @opendesign/tsconfig -D
```

### 4.2 项目引用

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

### 4.3 组合使用

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

## 五、类型定义

### index.d.ts

```typescript
import type { TSConfig } from 'typescript';

export interface TsconfigPreset {
  extends: string;
  compilerOptions: TSConfig['compilerOptions'];
  include?: string[];
  exclude?: string[];
  files?: string[];
  references?: { path: string }[];
}

export type EnvironmentPreset = 
  | 'node' 
  | 'node18' 
  | 'browser' 
  | 'react' 
  | 'vue' 
  | 'electron';

export type ModulePreset = 
  | 'commonjs' 
  | 'esm' 
  | 'umd';

export type PackagePreset = 
  | 'lib' 
  | 'app' 
  | 'test' 
  | 'monorepo';

export interface PresetOptions {
  environment?: EnvironmentPreset;
  module?: ModulePreset;
  package?: PackagePreset;
  strict?: boolean;
}

export function resolvePreset(options: PresetOptions): string[];
```

---

## 六、最佳实践

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

| 场景 | 配置组合 |
|------|---------|
| Node.js API 服务 | node.json + lib.json |
| Node.js CLI 工具 | node.json + app.json |
| React Web 应用 | react.json + app.json |
| Vue 3 应用 | vue.json + app.json |
| React 组件库 | react.json + lib.json |
| Electron 主进程 | electron.json + node.json |
| 单元测试 | test.json + node.json |

---

## 七、扩展指南

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

## 八、版本兼容性

| Node.js 版本 | 推荐配置 |
|-------------|---------|
| 14.x | node.json + target ES2020 |
| 16.x | node.json + target ES2021 |
| 18.x | node18.json |
| 20.x+ | node.json (默认 ES2022) |

---

## 九、配置验证

### CI/CD 集成

```bash
# 验证配置有效性
npx tsc --project tsconfig.json --showConfig

# 类型检查
npx tsc --noEmit
```

---

## 十、总结

本配置包通过分层设计实现了：
- **灵活性**：按需组合配置
- **一致性**：统一团队配置标准
- **可维护性**：集中管理公共配置
- **可扩展性**：便于添加新环境支持

建议团队根据实际项目情况，在本方案基础上进行裁剪和定制。
