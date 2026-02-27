# OpenDesign Layout Architecture Design Doc

**Author**: Trae AI
**Status**: Draft
**Last Updated**: 2026-02-27

## 1. 背景和目标（Background & Goals）

### 1.1 背景
在现代企业级应用开发中，页面布局（Layout）是所有应用的基础骨架。目前 OpenDesign 项目缺乏一套统一、灵活且可复用的布局系统。为了提高开发效率，确保 UI 一致性，并支持多种业务场景（如后台管理系统、文档站点、SaaS 应用），我们需要设计一套通用的页面布局架构。

### 1.2 目标
- **灵活性（Flexibility）**：支持多种常见布局模式（侧边栏布局、顶部导航布局、混合布局）。
- **响应式（Responsiveness）**：完美支持移动端、平板和桌面端，自动适配屏幕尺寸。
- **可配置性（Configurability）**：支持通过配置或 Props 轻松控制侧边栏折叠、固定头部、固定侧边栏等行为。
- **无障碍性（Accessibility）**：遵循 WAI-ARIA 标准，确保键盘导航和屏幕阅读器支持。
- **多框架支持（Multi-Framework Support）**：支持 React、Vue 3、Solid.js 等主流前端框架，保持 API 一致性。

### 1.3 非目标（Non-Goals）
- 不包含具体的业务组件（如用户头像、通知中心），仅提供插槽（Slots）。
- 不绑定特定的路由库，但需兼容常见的路由方案（如 React Router, Next.js App Router）。

---

## 2. 技术方案（Technical Approach）

### 2.1 整体架构
采用 **"Config + Logic + Adapter" 三层架构**：

```
┌─────────────────────────────────────────────────────────────┐
│                    Framework UI Components                   │
│         (React Components, Vue Components, etc.)            │
├─────────────────────────────────────────────────────────────┤
│                    Framework Adapters                        │
│         (React Hooks/Context, Vue Composables)              │
├─────────────────────────────────────────────────────────────┤
│                    @openlayout/core                  │
│         (State Manager + Responsive + Layout Math)          │
├─────────────────────────────────────────────────────────────┤
│                    @openlayout/config                 │
│         (Default Config)                                     │
├─────────────────────────────────────────────────────────────┤
│                    @openlayout/design                 │
│         (CSS Variables + Themes + Tokens)                   │
├─────────────────────────────────────────────────────────────┤
│                    @openlayout/type                  │
│         (TypeScript Types)                                 │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 类型层（@openlayout/type）

#### 2.2.1 核心职责
- 定义 TypeScript 类型接口
- 纯类型定义，无运行时依赖

#### 2.2.2 类型定义
```typescript
// types/index.ts

// 布局模式
export type LayoutMode = 'sidebar' | 'top' | 'mixed';

// 主题
export type Theme = 'light' | 'dark';

// 响应式断点
export interface Breakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

// 布局配置
export interface LayoutConfig {
  mode: LayoutMode;
  defaultCollapsed: boolean;
  defaultTheme: Theme;
  breakpoints: Breakpoints;
  headerHeight: number;
  sidebarWidth: number;
  sidebarCollapsedWidth: number;
  contentMaxWidth: number;
}

// 设计令牌
export interface LayoutTokens {
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
  };
}

// 布局状态
export interface LayoutState {
  collapsed: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  theme: Theme;
  activeRoute: string;
}
```

#### 2.2.3 默认配置
```typescript
// defaults.ts
import type { LayoutConfig, LayoutTokens } from './types';

export const defaultConfig: LayoutConfig = {
  mode: 'sidebar',
  defaultCollapsed: false,
  defaultTheme: 'light',
  breakpoints: {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
  },
  headerHeight: 64,
  sidebarWidth: 240,
  sidebarCollapsedWidth: 64,
  contentMaxWidth: 1200,
};

export const defaultTokens: LayoutTokens = {
  colors: {
    primary: '#1890ff',
    background: '#ffffff',
    surface: '#fafafa',
    text: '#333333',
    border: '#e8e8e8',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
    fontSize: 14,
    lineHeight: 1.5,
  },
};
```

### 2.3 设计层（@openlayout/design）

#### 2.3.1 核心职责
- 定义 CSS 变量（Variables）
- 定义主题（Themes）
- 定义设计令牌（Tokens）
- 依赖 layout-type 包

#### 2.3.2 CSS 变量
```css
/* variables.css */
:root {
  --layout-header-height: 64px;
  --layout-sidebar-width: 240px;
  --layout-sidebar-collapsed-width: 64px;
  --layout-content-max-width: 1200px;
  
  /* Colors */
  --layout-primary: #1890ff;
  --layout-background: #ffffff;
  --layout-surface: #fafafa;
  --layout-text: #333333;
  --layout-border: #e8e8e8;
  
  /* Spacing */
  --layout-spacing-xs: 4px;
  --layout-spacing-sm: 8px;
  --layout-spacing-md: 16px;
  --layout-spacing-lg: 24px;
  --layout-spacing-xl: 32px;
}
```

#### 2.3.3 主题定义
```typescript
// themes/light.css
:root {
  --layout-primary: #1890ff;
  --layout-background: #ffffff;
  --layout-text: #333333;
}

// themes/dark.css
[data-theme="dark"] {
  --layout-primary: #1890ff;
  --layout-background: #141414;
  --layout-text: #ffffff;
}
```

### 2.4 配置层（@openlayout/config）

#### 2.4.1 核心职责
- 提供默认配置
- 依赖 layout-type 包

#### 2.4.2 默认配置
```typescript
// defaults.ts
import type { LayoutConfig } from '@openlayout/type';

export const defaultConfig: LayoutConfig = {
  mode: 'sidebar',
  defaultCollapsed: false,
  defaultTheme: 'light',
  breakpoints: {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
  },
  headerHeight: 64,
  sidebarWidth: 240,
  sidebarCollapsedWidth: 64,
  contentMaxWidth: 1200,
};

export const defaultTokens: LayoutTokens = {
  colors: {
    primary: '#1890ff',
    background: '#ffffff',
    surface: '#fafafa',
    text: '#333333',
    border: '#e8e8e8',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
    fontSize: 14,
    lineHeight: 1.5,
  },
};
```

### 2.5 核心层（@openlayout/core）

#### 2.5.1 核心职责
- 纯 JavaScript/TypeScript 逻辑，无框架依赖
- 状态管理（响应式）
- 响应式检测（ResizeObserver + matchMedia）
- 布局尺寸计算

#### 2.4.2 状态管理器
```typescript
// state/createLayoutState.ts
import type { LayoutState, LayoutConfig } from '@openlayout/type';

type Listener = (state: LayoutState) => void;

export function createLayoutState(initialConfig: Partial<LayoutConfig>) {
  const state: LayoutState = {
    collapsed: initialConfig.defaultCollapsed ?? false,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    theme: initialConfig.defaultTheme ?? 'light',
    activeRoute: '/',
  };

  const listeners = new Set<Listener>();

  return {
    getState: () => state,
    setState: (partial: Partial<LayoutState>) => {
      Object.assign(state, partial);
      listeners.forEach(fn => fn(state));
    },
    subscribe: (fn: Listener) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    // Actions
    toggleCollapsed: () => state.collapsed = !state.collapsed,
    setTheme: (theme: 'light' | 'dark') => state.theme = theme,
  };
}
```

#### 2.3.3 响应式检测
```typescript
// media/useMediaQuery.ts
export function createMediaQuery(breakpoints: LayoutConfig['breakpoints']) {
  const queries = {
    mobile: window.matchMedia(`(max-width: ${breakpoints.mobile}px)`),
    tablet: window.matchMedia(`(min-width: ${breakpoints.mobile}px) and (max-width: ${breakpoints.tablet}px)`),
    desktop: window.matchMedia(`(min-width: ${breakpoints.tablet}px)`),
  };

  return {
    getMatches: () => ({
      isMobile: queries.mobile.matches,
      isTablet: queries.tablet.matches,
      isDesktop: queries.desktop.matches,
    }),
    subscribe: (callback: (matches: { isMobile: boolean; isTablet: boolean; isDesktop: boolean }) => void) => {
      const handler = () => callback(getMatches());
      queries.mobile.addEventListener('change', handler);
      queries.tablet.addEventListener('change', handler);
      queries.desktop.addEventListener('change', handler);
      return () => {
        queries.mobile.removeEventListener('change', handler);
        queries.tablet.removeEventListener('change', handler);
        queries.desktop.removeEventListener('change', handler);
      };
    },
  };
}
```

#### 2.3.4 布局计算
```typescript
// math/layoutMath.ts
import type { LayoutConfig } from '@openlayout/type';

export function calculateLayout(config: LayoutConfig, state: { collapsed: boolean; isMobile: boolean }) {
  const sidebarWidth = state.isMobile ? 0 : (state.collapsed ? config.sidebarCollapsedWidth : config.sidebarWidth);

  return {
    sidebarWidth,
    contentWidth: `calc(100% - ${sidebarWidth}px)`,
    contentMarginLeft: `${sidebarWidth}px`,
  };
}
```

### 2.4 框架适配层（Framework Adapters）

每个框架适配器负责：
1. **引入依赖**：安装 `@openlayout/type`、`@openlayout/config` 和 `@openlayout/core`
2. **状态桥接**：将纯 JS 状态桥接到框架响应式系统
3. **UI 组件**：实现各框架的组件库
4. **Hooks/Composables**：提供框架特有的 API

#### 2.4.1 React 适配器
```typescript
// @openlayout/react
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createLayoutState } from '@openlayout/core';
import { defaultConfig, type LayoutConfig } from '@openlayout/config';

const LayoutContext = createContext(null);

export function LayoutProvider({ config, children }) {
  const state = useMemo(() => createLayoutState({ ...defaultConfig, ...config }), [config]);
  const [layoutState, setLayoutState] = useState(state.getState());

  useEffect(() => state.subscribe(setLayoutState), [state]);

  const value = useMemo(() => ({
    state: layoutState,
    config: { ...defaultConfig, ...config },
    actions: {
      toggleCollapsed: state.toggleCollapsed,
      setTheme: state.setTheme,
    }
  }), [layoutState, config, state]);

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout() {
  return useContext(LayoutContext);
}
```

#### 2.4.2 Vue 3 适配器
```typescript
// @openlayout/vue
import { ref, reactive, provide, onMounted, onUnmounted } from 'vue';
import { createLayoutState } from '@openlayout/core';
import { defaultConfig, type LayoutConfig } from '@openlayout/config';

const layoutKey = Symbol('layout');

export function createLayout(config: LayoutConfig) {
  const state = createLayoutState({ ...defaultConfig, ...config });
  const layoutState = ref(state.getState());

  let unsubscribe: (() => void) | null = null;

  onMounted(() => {
    unsubscribe = state.subscribe((newState) => {
      layoutState.value = { ...newState };
    });
  });

  onUnmounted(() => unsubscribe?.());

  return {
    state: layoutState,
    config: { ...defaultConfig, ...config },
    actions: {
      toggleCollapsed: state.toggleCollapsed,
      setTheme: state.setTheme,
    }
  };
}

export function useLayout() {
  return inject(layoutKey);
}
```

### 2.5 样式方案

样式在各框架适配器中实现，使用 CSS Variables 保证一致性：

```css
/* 基础样式 - 在各框架中共享 */
:root {
  --od-header-height: 64px;
  --od-sidebar-width: 240px;
  --od-sidebar-collapsed-width: 64px;
  --od-content-max-width: 1200px;
  --od-primary: #1890ff;
  --od-background: #ffffff;
}
```

---

## 3. 接口与数据结构设计（API & Data Structures）

### 3.1 包结构

```
@openlayout/type       # 类型层（TypeScript 类型定义）
@openlayout/design     # 设计层（CSS 变量 + 主题 + 令牌）
@openlayout/config     # 配置层（默认配置）
@openlayout/core       # 核心层（状态管理 + 响应式检测 + 布局计算）
@openlayout/react      # React 适配器
@openlayout/vue        # Vue 3 适配器
```

#### 3.1.1 类型层目录结构（@openlayout/type）

```
packages/components/
└── layout/
    └── type/                      # 类型层
        ├── src/
        │   └── index.ts           # 类型定义
        ├── package.json
        └── tsconfig.json
```

#### 3.1.2 设计层目录结构（@openlayout/design）

```
packages/components/
└── layout/
    └── design/                    # 设计层
        ├── src/
        │   ├── variables.css      # CSS 变量
        │   ├── themes/           # 主题
        │   │   ├── light.css
        │   │   └── dark.css
        │   ├── tokens.ts         # 设计令牌
        │   └── index.ts          # 入口文件
        ├── package.json
        └── tsconfig.json
```

#### 3.1.3 配置层目录结构（@openlayout/config）

```
packages/components/
└── layout/
    └── config/                    # 配置层
        ├── src/
        │   ├── types/                # TypeScript 类型定义
        │   │   └── index.ts
        │   ├── defaults.ts          # 默认配置
        │   ├── tokens.ts            # 设计令牌
        │   └── index.ts             # 入口文件
        ├── package.json
        └── tsconfig.json
```

#### 3.1.4 核心层目录结构（@openlayout/core）

```
packages/components/
└── layout/
    └── core/                      # 核心层
        ├── src/
        │   ├── state/               # 状态管理
        │   │   └── createLayoutState.ts
        │   ├── media/              # 响应式检测
        │   │   └── useMediaQuery.ts
        │   ├── math/               # 布局计算
        │   │   └── layoutMath.ts
        │   ├── index.ts            # 入口文件
        ├── package.json
        └── tsconfig.json
```

#### 3.1.5 React 适配器目录结构（@openlayout/react）

```
packages/components/
└── layout/
    └── react/                     # React 适配器
        ├── src/
        │   ├── components/           # React 组件
        │   │   ├── Layout.tsx
        │   │   ├── Sidebar.tsx
        │   │   ├── Header.tsx
        │   │   ├── Content.tsx
        │   │   └── Footer.tsx
        │   ├── hooks/                # 自定义 Hooks
        │   │   ├── useLayout.ts
        │   │   ├── useSidebar.ts
        │   │   └── useHeader.ts
        │   ├── context/              # Context API
        │   │   └── LayoutContext.tsx
        │   ├── styles/               # React 专用样式
        │   │   └── index.css
        │   ├── types/                # 类型定义
        │   │   └── index.ts
        │   └── index.ts              # 入口文件
        ├── package.json
        └── tsconfig.json
```

#### 3.1.6 Vue 3 适配器目录结构（@openlayout/vue）

```
packages/components/
└── layout/
    └── vue/                        # Vue 3 适配器
        ├── src/
        │   ├── components/           # Vue 组件
        │   │   ├── Layout.vue
        │   │   ├── Sidebar.vue
        │   │   ├── Header.vue
        │   │   ├── Content.vue
        │   │   └── Footer.vue
        │   ├── composables/          # Vue Composables
        │   │   ├── useLayout.ts
        │   │   ├── useSidebar.ts
        │   │   └── useHeader.ts
        │   ├── styles/               # Vue 专用样式
        │   │   └── index.css
        │   ├── types/                # 类型定义
        │   │   └── index.ts
        │   └── index.ts              # 入口文件
        ├── package.json
        └── tsconfig.json
```

#### 3.1.7 Monorepo 工作区结构

```
opendesign/
├── pnpm-workspace.yaml
├── package.json
├── packages/
│   └── components/
│       └── layout/
│           ├── type/                # 类型层
│           ├── design/              # 设计层
│           ├── config/             # 配置层
│           ├── core/               # 核心层
│           ├── react/              # React 适配器
│           └── vue/                # Vue 3 适配器
└── configs/
    └── tsconfig/                # 已有 tsconfig 预设
```

### 3.2 类型定义（所有框架通用）

```typescript
interface LayoutConfig {
  mode: 'sidebar' | 'top' | 'mixed';  // 布局模式
  defaultCollapsed: boolean;          // 默认折叠状态
  defaultTheme: 'light' | 'dark';      // 默认主题
  breakpoints: {                       // 响应式断点
    mobile: number;
    tablet: number;
    desktop: number;
  };
  i18n: boolean;                      // 是否启用 RTL 支持
}
```

### 3.3 React API（@openlayout/react）

```typescript
// 主组件
function Layout(props: {
  config?: Partial<LayoutConfig>;
  children: React.ReactNode;
}): JSX.Element;

// 布局区域组件
function Sidebar(props: {
  collapsed?: boolean;
  collapsible?: boolean;
  width?: number;
  children: React.ReactNode;
}): JSX.Element;

function Header(props: {
  fixed?: boolean;
  children: React.ReactNode;
}): JSX.Element;

function Content(props: {
  maxWidth?: number | string;
  children: React.ReactNode;
}): JSX.Element;

// Hooks
function useLayout(): LayoutContextValue;

function useSidebar(): {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
};

function useHeader(): {
  height: number;
  fixed: boolean;
};
```

### 3.4 Vue 3 API（@openlayout/vue）

```typescript
// Composables
function useLayout(config?: Partial<LayoutConfig>): {
  collapsed: Ref<boolean>;
  isMobile: Ref<boolean>;
  theme: Ref<'light' | 'dark'>;
  toggleSidebar: () => void;
};

// 组件
const Layout = { /* ... */ };
const Sidebar = { /* ... */ };
const Header = { /* ... */ };
const Content = { /* ... */ };
```

---

## 4. 潜在风险与应对措施（Risks & Mitigations）

| 风险点 | 描述 | 应对措施 |
|---|---|---|
| **多框架同步维护成本** | 维护多个适配器可能导致 API 不一致或 bug 传播。 | 1. 所有适配器依赖统一的 `layout-type`、`layout-config` 和 `layout-core`。<br>2. 建立统一的 E2E 测试套件，覆盖所有框架。<br>3. 核心逻辑变更只需更新 `layout-core`，自动同步到所有适配器。 |
| **逻辑层与 UI 层状态同步** | 纯 JS 状态与框架响应式系统可能存在同步延迟。 | 1. 框架适配器使用 `useSyncExternalStore` (React) / `watchEffect` (Vue) 保证同步。<br>2. 状态更新使用不可变数据模式。 |
| **SSR 支持** | 逻辑层的 `window.matchMedia` 在服务端不可用。 | 1. 默认渲染桌面端布局。<br>2. 使用 CSS Media Queries 处理初始样式。<br>3. 客户端 `useEffect` 后订阅媒体查询变化。 |
| **类型共享** | 需要在多个包之间共享 TypeScript 类型。 | 1. `layout-config` 作为类型定义包，被其他所有包依赖。<br>2. 使用 `pnpm workspace` 优化类型引用。 |

---

## 5. 备选方案与权衡（Alternatives & Trade-offs）

### 5.1 方案 A：Config + Logic + Adapter（推荐）
- **实现**：配置层定义类型和默认值，逻辑层处理状态和计算，各框架适配器负责 UI。
- **优点**：
  - 完全 SSR 友好（无浏览器 API 依赖）。
  - 逻辑层纯 JS，可被任何框架复用。
  - 类型定义集中管理，保证 API 一致性。
- **缺点**：
  - 需要为每个框架编写适配器。

### 5.2 方案 B：Web Components 驱动
- **实现**：核心逻辑在 Web Components 中，各框架仅做浅层封装。
- **优点**：真正的跨框架复用，Vanilla JS 可直接使用。
- **缺点**：SSR 支持复杂，需要额外处理 Hydration。

### 5.3 方案 C：每个框架独立实现
- **实现**：为每个框架完全重写，共享设计规范。
- **优点**：开发体验最符合框架习惯。
- **缺点**：代码重复率高，维护成本高。

### 结论
选择 **方案 A（Config + Logic + Adapter）**，该方案 SSR 友好，架构清晰，易于维护。

---

## 6. 实施计划

### Phase 1: 类型层 + 设计层 + 配置层 + 核心层（2 周）
1. 开发 `@openlayout/type`
   - 定义 TypeScript 类型接口
2. 开发 `@openlayout/design`
   - 定义 CSS 变量和主题
   - 定义设计令牌（Tokens）
3. 开发 `@openlayout/config`
   - 实现默认配置
4. 开发 `@openlayout/core`
   - 实现状态管理器（createLayoutState）
   - 实现响应式检测（useMediaQuery）
   - 实现布局计算（layoutMath）

### Phase 2: React 适配器（1 周）
1. 开发 `@openlayout/react`
2. 实现 Context API 和 Hooks（useLayout, useSidebar, useHeader）
3. 开发基础 UI 组件（Layout, Sidebar, Header, Content, Footer）
4. Storybook 文档

### Phase 3: Vue 3 适配器（1 周）
1. 开发 `@openlayout/vue`
2. 实现 Composables（useLayout, useSidebar, useHeader）
3. 开发基础 UI 组件
4. Storybook 文档

### Phase 4: 测试与优化（1 周）
1. E2E 测试覆盖（跨框架一致性验证）
2. 性能优化
3. 文档完善

---

## 7. 验收标准

- [ ] `@openlayout/type` 提供完整 TypeScript 类型定义
- [ ] `@openlayout/design` 提供完整 CSS 变量、主题和设计令牌
- [ ] `@openlayout/config` 提供完整默认配置
- [ ] `@openlayout/core` 可在 Node.js 环境正常运行（无浏览器 API 依赖）
- [ ] React 和 Vue 3 适配器的 API 签名一致（概念上对等）
- [ ] 侧边栏折叠、响应式切换无明显卡顿（< 16ms）
- [ ] 移动端支持 Drawer 模式
- [ ] 支持 RTL 布局
- [ ] 通过 Storybook 展示所有布局模式
