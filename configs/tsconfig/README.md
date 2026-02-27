# @opendesign/tsconfig

OpenDesign TypeScript 配置预设包，提供分层配置的 TypeScript 编译选项。

## 安装

```bash
npm install @opendesign/tsconfig -D
# 或
pnpm add @opendesign/tsconfig -D
# 或
yarn add @opendesign/tsconfig -D
```

## 使用方式

### 基础环境

```json
{
  "extends": "@opendesign/tsconfig/base.json"
}
```

### 浏览器环境

```json
{
  "extends": "@opendesign/tsconfig/browser.json"
}
```

### Node.js 环境

```json
{
  "extends": "@opendesign/tsconfig/node.json"
}
```

### React + Vite

```json
{
  "extends": "@opendesign/tsconfig/react.json"
}
```

### Vue + Vite

```json
{
  "extends": "@opendesign/tsconfig/vue.json"
}
```

### Next.js

```json
{
  "extends": "@opendesign/tsconfig/next.json"
}
```

### Nuxt.js

```json
{
  "extends": "@opendesign/tsconfig/nuxt.json"
}
```

### Electron

```json
{
  "extends": "@opendesign/tsconfig/electron.json"
}
```

## 组合使用

### React 组件库

```json
{
  "extends": [
    "@opendesign/tsconfig/react.json",
    "@opendesign/tsconfig/lib.json"
  ]
}
```

### Vite + React 应用

```json
{
  "extends": [
    "@opendesign/tsconfig/react.json",
    "@opendesign/tsconfig/app.json"
  ]
}
```

### Node.js API 服务

```json
{
  "extends": [
    "@opendesign/tsconfig/node.json",
    "@opendesign/tsconfig/lib.json"
  ]
}
```

## 配置继承链

```
strict.json → base.json → browser.json → vite.json → react.json / vue.json
                                     ↓
                                next.json / nuxt.json
                                     ↓
                                node.json → electron.json
```

## 可用配置

| 配置 | 说明 |
|------|------|
| `base` | 通用基础配置 |
| `strict` | 严格模式配置 |
| `browser` | 浏览器基础环境 |
| `vite` | Vite 构建工具 |
| `node` | Node.js 环境 |
| `node18` | Node.js 18+ |
| `react` | React + Vite |
| `next` | Next.js |
| `vue` | Vue + Vite |
| `nuxt` | Nuxt.js |
| `electron` | Electron |
| `lib` | 类库开发 |
| `app` | 应用开发 |
| `test` | 测试配置 |
| `monorepo` | Monorepo 根项目 |
| `modules/commonjs` | CommonJS 输出 |
| `modules/esm` | ESM 输出 |
| `modules/umd` | UMD 输出 |

## License

MIT
