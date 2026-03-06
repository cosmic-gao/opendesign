# OpenDesign Layout React/Vue 适配器架构设计

**项目名称**: OpenDesign Layout React/Vue Adapters
**文档类型**: 架构设计文档
**版本**: 1.0.0

---

## 修改记录 (Changelog)

| 版本 | 日期 | 修改内容 | 作者 |
|------|------|----------|------|
| 1.0.0 | 2026-03-06 | 初始版本：React 19 / Vue 4 适配器设计 | - |
| 1.0.1 | 2026-03-06 | 自检修复：字段一致性、补充 SSR 说明 | - |
| 1.0.2 | 2026-03-06 | API 美化：零配置体验、快捷属性、SSR 示例优化 | - |

---

## 1. 背景和目标（Background & Goals）

### 1.1 背景

OpenDesign Layout Core (`@openlayout/core`) 提供了纯 JavaScript/TypeScript 的布局逻辑，包括：
- 状态管理（Nanostores）
- 断点检测（@nanostores/media-query）
- 布局尺寸计算
- CSS 变量注入

Core 层是无框架依赖的，但实际使用中需要与 React、Vue 等前端框架集成。适配器层负责这一桥接工作。

### 1.2 目标

| 目标 | 描述 |
|------|------|
| **框架集成** | 提供 React Hooks 和 Vue Composables 与 Core 层交互 |
| **响应式** | 状态变化时组件自动重渲染 |
| **SSR 支持** | 支持服务端渲染场景 |
| **Tree-shakable** | 只导入使用的功能 |
| **类型安全** | 完整的 TypeScript 类型定义 |

### 1.3 非目标

- ❌ 不修改 Core 层逻辑
- ❌ 不处理 UI 组件渲染
- ❌ 不绑定特定 CSS 方案

---

## 2. 技术方案（Technical Approach）

### 2.1 包结构

```
@openlayout/core       # 核心层（已有）
@openlayout/react     # React 适配器（新增）
@openlayout/vue       # Vue 3 适配器（新增）
```

### 2.2 依赖关系

```
@openlayout/react    →  @openlayout/core  →  @openlayout/type
@openlayout/vue      →  @openlayout/core  →  @openlayout/type
```

### 2.3 React 适配器技术选型

| 技术 | 选择 | 理由 |
|------|------|------|
| 状态订阅 | `@nanostores/react` | 与 Core 使用同一套 Nanostores，减少依赖 |
| Hooks | 自定义 Hooks | 官方推荐模式 |
| SSR | React 19 内置支持 | 官方 SSR 方案 |

**为什么使用 @nanostores/react**：
- 与 Core 层使用相同的 Nanostores，无额外状态管理负担
- 支持 React 19 稳定版
- 支持 SSR（useStore 在服务端返回初始值）
- 体积小（~300 bytes）

### 2.4 Vue 适配器技术选型

| 技术 | 选择 | 理由 |
|------|------|------|
| 状态订阅 | `@nanostores/vue` | 与 Core 使用同一套 Nanostores |
| Composables | 自定义 Composable | Vue 3 官方推荐模式 |
| SSR | `computed` + `watch` | Vue 3 SSR 内置支持 |

**为什么使用 @nanostores/vue**：
- 与 React 适配器保持一致性
- 支持 Vue 3 Composition API
- 支持 SSR

---

## 3. 接口与数据结构设计（API & Data Structures）

### 3.1 React 适配器 API

#### 3.1.1 设计原则

| 原则 | 描述 |
|------|------|
| **零配置** | 一行代码即可使用，默认配置开箱即用 |
| **渐进式** | 简单场景直接用，复杂场景可细粒度控制 |
| **类型安全** | 完整的 TypeScript 类型推断 |

#### 3.1.2 快速开始（推荐）

```tsx
// 方式一：零配置（推荐）
// 直接使用内置默认配置，无需任何设置
import { useLayout } from '@openlayout/react';

function App() {
  const { collapsed, toggleCollapsed, headerHeight, sidebarWidth } = useLayout();

  return (
    <div style={{ height: headerHeight }}>
      <Header />
      <div style={{ display: 'flex' }}>
        <Sidebar width={sidebarWidth} collapsed={collapsed} />
        <Content />
      </div>
    </div>
  );
}
```

```tsx
// 方式二：自定义配置
// 需要自定义配置时使用
import { createLayout } from '@openlayout/react';

const useLayout = createLayout({
  breakpoints: { xs: 480, sm: 768, md: 1024 },
  sizes: { header: 64, sidebar: 240 },
});
```

#### 3.1.3 createLayout 参数

```typescript
// 完整配置
const config = {
  // 布局模式（必填）
  mode: 'sidebar' as const,
  
  // 断点（可选，默认 { xs: 480, sm: 768, md: 1024 }）
  breakpoints: { xs: 480, sm: 768, md: 1024, lg: 1440 },
  
  // 尺寸（可选，默认 { header: 64, footer: 48, sidebar: 240 }）
  sizes: { header: 64, sidebar: 240 },
  
  // 默认折叠状态（可选，默认 false）
  defaultCollapsed: false,
};

// 创建 Hook
const useLayout = createLayout(config);
```

#### 3.1.4 useLayout 返回值

```typescript
// 返回值（基础）
const { 
  collapsed,        // boolean - 当前折叠状态
  breakpoint,       // Breakpoint - 当前断点
  toggleCollapsed,  // () => void - 切换折叠
  setCollapsed,     // (v: boolean) => void - 设置折叠
} = useLayout();

// 返回值（快捷属性）
const { 
  headerHeight,    // number - 头部高度
  footerHeight,    // number - 底部高度  
  sidebarWidth,    // number - 侧边栏宽度
  isMobile,        // boolean - 是否移动端 (xs | sm)
  isDesktop,       // boolean - 是否桌面端 (lg)
} = useLayout();

// 完整尺寸（进阶）
const { 
  dimensions       // { header, footer, sidebar } - 完整尺寸对象
} = useLayout();
```

**类型定义**：
```typescript
type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | null;
```

#### 3.1.5 组件式（可选）

```tsx
import { LayoutProvider, useLayoutContext } from '@openlayout/react';

// 方式一：Provider 包裹
function App() {
  return (
    <LayoutProvider config={customConfig}>
      <MainLayout />
    </LayoutProvider>
  );
}

// 在任意子组件中获取
function MainLayout() {
  const { collapsed, dimensions } = useLayoutContext();
  return <div>...</div>;
}
```

#### 3.1.6 SSR 支持

**Next.js App Router (推荐)**：
```tsx
// app/layout.tsx - 服务端组件
import { getLayoutConfig } from '@/config';

export default function RootLayout({ children }) {
  const config = getLayoutConfig();
  
  return (
    <html>
      <body>
        <Layout config={config}>
          {children}
        </Layout>
      </body>
    </html>
  );
}
```

**Next.js Pages Router**：
```tsx
// pages/_app.tsx
import { useSyncExternalStore } from 'react';

function MyApp({ Component, pageProps }) {
  const layout = useSyncExternalStore(
    store.subscribe,
    () => store.get(),
    () => ({ collapsed: false, breakpoint: 'md' }) // 服务端 fallback
  );
  
  return <Component {...pageProps} layout={layout} />;
}
```

---

### 3.2 Vue 适配器 API

#### 3.2.1 设计原则

与 React 适配器保持一致。

#### 3.2.2 快速开始（推荐）

```vue
<script setup>
// 方式一：零配置（推荐）
import { useLayout } from '@openlayout/vue';

const { collapsed, toggleCollapsed, headerHeight, sidebarWidth } = useLayout();
</script>

<template>
  <div :style="{ height: headerHeight + 'px' }">
    <Header />
    <div class="layout-body">
      <Sidebar :width="sidebarWidth" :collapsed="collapsed" />
      <Content />
    </div>
  </div>
</template>
```

```vue
<script setup>
// 方式二：自定义配置
import { createLayout } from '@openlayout/vue';

const useLayout = createLayout({
  breakpoints: { xs: 480, sm: 768, md: 1024 },
  sizes: { header: 64, sidebar: 240 },
});

const { collapsed, toggleCollapsed } = useLayout();
</script>
```

#### 3.2.3 createLayout 参数

```typescript
// 完整配置
const config = {
  // 布局模式（必填）
  mode: 'sidebar' as const,
  
  // 断点（可选，默认 { xs: 480, sm: 768, md: 1024 }）
  breakpoints: { xs: 480, sm: 768, md: 1024, lg: 1440 },
  
  // 尺寸（可选，默认 { header: 64, footer: 48, sidebar: 240 }）
  sizes: { header: 64, sidebar: 240 },
  
  // 默认折叠状态（可选，默认 false）
  defaultCollapsed: false,
};

const useLayout = createLayout(config);
```

#### 3.2.4 useLayout 返回值

```typescript
// 返回值（基础）- 所有值均为 Ref
const { 
  collapsed,        // Ref<boolean> - 当前折叠状态
  breakpoint,       // Ref<Breakpoint> - 当前断点
  toggleCollapsed, // () => void - 切换折叠
  setCollapsed,     // (v: boolean) => void - 设置折叠
} = useLayout();

// 返回值（快捷属性）- 自动解包为原始类型
const { 
  headerHeight,    // number - 头部高度
  footerHeight,    // number - 底部高度  
  sidebarWidth,    // number - 侧边栏宽度
  isMobile,        // boolean - 是否移动端 (xs | sm)
  isDesktop,       // boolean - 是否桌面端 (lg)
} = useLayout();

// 完整尺寸（进阶）
const { 
  dimensions       // { header, footer, sidebar } - 完整尺寸对象
} = useLayout();
```

**类型定义**：
```typescript
type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | null;
```

#### 3.2.5 SSR 支持

**Nuxt 3 (推荐)**：
```typescript
// plugins/layout.client.ts
import { createLayout } from '@openlayout/vue';

export default defineNuxtPlugin(() => {
  const useLayout = createLayout({
    breakpoints: { xs: 480, sm: 768, md: 1024 },
    sizes: { header: 64, sidebar: 240 },
  });
  
  return { provide: { layout: useLayout } };
});
```

```vue
<!-- app.vue -->
<script setup>
const { headerHeight, sidebarWidth } = useLayout();
</script>

<template>
  <div :style="{ height: headerHeight + 'px' }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
```

### 3.3 数据结构

#### LayoutState（已有，引用）

```typescript
interface LayoutState {
  collapsed: boolean;
  breakpoint: string | null;
}
```

#### LayoutDimensions（已有，引用）

```typescript
interface LayoutDimensions {
  header: LayoutSize;
  footer: LayoutSize;
  sidebar: LayoutSize;
}

interface LayoutSize {
  min?: number;
  max?: number;
  auto?: boolean;
}
```

#### LayoutConfig（已有，引用）

```typescript
interface LayoutConfig {
  mode: LayoutMode;
  defaultCollapsed: boolean;
  breakpoints: Breakpoints;
  sizes: LayoutSizes;
}
```

### 3.4 文件结构

#### React 适配器

```
@openlayout/react/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # 入口，导出默认 useLayout 和 createLayout
│   ├── createLayout.ts  # 自定义配置工厂函数
│   ├── useLayout.ts     # useLayout 主 Hook（含快捷属性）
│   ├── useCollapsed.ts  # useCollapsed
│   ├── useBreakpoint.ts # useBreakpoint
│   ├── LayoutProvider.tsx # 组件式 Provider
│   └── ssr.ts          # SSR 辅助
└── tests/
    └── *.test.ts
```

#### Vue 适配器

```
@openlayout/vue/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # 入口，导出默认 useLayout 和 createLayout
│   ├── createLayout.ts   # 自定义配置工厂函数
│   ├── useLayout.ts     # useLayout 主 Composable（含快捷属性）
│   ├── useCollapsed.ts  # useCollapsed
│   ├── useBreakpoint.ts # useBreakpoint
│   ├── LayoutProvider.vue # 组件式 Provider
│   └── ssr.ts          # SSR 辅助
└── tests/
    └── *.test.ts
```

---

## 4. 潜在风险与应对措施（Risks & Mitigations）

### 4.1 风险清单

| 风险 | 等级 | 描述 | 应对措施 |
|------|------|------|----------|
| **状态同步** | 🟡 中 | Nanostores 状态与框架组件生命周期不同步 | 使用框架官方推荐的订阅方式（useStore/useStore） |
| **SSR 水合** | 🟡 中 | 服务端渲染后客户端 hydration 不匹配 | 提供 `useState` 辅助函数，确保初始状态一致 |
| **Tree-shaking** | 🟢 低 | 整体导入导致体积增大 | 明确导出每个 Hook/Composable，支持按需导入 |
| **版本兼容性** | 🟢 低 | React 19 / Vue 4 版本差异 | 使用最新框架 API |
| **响应式丢失** | 🔴 高 | Core 函数调用返回纯对象，被框架当作新引用 | 确保返回 Ref/状态对象，保持引用稳定 |

### 4.2 详细应对

#### 4.2.1 响应式保证

**React**：
```typescript
// 错误示例：每次渲染返回新对象
function useDimensions() {
  return createLayout(config, state); // 每次都是新对象！
}

// 正确示例：使用 useSyncExternalStore 保证稳定性
function useDimensions() {
  return useSyncExternalStore(
    store.subscribe,
    () => store.get().dimensions,
    () => serverDimensions // SSR fallback
  );
}
```

**Vue**：
```typescript
// 正确示例：使用 computed 包装
function useDimensions() {
  return computed(() => {
    const state = $layoutState.get();
    return createLayout(config, state);
  });
}
```

#### 4.2.2 SSR 支持

```typescript
// React SSR
const state = useState(config);
// 在服务端渲染前调用，确保客户端与服务端状态一致

// Vue SSR
// Nanostores 内置 SSR 支持，但需要初始化配置
import { $layoutState } from '@openlayout/core';
// 在 serverPrefetch 或 setup 中初始化
```

---

## 5. 备选方案与权衡（Alternatives & Trade-offs）

### 5.1 状态管理方案对比

| 方案 | 优点 | 缺点 | 决策 |
|------|------|------|------|
| **Nanostores（当前）** | 轻量、框架无关、与 Core 一致 | 需要适配器 | ✅ 采用 |
| React Context | React 原生 | 需要 Provider 包裹，可能导致重渲染 | 放弃 |
| Vue Reactive | Vue 原生 | 需要响应式转换 | 放弃 |
| Zustand | 流行、类型好 | 引入额外依赖 | 放弃 |
| Jotai | 原子化、React 友好 | 引入额外依赖 | 放弃 |

### 5.2 组件式 vs Hooks/Composables

| 方案 | 优点 | 缺点 | 决策 |
|------|------|------|------|
| **Hooks/Composables** | 灵活、Tree-shakable | 需要手动调用 | ✅ 采用 |
| 组件式 | 上手简单 | 不够灵活，Tree-shaking 差 | 保留作为补充 |

### 5.3 API 设计决策

#### 5.3.1 一站式 vs 单一职责

**决策**：同时提供两种模式

- `useLayout()` / `useLayout()`：一站式，适合快速上手
- `useCollapsed()` / `useBreakpoint()`：单一职责，适合精确控制

**理由**：
- 单一职责 Hooks 减少不必要的重渲染
- 一站式适合简单场景

#### 5.3.2 全局初始化 vs Provider

**决策**：支持两种模式

- `useInitializeLayout(config)`：全局初始化，适合简单场景
- `<LayoutProvider>`：组件式，适合需要局部配置的场景

**理由**：
- 全局初始化更简洁
- Provider 支持局部覆盖配置

### 5.4 依赖策略

| 包 | 版本 | 理由 |
|---|---|---|
| `react` | ^19.0.0 | 最新稳定版 |
| `react-dom` | ^19.0.0 | 最新稳定版 |
| `vue` | ^4.0.0 | 最新稳定版 |
| `@nanostores/react` | ^1.0.0 | 与 Nanostores 1.x 兼容 |
| `@nanostores/vue` | ^1.0.0 | 与 Nanostores 1.x 兼容 |

---

## 6. 验收标准

### 6.1 功能验收

- [ ] React 适配器完整实现所有 Hooks
- [ ] Vue 适配器完整实现所有 Composables
- [ ] SSR 场景正常工作
- [ ] 状态变化触发正确的重渲染
- [ ] Tree-shaking 正常工作

### 6.2 性能验收

- [ ] React 适配器 bundle size < 2kb (gzip)
- [ ] Vue 适配器 bundle size < 2kb (gzip)
- [ ] 不必要的重渲染被正确避免

### 6.3 兼容性验收

- [ ] React 19 兼容
- [ ] Vue 4 兼容
- [ ] SSR 框架兼容（Next.js 16）

---

## 7. 实现优先级

| 优先级 | 功能 | 预估工作量 |
|--------|------|-----------|
| P0 | React 适配器核心 Hooks | 2d |
| P0 | Vue 适配器核心 Composables | 2d |
| P1 | SSR 支持 | 1d |
| P1 | Provider 组件 | 0.5d |
| P2 | 完整测试覆盖 | 1d |
| P2 | 文档与示例 | 1d |

---

## 8. 待定问题

1. **是否需要 React Native 适配器？** - 当前不在范围内
2. **是否需要 Preact/Svelte 适配器？** - 当前不在范围内
3. **DevTools 支持？** - 可后续迭代
