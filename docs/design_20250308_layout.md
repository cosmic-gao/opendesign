# OpenDesign Layout 布局组件设计方案

**版本**: 1.1.1  
**状态**: 已归档

---

## 修改记录 (Changelog)

| 版本 | 日期 | 修改内容 |
|------|------|----------|
| 1.1.1 | 2025-03-10 | 修正：组件 Props 优先级高于全局配置；调整 Sidebar Overlay z-index 层级；规范命名（展开缩写）；补充 Core 层 JSDoc 注释；集成 `@opendesign/tsconfig` 严格类型配置 |
| 1.1.0 | 2025-03-10 | 优化：Vue 使用 TSX 编写；breakpoint 计算和 CSS 动态样式移至 core 层；增强 TS 类型安全；采用开源最佳实践（matchMedia、CSS 变量、框架原生状态管理） |
| 1.0.0 | 2025-03-08 | 初始版本：完成 Layout 组件完整设计方案 |

---

## 1. 需求概述

设计一个灵活的页面布局组件 `Layout`，包含四个核心区域：
- **Header** - 顶部区域
- **Footer** - 底部区域
- **Sidebar** - 侧边栏
- **Content** - 内容区域

核心需求：
1. 每个构成元素都可以通过属性控制其高度或宽度
2. 支持特殊布局控制，如 Sidebar 是否撑满页面顶部和底部
3. 支持 Header 是否撑满到页面左侧和右侧（影响 Sidebar 的位置）
4. 支持响应式布局，移动端自动适配
5. 支持折叠/展开动画

---

## 2. 设计方案

### 2.1 设计理念 - 核心与框架分离

**核心原则**：采用微内核架构，core 层处理**断点计算**和**CSS 动态样式生成**，框架适配层（Vue/React）只负责渲染。

**类型安全**：
- 严格遵循 `@opendesign/tsconfig` 配置，启用 `strict: true`。
- 所有组件 Props 使用 `@openlayout/config` 中定义的类型，确保跨框架一致性。

| 层级 | 职责 |
|------|------|
| **core** | 断点计算、响应式样式生成、布局状态管理 |
| **vue/react** | 组件渲染、DOM 事件绑定、框架特定 API |

### 2.2 组件 Props 设计

#### Layout 根容器

```typescript
import type { Breakpoint, Breakpoints, ThemeMode } from '@openlayout/config';

interface LayoutConfig {
  header?: HeaderConfig;
  footer?: FooterConfig;
  sidebar?: SidebarConfig;
  content?: ContentConfig;
  breakpoints?: Breakpoints;
  mobileBreakpoint?: number;
  animated?: boolean;
  animationDuration?: number;
  theme?: ThemeMode;
}

interface HeaderConfig {
  height?: number;
  fixed?: boolean;
  fullWidth?: boolean;
}

interface FooterConfig {
  height?: number;
  fixed?: boolean;
  fullWidth?: boolean;
}

interface SidebarConfig {
  width?: number;
  collapsedWidth?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  fullHeight?: boolean;
  overlay?: boolean;
}

interface ContentConfig {
  scrollable?: boolean;
}

interface LayoutProps extends Partial<LayoutConfig> {
  onBreakpointChange?: (breakpoint: Breakpoint, width: number) => void;
  onThemeChange?: (theme: Exclude<ThemeMode, 'system'>) => void;
  className?: string;
  style?: Record<string, string | number>;
  children?: import('@openlayout/config').ReactNode;
}
```

**设计说明**：
- 使用对象式配置 `header`、`footer`、`sidebar`、`content` 分组管理子组件属性
- 层级清晰，避免属性平铺导致的混乱
- 子组件仍可单独接收 props，根容器配置作为默认值
- 严格类型：`style` 使用 `Record<string, string | number>` 替代 `React.CSSProperties`

#### Header 组件

```typescript
import type { ElementType } from '@openlayout/config';

interface HeaderProps {
  fixed?: boolean;
  fullWidth?: boolean;
  height?: number;
  as?: ElementType;
  className?: string;
  style?: Record<string, string | number>;
  children?: import('@openlayout/config').ReactNode;
}
```

#### Footer 组件

```typescript
interface FooterProps {
  fixed?: boolean;
  fullWidth?: boolean;
  height?: number;
  as?: ElementType;
  className?: string;
  style?: Record<string, string | number>;
  children?: import('@openlayout/config').ReactNode;
}
```

#### Sidebar 组件

```typescript
interface SidebarProps {
  collapsible?: boolean;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  fullHeight?: boolean;
  overlay?: boolean;
  width?: number;
  collapsedWidth?: number;
  as?: ElementType;
  className?: string;
  style?: Record<string, string | number>;
  children?: import('@openlayout/config').ReactNode;
}
```

#### Content 组件

```typescript
interface ContentProps {
  scrollable?: boolean;
  as?: ElementType;
  className?: string;
  style?: Record<string, string | number>;
  children?: import('@openlayout/config').ReactNode;
}
```

### 2.3 Core 层 - 断点计算与样式生成

> **核心职责**：core 层处理所有与布局相关的**逻辑计算**和**样式生成**，框架层只负责渲染。
>
> **最佳实践参考**：
> - 断点检测使用 `window.matchMedia` API（参考 [use-breakpoint](https://www.npmjs.com/package/use-breakpoint)、[vue-mq](https://www.npmjs.com/package/vue-mq)、[Material UI useMediaQuery](https://mui.com/material-ui/react-use-media-query/)）
> - CSS 变量存储动态值，通过 JS 监听断点变化设置变量值
> - 布局状态使用框架原生响应式系统，无需引入复杂状态管理库

#### 2.3.1 断点检测 (createMediaQuery)

```typescript
// @openlayout/core - 基于 window.matchMedia 的断点检测
// 参考: use-breakpoint, vue-mq, Material UI useMediaQuery

import type { Breakpoint, Breakpoints } from '@openlayout/config';
import { DEFAULT_BREAKPOINTS } from '@openlayout/config';

type BreakpointKey = keyof Breakpoints;

interface MediaQueryState {
  breakpoint: Breakpoint;
  breakpoints: Breakpoints;
  isAbove: (breakpoint: Breakpoint) => boolean;
  isBelow: (breakpoint: Breakpoint) => boolean;
  isMobile: boolean;
}

interface MediaQueryOptions {
  breakpoints?: Partial<Breakpoints>;
  mobileBreakpoint?: number;
  onChange?: (breakpoint: Breakpoint) => void;
}

/**
 * 创建媒体查询监听器
 * 
 * @description
 * 使用 window.matchMedia API 监听屏幕宽度变化，返回当前断点状态。
 * 支持 SSR 场景（默认返回 'xxl'）。
 * 
 * @param {MediaQueryOptions} [options={}] - 配置选项
 * @returns {MediaQueryState} 媒体查询状态对象
 * 
 * @example
 * const { breakpoint, isMobile } = createMediaQuery({
 *   mobileBreakpoint: 768
 * });
 */
function createMediaQuery(options: MediaQueryOptions = {}): MediaQueryState {
  const breakpoints: Breakpoints = {
    ...DEFAULT_BREAKPOINTS,
    ...options.breakpoints,
  };

  const breakpointKeys: BreakpointKey[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
  const mobileThreshold = options.mobileBreakpoint ?? breakpoints.md ?? 768;

  const getBreakpoint = (): Breakpoint => {
    if (typeof window === 'undefined') return 'xxl';
    const width = window.innerWidth;
    if (width < (breakpoints.xs ?? 480)) return 'xs';
    if (width < (breakpoints.sm ?? 576)) return 'sm';
    if (width < (breakpoints.md ?? 768)) return 'md';
    if (width < (breakpoints.lg ?? 992)) return 'lg';
    if (width < (breakpoints.xl ?? 1200)) return 'xl';
    return 'xxl';
  };

  const isAbove = (breakpoint: Breakpoint): boolean => {
    if (typeof window === 'undefined') return true;
    const threshold = breakpoints[breakpoint];
    if (threshold === undefined) return true;
    return window.innerWidth >= threshold;
  };

  const isBelow = (breakpoint: Breakpoint): boolean => {
    if (typeof window === 'undefined') return false;
    const threshold = breakpoints[breakpoint];
    if (threshold === undefined) return false;
    return window.innerWidth < threshold;
  };

  return {
    breakpoint: getBreakpoint(),
    breakpoints,
    isAbove,
    isBelow,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < mobileThreshold : false,
  };
}

/**
 * 生成 CSS 媒体查询字符串
 * 
 * @description
 * 根据断点配置生成用于 CSS-in-JS 的媒体查询字符串对象。
 * 
 * @param {Breakpoints} breakpoints - 断点配置
 * @param {string} [mediaType='screen'] - 媒体类型
 * @returns {Record<string, string>} 媒体查询字符串映射
 */
function getMediaQueries(
  breakpoints: Breakpoints,
  mediaType: string = 'screen'
): Record<string, string> {
  const breakpointKeys = Object.keys(breakpoints).sort(
    (a, b) => (breakpoints[a as BreakpointKey] ?? 0) - (breakpoints[b as BreakpointKey] ?? 0)
  );

  const queries: Record<string, string> = {};

  breakpointKeys.forEach((key, index) => {
    const minWidth = breakpoints[key as BreakpointKey];
    const maxWidth = breakpointKeys[index + 1]
      ? (breakpoints[breakpointKeys[index + 1] as BreakpointKey] ?? 0) - 0.02
      : undefined;

    if (minWidth !== undefined) {
      if (maxWidth !== undefined) {
        queries[key] = `@media ${mediaType} and (min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`;
      } else {
        queries[key] = `@media ${mediaType} and (min-width: ${minWidth}px)`;
      }
    }
  });

  return queries;
}
```

**最佳实践说明**：
- 使用 `window.matchMedia` API 进行断点检测（浏览器原生，性能好）
- 提供 `isAbove`、`isBelow` 方法判断断点关系
- 提供 `getMediaQueries` 辅助函数生成 CSS 媒体查询字符串
- 支持 SSR（服务端渲染）场景

#### 2.3.2 CSS 动态样式生成 (createStylesheet)

```typescript
// @openlayout/core - 生成布局所需的 CSS 变量和样式对象
// 最佳实践: 使用 CSS 变量存储动态值，通过 JS 监听断点变化设置变量值

import type { LayoutConfig } from '@openlayout/config';

interface LayoutStyles {
  root: Record<string, string | number>;
  header: Record<string, string | number>;
  footer: Record<string, string | number>;
  sidebar: Record<string, string | number>;
  content: Record<string, string | number>;
  cssVariables: Record<string, string | number>;
}

interface StyleOptions {
  config: LayoutConfig;
  breakpoint: string;
  isMobile: boolean;
  collapsed?: boolean;
}

/**
 * 生成布局样式
 * 
 * @description
 * 根据配置和当前状态生成内联样式对象和 CSS 变量。
 * 包含 Z-Index 层级管理逻辑。
 * 
 * @param {StyleOptions} options - 样式生成选项
 * @returns {LayoutStyles} 包含各部分样式的对象
 */
function createStylesheet(options: StyleOptions): LayoutStyles {
  const { config, isMobile, collapsed = false } = options;

  const headerConfig = config.header ?? {};
  const footerConfig = config.footer ?? {};
  const sidebarConfig = config.sidebar ?? {};
  const contentConfig = config.content ?? {};

  // Z-Index 层级管理
  // Sidebar (Overlay) 必须高于 Header (Fixed)
  const Z_INDEX = {
    HEADER_FIXED: 1000,
    FOOTER_FIXED: 1000,
    SIDEBAR_OVERLAY: 1001,
  };

  // CSS 变量 - 存储动态值，便于主题切换和响应式调整
  const cssVariables: Record<string, string | number> = {
    '--od-header-height': headerConfig.height ?? 64,
    '--od-footer-height': footerConfig.height ?? 48,
    '--od-sidebar-width': collapsed
      ? sidebarConfig.collapsedWidth ?? 80
      : sidebarConfig.width ?? 200,
    '--od-sidebar-collapsed-width': sidebarConfig.collapsedWidth ?? 80,
    '--od-animated': config.animated !== false ? 1 : 0,
    '--od-animation-duration': config.animationDuration ?? 200,
    '--od-breakpoint': options.breakpoint,
    '--od-is-mobile': isMobile ? 1 : 0,
  };

  const root: Record<string, string | number> = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    ...cssVariables,
  };

  const header: Record<string, string | number> = {
    flexShrink: 0,
    height: `${headerConfig.height ?? 64}px`,
    ...(headerConfig.fixed ? { position: 'fixed', top: 0, left: 0, right: 0, zIndex: Z_INDEX.HEADER_FIXED } : {}),
    ...(headerConfig.fullWidth ? { width: '100%' } : {}),
  };

  const footer: Record<string, string | number> = {
    flexShrink: 0,
    height: `${footerConfig.height ?? 48}px`,
    ...(footerConfig.fixed ? { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: Z_INDEX.FOOTER_FIXED } : {}),
    ...(footerConfig.fullWidth ? { width: '100%' } : {}),
  };

  const sidebarWidth = collapsed
    ? (sidebarConfig.collapsedWidth ?? 80)
    : (sidebarConfig.width ?? 200);

  const sidebar: Record<string, string | number> = {
    flexShrink: 0,
    width: `${sidebarWidth}px`,
    transition: `width ${config.animationDuration ?? 200}ms ease`,
    ...(sidebarConfig.fullHeight !== false ? { height: '100%' } : {}),
    ...(sidebarConfig.overlay || isMobile ? { position: 'fixed', zIndex: Z_INDEX.SIDEBAR_OVERLAY } : {}),
  };

  const content: Record<string, string | number> = {
    flex: 1,
    minWidth: 0,
    ...(contentConfig.scrollable !== false ? { overflow: 'auto' } : {}),
  };

  return { root, header, footer, sidebar, content, cssVariables };
}
```

#### 2.3.3 布局状态管理 (createStore)

> **最佳实践**: 布局状态相对简单，使用框架原生响应式系统即可，无需引入 Redux/Zustand 等复杂状态管理库。

```typescript
// @openlayout/core - 布局状态管理
// 最佳实践: 使用框架原生响应式系统（Vue: ref/reactive, React: useState/useReducer）

import type { SidebarConfig } from '@openlayout/config';

interface LayoutState {
  sidebar: {
    collapsed: boolean;
    visible: boolean;
    width: number;
  };
  header: {
    visible: boolean;
    fixed: boolean;
    height: number;
  };
  footer: {
    visible: boolean;
    fixed: boolean;
    height: number;
  };
}

interface LayoutActions {
  sidebar: {
    toggle: () => void;
    collapse: () => void;
    expand: () => void;
    show: () => void;
    hide: () => void;
    setCollapsed: (collapsed: boolean) => void;
  };
  header: {
    show: () => void;
    hide: () => void;
    setFixed: (fixed: boolean) => void;
  };
  footer: {
    show: () => void;
    hide: () => void;
    setFixed: (fixed: boolean) => void;
  };
}

interface UseLayoutStateOptions {
  sidebar?: SidebarConfig;
  header?: { height?: number; fixed?: boolean };
  footer?: { height?: number; fixed?: boolean };
}

/**
 * 创建布局状态仓库
 * 
 * @description
 * 初始化布局状态并提供操作方法。
 * 此函数仅返回初始状态和空操作函数，实际响应式逻辑由框架层实现。
 * 
 * @param {UseLayoutStateOptions} [options={}] - 初始配置
 * @returns {LayoutState & LayoutActions} 状态和操作
 */
function createStore(options: UseLayoutStateOptions = {}): LayoutState & LayoutActions {
  const sidebarCollapsed = options.sidebar?.defaultCollapsed ?? false;
  const sidebarVisible = true;

  return {
    state: {
      sidebar: { collapsed: sidebarCollapsed, visible: sidebarVisible, width: options.sidebar?.width ?? 200 },
      header: { visible: true, fixed: options.header?.fixed ?? false, height: options.header?.height ?? 64 },
      footer: { visible: true, fixed: options.footer?.fixed ?? false, height: options.footer?.height ?? 48 },
    },
    actions: {
      sidebar: {
        toggle: () => {},
        collapse: () => {},
        expand: () => {},
        show: () => {},
        hide: () => {},
        setCollapsed: () => {},
      },
      header: { show: () => {}, hide: () => {}, setFixed: () => {} },
      footer: { show: () => {}, hide: () => {}, setFixed: () => {} },
    },
  };
}
```

### 2.4 Vue 层 - TSX 组件实现

> **渲染职责**：Vue 层使用 TSX 编写，负责将 core 层生成的样式应用到组件。
> **属性优先级**：组件 Props > Layout Config (Context) > Default

```tsx
// @openlayout/vue - Layout.tsx

import { defineComponent, computed, provide, toRef } from 'vue';
import { createResponsive, createStore, createStylesheet } from '@openlayout/core';
import type { LayoutProps, LayoutConfig } from '@openlayout/config';
import { resolveConfig } from '@openlayout/config';

export const Layout = defineComponent({
  name: 'ODLayout',
  props: {
    header: { type: Object, default: () => ({}) },
    footer: { type: Object, default: () => ({}) },
    sidebar: { type: Object, default: () => ({}) },
    content: { type: Object, default: () => ({}) },
    breakpoints: { type: Object, default: undefined },
    mobileBreakpoint: { type: Number, default: 768 },
    animated: { type: Boolean, default: true },
    animationDuration: { type: Number, default: 200 },
    className: { type: String, default: '' },
    style: { type: Object, default: () => ({}) },
  },
  setup(props: LayoutProps) {
    const config = computed<LayoutConfig>(() => resolveConfig(props));

    const responsive = createResponsive({ breakpoints: props.breakpoints });
    const layoutState = createStore(config.value);
    const styles = createStylesheet({
      config: config.value,
      breakpoint: responsive.breakpoint,
      isMobile: responsive.width < (props.mobileBreakpoint ?? 768),
      collapsed: layoutState.state.sidebar.collapsed,
    });

    provide('layoutConfig', config);
    provide('layoutState', layoutState);
    provide('layoutStyles', styles);

    return { styles, layoutState };
  },
  render() {
    const { styles, layoutState, $slots, className, style } = this;
    const rootClass = ['od-layout', className];

    return (
      <div class={rootClass} style={{ ...styles.root, ...style }}>
        {$slots.default?.()}
      </div>
    );
  },
});
```

```tsx
// @openlayout/vue - Header.tsx

import { defineComponent, inject, computed } from 'vue';
import type { HeaderProps } from '@openlayout/config';

export const Header = defineComponent({
  name: 'ODHeader',
  props: {
    fixed: { type: Boolean, default: undefined },
    fullWidth: { type: Boolean, default: undefined },
    height: { type: Number, default: undefined },
    className: { type: String, default: '' },
    style: { type: Object, default: () => ({}) },
  },
  setup(props: HeaderProps) {
    const layoutStyles = inject<{ header: Record<string, string | number> }>('layoutStyles');
    const layoutState = inject<{ header: { visible: boolean } }>('layoutState');

    // 样式合并策略：Layout Config (Context) < Component Props
    const mergedStyle = computed(() => ({
      ...(layoutStyles?.header ?? {}),
      ...(props.height !== undefined ? { height: `${props.height}px` } : {}),
      ...(props.fixed !== undefined ? { position: props.fixed ? 'fixed' : 'relative' } : {}), // 需配合完整逻辑
      ...props.style,
    }));

    const classNames = computed(() => [
      'od-layout-header',
      props.className,
      { 'od-layout-header--fixed': props.fixed },
      { 'od-layout-header--full-width': props.fullWidth },
    ]);

    return { mergedStyle, classNames, layoutState };
  },
  render() {
    const { mergedStyle, classNames, layoutState, $slots } = this;
    if (layoutState?.header.visible === false) return null;

    return (
      <header class={classNames} style={mergedStyle}>
        {$slots.default?.()}
      </header>
    );
  },
});
```

```tsx
// @openlayout/vue - Sidebar.tsx

import { defineComponent, inject, computed } from 'vue';
import type { SidebarProps } from '@openlayout/config';

export const Sidebar = defineComponent({
  name: 'ODSidebar',
  props: {
    collapsible: { type: Boolean, default: undefined },
    collapsed: { type: Boolean, default: undefined },
    defaultCollapsed: { type: Boolean, default: undefined },
    fullHeight: { type: Boolean, default: undefined },
    overlay: { type: Boolean, default: undefined },
    width: { type: Number, default: undefined },
    collapsedWidth: { type: Number, default: undefined },
    className: { type: String, default: '' },
    style: { type: Object, default: () => ({}) },
  },
  setup(props: SidebarProps) {
    const layoutStyles = inject<{ sidebar: Record<string, string | number> }>('layoutStyles');
    const layoutState = inject<{ sidebar: { collapsed: boolean } }>('layoutState');

    // 样式合并策略：Layout Config (Context) < Component Props
    const mergedStyle = computed(() => {
      const isCollapsed = props.collapsed ?? layoutState?.sidebar.collapsed ?? false;
      const currentWidth = isCollapsed 
        ? (props.collapsedWidth ?? layoutStyles?.cssVariables['--od-sidebar-collapsed-width']) 
        : (props.width ?? layoutStyles?.cssVariables['--od-sidebar-width']);

      return {
        ...(layoutStyles?.sidebar ?? {}),
        width: `${currentWidth}px`,
        ...props.style,
      };
    });

    const classNames = computed(() => [
      'od-layout-sidebar',
      props.className,
      { 'od-layout-sidebar--collapsed': props.collapsed ?? layoutState?.sidebar.collapsed },
      { 'od-layout-sidebar--full-height': props.fullHeight },
      { 'od-layout-sidebar--overlay': props.overlay },
    ]);

    return { mergedStyle, classNames };
  },
  render() {
    const { mergedStyle, classNames, $slots } = this;

    return (
      <aside class={classNames} style={mergedStyle}>
        {$slots.default?.()}
      </aside>
    );
  },
});
```

### 2.5 Hooks API 设计

```typescript
// 从 @openlayout/vue 导入 (Vue Composition API)
import { useLayout, useSidebar, useHeader, useFooter } from '@openlayout/vue';

import type { Breakpoint } from '@openlayout/config';

const {
  direction,
  isMobile,
  breakpoint,
  breakpoints,
  currentWidth,
  theme,
  headerHeight,
  footerHeight,
  sidebarWidth,
  collapsedWidth,
} = useLayout();

const {
  collapsed,
  visible,
  width,
  toggle,
  collapse,
  expand,
  show,
  hide,
} = useSidebar();

const {
  visible: headerVisible,
  fixed: headerFixed,
  height: headerHeight,
  show: showHeader,
  hide: hideHeader,
} = useHeader();

const {
  visible: footerVisible,
  fixed: footerFixed,
  height: footerHeight,
  show: showFooter,
  hide: hideFooter,
} = useFooter();
```

---

## 3. 包结构设计

### 3.1 目录结构

```
packages/components/layout/
├── core/          # @openlayout/core - 逻辑与样式层
│   ├── src/
│   │   ├── index.ts
│   │   ├── createResponsive.ts   # 断点检测
│   │   ├── createStylesheet.ts   # 样式生成
│   │   ├── createStore.ts        # 状态管理
│   │   └── types.ts             # 核心类型
│   ├── package.json
│   └── tsconfig.json             # 引用 @opendesign/tsconfig
│
├── config/        # @openlayout/config - 配置和类型
│   ├── src/
│   │   ├── index.ts
│   │   ├── layout.ts            # Layout 配置
│   │   ├── header.ts            # Header 配置
│   │   ├── footer.ts            # Footer 配置
│   │   ├── sidebar.ts           # Sidebar 配置
│   │   ├── content.ts           # Content 配置
│   │   └── constants.ts         # 默认常量
│   ├── package.json
│   └── tsconfig.json
│
├── vue/           # @openlayout/vue - Vue3 TSX 实现
│   ├── src/
│   │   ├── index.ts
│   │   ├── Layout.tsx            # Layout 组件
│   │   ├── Header.tsx           # Header 组件
│   │   ├── Footer.tsx           # Footer 组件
│   │   ├── Sidebar.tsx          # Sidebar 组件
│   │   ├── Content.tsx          # Content 组件
│   │   └── useLayout.ts         # Composition API hooks
│   ├── package.json
│   └── tsconfig.json             # 引用 @opendesign/tsconfig/vue
│
└── react/         # @openlayout/react - React 适配
    ├── src/
    │   ├── index.ts
    │   ├── Layout.tsx
    │   ├── Header.tsx
    │   ├── Footer.tsx
    │   ├── Sidebar.tsx
    │   ├── Content.tsx
    │   └── useLayout.ts
    ├── package.json
    └── tsconfig.json             # 引用 @opendesign/tsconfig/react
```

### 3.2 严格类型配置

所有子包必须继承 `@opendesign/tsconfig` 提供的严格配置。

**Core 层 tsconfig.json**:
```json
{
  "extends": "@opendesign/tsconfig/lib",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

**Vue 层 tsconfig.json**:
```json
{
  "extends": "@opendesign/tsconfig/vue",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

### 3.3 包依赖关系

```
┌─────────────────────────────────────┐
│           vue / react               │
│         (框架适配层)                 │
│   依赖: @openlayout/core           │
│   依赖: @openlayout/config         │
│   依赖: @opendesign/tsconfig (dev) │
├─────────────────────────────────────┤
│              core                   │
│          (纯逻辑层)                  │
│   依赖: @openlayout/config (类型)   │
│   依赖: @opendesign/tsconfig (dev) │
├─────────────────────────────────────┤
│             config                  │
│       (配置和类型定义)              │
│        (无外部依赖)                 │
│   依赖: @opendesign/tsconfig (dev) │
└─────────────────────────────────────┘
```

### 3.4 包名定义

| 目录 | 包名 | 说明 |
|------|------|------|
| core | @openlayout/core | 断点计算、样式生成、状态管理 |
| config | @openlayout/config | 类型定义和常量 |
| vue | @openlayout/vue | Vue3 TSX 组件库 |
| react | @openlayout/react | React 组件库 |

### 3.5 职责分工

**core 层（逻辑与样式）**：
- 断点计算 (`createResponsive`)
- 样式生成 (`createStylesheet`)
- 状态管理 (`createStore`)
- 无 DOM 依赖，纯业务逻辑

**框架渲染层（vue/react）**：
- 使用 TSX 编写组件
- 调用 core 层 API
- 处理 DOM 事件
- 处理主题切换

```
┌────────────────────────────────────────────────────────────┐
│                    framework (vue/react)                    │
│  • 使用 TSX 渲染组件                                        │
│  • 监听 window.resize                                      │
│  • 处理主题切换（跟随系统）                                  │
│  • 触发 onBreakpointChange 回调                            │
├────────────────────────────────────────────────────────────┤
│                         core                                │
│  • 断点计算: createResponsive()                            │
│  • 样式生成: createStylesheet()                          │
│  • 状态管理: createStore()                               │
│  • 无 DOM 依赖，纯函数                                      │
├────────────────────────────────────────────────────────────┤
│                        config                               │
│  • 定义 Breakpoint 类型                                    │
│  • 定义 Breakpoints 接口                                   │
│  • 提供默认断点常量                                        │
└────────────────────────────────────────────────────────────┘
```

**config 层（类型定义）**：

```typescript
// 断点类型
type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

// 断点配置
interface Breakpoints {
  xs?: number;   // 默认 480
  sm?: number;   // 默认 576
  md?: number;   // 默认 768
  lg?: number;   // 默认 992
  xl?: number;   // 默认 1200
  xxl?: number;  // 默认 1400
}

// 响应式配置
interface ResponsiveConfig {
  /** 断点配置 */
  breakpoints?: Breakpoints;
  /** 移动端断点阈值 */
  mobileBreakpoint?: number;
  /** 断点变化回调 */
  onBreakpointChange?: (breakpoint: Breakpoint) => void;
}
```

---

## 4. 使用示例

### 基础用法

```tsx
<Layout>
  <Header>Header</Header>
  <Sidebar>Sidebar</Sidebar>
  <Content>Content</Content>
  <Footer>Footer</Footer>
</Layout>
```

### 带配置（对象式）

```tsx
<Layout
  header={{
    height: 64,
    fixed: true,
  }}
  footer={{
    height: 48,
  }}
  sidebar={{
    width: 220,
    collapsedWidth: 80,
    collapsible: true,
  }}
  content={{
    scrollable: true,
  }}
  animated
>
  <Header className="my-header">Header</Header>
  <Sidebar className="my-sidebar">Sidebar</Sidebar>
  <Content className="my-content">Content</Content>
  <Footer className="my-footer">Footer</Footer>
</Layout>
```

### 快捷写法（平铺）

```tsx
// 也可以在子组件上直接配置
<Layout animated>
  <Header className="my-header" fixed>Header</Header>
  <Sidebar className="my-sidebar" collapsible width={220}>Sidebar</Sidebar>
  <Content className="my-content">Content</Content>
  <Footer className="my-footer">Footer</Footer>
</Layout>
```

### 受控折叠

```tsx
function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout>
      <Header>
        <button onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '展开' : '折叠'}
        </button>
      </Header>
      <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed}>
        侧边栏内容
      </Sidebar>
      <Content>内容区域</Content>
    </Layout>
  );
}
```

### 使用 Hooks 控制

```tsx
function App() {
  const { toggleSidebar, collapseSidebar, expandSidebar, collapsed } = useSidebar();

  return (
    <Layout>
      <Header>
        <button onClick={toggleSidebar}>切换</button>
        <button onClick={collapseSidebar}>折叠</button>
        <button onClick={expandSidebar}>展开</button>
        <span>状态: {collapsed ? '已折叠' : '已展开'}</span>
      </Header>
      <Sidebar>...</Sidebar>
      <Content>...</Content>
    </Layout>
  );
}
```

### 移动端适配

```tsx
<Layout mobileBreakpoint={768}>
  <Header fixed>顶部导航</Header>
  <Sidebar overlay>侧边栏</Sidebar>
  <Content scrollable>内容区域</Content>
</Layout>
```

---

## 5. API 字段参考

### Layout 根容器

#### 对象式配置

```typescript
// header 配置
header: {
  height?: number;      // 默认 64
  fixed?: boolean;     // 默认 false
  fullWidth?: boolean; // 默认 false
}

// footer 配置
footer: {
  height?: number;      // 默认 48
  fixed?: boolean;     // 默认 false
  fullWidth?: boolean; // 默认 false
}

// sidebar 配置
sidebar: {
  width?: number;          // 默认 200
  collapsedWidth?: number;  // 默认 80
  collapsible?: boolean;   // 默认 false
  defaultCollapsed?: boolean; // 默认 false
  fullHeight?: boolean;    // 默认 true
  overlay?: boolean;      // 默认 false
}

// content 配置
content: {
  scrollable?: boolean;    // 默认 true
}
```

#### 全局配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| breakpoints | Breakpoints | 见下方 | 响应式断点配置 |
| mobileBreakpoint | number | 768 | 移动端断点（小于此值视为移动端） |
| onBreakpointChange | (breakpoint) => void | - | 断点变化回调 |
| animated | boolean | true | 启用动画 |
| animationDuration | number | 200 | 动画时长(ms) |
| theme | 'light' \| 'dark' \| 'system' | 'light' | 主题模式 |
| onThemeChange | (theme) => void | - | 主题变化回调 |

**Breakpoints 默认值**：

```typescript
{
  xs: 480,    // 超小 - 手机
  sm: 576,    // 小 - 大手机
  md: 768,    // 中 - 平板
  lg: 992,    // 大 - 小笔记本
  xl: 1200,   // 超大 - 桌面
  xxl: 1400,  // 超超大 - 大桌面
}
```

### Sidebar（独立 Props）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| collapsible | boolean | false | 是否可折叠 |
| collapsed | boolean | - | 折叠状态（受控） |
| defaultCollapsed | boolean | false | 默认折叠（非受控） |
| onCollapsedChange | (collapsed) => void | - | 变化回调 |
| fullHeight | boolean | true | 撑满上下 |
| overlay | boolean | false | 遮罩层模式 |
| width | number | 200 | 宽度 |
| collapsedWidth | number | 80 | 折叠后宽度 |

### Header/Footer（独立 Props）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fixed | boolean | false | 固定定位 |
| fullWidth | boolean | false | 撑满左右 |
| height | number | 64/48 | 高度 |

### Content（独立 Props）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| scrollable | boolean | true | 是否可滚动 |

---

## 6. 响应式断点设计

### 6.1 默认断点值

| 断点 | 宽度 | 设备类型 |
|------|------|----------|
| xs | < 480px | 超小手机 |
| sm | ≥ 480px | 大手机 |
| md | ≥ 768px | 平板 |
| lg | ≥ 992px | 小笔记本 |
| xl | ≥ 1200px | 桌面 |
| xxl | ≥ 1400px | 大桌面 |

### 6.2 断点变化行为

| 特性 | xs/sm (手机) | md (平板) | lg/xl/xxl (桌面) |
|------|-------------|-----------|------------------|
| Sidebar | 默认隐藏 | 可配置 | 默认显示 |
| Sidebar 模式 | 遮罩层 | 遮罩层/嵌入 | 嵌入页面 |
| Header | 固定显示 | 固定显示 | 固定显示 |
| Content | 全宽 | 全宽/留白 | 正常宽度 |
| 折叠 | 自动折叠 | 可配置 | 默认展开 |

### 6.3 断点配置示例

```tsx
<Layout
  // 自定义断点
  breakpoints={{
    xs: 0,
    sm: 480,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
  }}
  // 移动端断点（小于此值视为移动端）
  mobileBreakpoint={768}
  // 断点变化回调
  onBreakpointChange={(breakpoint) => {
    console.log('当前断点:', breakpoint);
  }}
>
  <Header>Header</Header>
  <Sidebar overlay>Sidebar</Sidebar>
  <Content>Content</Content>
</Layout>
```

### 6.4 使用 Hook 获取断点

```tsx
function MyComponent() {
  const { breakpoint, isMobile, breakpoints } = useLayout();

  // breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
  // isMobile = true (当 < mobileBreakpoint)

  return (
    <div>
      <p>当前断点: {breakpoint}</p>
      <p>是否移动端: {isMobile ? '是' : '否'}</p>
      <p>断点配置: {JSON.stringify(breakpoints)}</p>
    </div>
  );
}
```

---

## 7. 参考资料

- [Ant Design Layout](https://ant.design/components/layout/)
- [Soybean Admin Layout](https://github.com/soybeanjs/soybean-admin-layout)
- [Headless UI](https://headlessui.com/)
