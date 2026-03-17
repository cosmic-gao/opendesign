# OpenDesign Layout 布局组件设计方案

**版本**: 0.0.1
**状态**: 已归档

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

***

## 2. 设计方案

### 2.1 设计理念 - 核心与框架分离

**核心原则**：采用微内核架构，core 层处理**断点计算**和**CSS 动态样式生成**，Vue 层只负责渲染。

**类型安全**：

- 严格遵循 `@opendesign/tsconfig` 配置，启用 `strict: true`。
- 所有组件 Props 使用 `@openlayout/config` 中定义的类型，确保类型一致性。

| 层级            | 职责                     |
| ------------- | ---------------------- |
| **core**      | 断点计算、响应式样式生成、布局状态管理    |
| **vue** | 组件渲染、DOM 事件绑定、框架特定 API |

### 2.2 组件 Props 设计

#### Layout 根容器

```typescript
import type { Breakpoint, Breakpoints, CSSProperties, VNode } from '@openlayout/config';

interface LayoutConfig {
  header?: HeaderConfig;
  footer?: FooterConfig;
  sidebar?: SidebarConfig;
  content?: ContentConfig;
  breakpoints?: Breakpoints;
  mobileBreakpoint?: number;
  animation?: AnimationConfig;
}

interface HeaderConfig {
  /** 是否启用/显示 */
  enabled?: boolean;
  height?: number;
  fixed?: boolean;
  full?: boolean;
}

interface FooterConfig {
  /** 是否启用/显示 */
  enabled?: boolean;
  height?: number;
  fixed?: boolean;
  full?: boolean;
}

interface SidebarConfig {
  /** 是否启用/显示 */
  enabled?: boolean;
  width?: number;
  min?: number;
  collapsible?: boolean;
  collapsed?: boolean;
  full?: boolean;
  overlay?: boolean;
}

interface ContentConfig {
  /** 是否启用/显示 */
  enabled?: boolean;
  scrollable?: boolean;
}

interface AnimationConfig {
  /** 是否启用动画 */
  enabled?: boolean;
  /** 动画时长(ms) */
  duration?: number;
  /** 动画缓动函数 */
  easing?: string;
}

interface LayoutProps extends Partial<LayoutConfig> {
  onBreakpointChange?: (breakpoint: Breakpoint, width: number) => void;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
```

**设计说明**：

- 使用对象式配置 `header`、`footer`、`sidebar`、`content` 分组管理子组件属性
- 层级清晰，避免属性平铺导致的混乱
- 子组件仍可单独接收 props，根容器配置作为默认值
- 严格类型：使用标准的 `CSSProperties` 类型

#### Header 组件

```typescript
import type { ElementType, HeaderConfig, FooterConfig, SidebarConfig, ContentConfig } from '@openlayout/config';

interface HeaderProps extends Partial<HeaderConfig> {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
```

#### Footer 组件

```typescript
import type { FooterConfig } from '@openlayout/config';

interface FooterProps extends Partial<FooterConfig> {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
```

#### Sidebar 组件

```typescript
import type { SidebarConfig } from '@openlayout/config';

interface SidebarProps extends Partial<SidebarConfig> {
  onCollapsedChange?: (collapsed: boolean) => void;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
```

#### Content 组件

```typescript
import type { ContentConfig } from '@openlayout/config';

interface ContentProps extends Partial<ContentConfig> {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
```

### 2.3 Core 层 - 断点计算与样式生成

> **核心职责**：core 层处理所有与布局相关的**逻辑计算**和**样式生成**，框架层只负责渲染。
>
> **最佳实践参考**：
>
> - 断点检测使用 `window.matchMedia` API（参考 [use-breakpoint](https://www.npmjs.com/package/use-breakpoint)、[vue-mq](https://www.npmjs.com/package/vue-mq)、[Material UI useMediaQuery](https://mui.com/material-ui/react-use-media-query/)）
> - CSS 变量存储动态值，通过 JS 监听断点变化设置变量值
> - 布局状态使用框架原生响应式系统，无需引入复杂状态管理库

#### 2.3.1 断点检测 (createResponsive)

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
 * const { breakpoint, isMobile } = createResponsive({
 *   mobileBreakpoint: 768
 * });
 */
function createResponsive(options: MediaQueryOptions = {}): MediaQueryState {
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

> **核心原则**：使用 CSS 变量存储动态值，通过 JS 监听断点变化设置变量值，实现主题切换和响应式调整。
>
> **优势**：
>
> - 主题切换无需重新渲染组件
> - 减少 JavaScript 内存分配
> - 更好的性能（浏览器优化 CSS 变量）
> - 便于 CSS-in-JS 方案迁移

````typescript
// @openlayout/core - CSS 变量与样式对象生成
// 最佳实践: 使用 CSS 变量存储动态值，通过 JS 监听断点变化设置变量值

import type { LayoutConfig, CSSProperties } from '@openlayout/config';

interface LayoutStyles {
  root: CSSProperties;
  header: CSSProperties;
  footer: CSSProperties;
  sidebar: CSSProperties;
  content: CSSProperties;
  cssVariables: Partial<CSSProperties>;
}

interface StyleOptions {
  config: LayoutConfig;
  breakpoint: string;
  isMobile: boolean;
  collapsed?: boolean;
}

/**
 * 生成布局 CSS 变量
 *
 * @description
 * 生成供组件使用的 CSS 变量映射。这些变量应该注入到 Layout 根元素的 style 属性中。
 *
 * @param {StyleOptions} options - 样式生成选项
 * @returns {Record<string, string | number>} CSS 变量映射
 */
function createCSSVariables(options: StyleOptions): Record<string, string | number> {
  const { config, isMobile, collapsed = false } = options;
  const headerConfig = config.header ?? {};
  const footerConfig = config.footer ?? {};
  const sidebarConfig = config.sidebar ?? {};

  return {
    '--od-header-height': `${headerConfig.height ?? 64}px`,
    '--od-footer-height': `${footerConfig.height ?? 48}px`,
    '--od-sidebar-width': collapsed
      ? `${sidebarConfig.min ?? 80}px`
      : `${sidebarConfig.width ?? 200}px`,
    '--od-sidebar-min-width': `${sidebarConfig.min ?? 80}px`,
    '--od-animation-enabled': config.animation?.enabled !== false ? 1 : 0,
    '--od-animation-duration': `${config.animation?.duration ?? 200}ms`,
    '--od-animation-easing': config.animation?.easing ?? 'ease',
    '--od-breakpoint': options.breakpoint,
    '--od-is-mobile': isMobile ? 1 : 0,
  };
}

/**
 * 生成布局基础样式
 *
 * @description
 * 生成各区域的基础样式对象。样式中使用 CSS 变量引用动态值。
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

  const Z_INDEX = {
    HEADER_FIXED: 1000,
    FOOTER_FIXED: 1000,
    SIDEBAR_OVERLAY: 1001,
  };

  const cssVariables = createCSSVariables(options);

  const root: Record<string, string | number> = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    ...cssVariables,
  };

  const header: Record<string, string | number> = {
    flexShrink: 0,
    height: 'var(--od-header-height, 64px)',
    ...(headerConfig.fixed ? { position: 'fixed', top: 0, left: 0, right: 0, zIndex: Z_INDEX.HEADER_FIXED } : {}),
    ...(headerConfig.full ? { width: '100%' } : {}),
  };

  const footer: Record<string, string | number> = {
    flexShrink: 0,
    height: 'var(--od-footer-height, 48px)',
    ...(footerConfig.fixed ? { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: Z_INDEX.FOOTER_FIXED } : {}),
    ...(footerConfig.full ? { width: '100%' } : {}),
  };

  const sidebar: Record<string, string | number> = {
    flexShrink: 0,
    width: 'var(--od-sidebar-width, 200px)',
    transition: `width var(--od-animation-duration, 200ms) ease`,
    ...(sidebarConfig.full !== false ? { height: '100%' } : {}),
    ...(sidebarConfig.overlay || isMobile ? { position: 'fixed', zIndex: Z_INDEX.SIDEBAR_OVERLAY } : {}),
  };

  const content: Record<string, string | number> = {
    flex: 1,
    minWidth: 0,
    ...(contentConfig.scrollable !== false ? { overflow: 'auto' } : {}),
  };

  return { root, header, footer, sidebar, content, cssVariables };
}

#### 2.3.3 CSS 变量导出

> **设计说明**：core 层提供 CSS 变量导出功能，便于主题系统和外部样式表使用。

```typescript
// @openlayout/core - CSS 变量导出
import type { CSSProperties } from '@openlayout/config';

type LayoutSelector = 'layout' | 'header' | 'footer' | 'sidebar' | 'content';

interface CSSVariablesExport {
  variables: Partial<CSSProperties>;
  selectors: Record<LayoutSelector, string>;
}

/**
 * 导出 CSS 变量供主题系统使用
 *
 * @description
 * 生成可注入到全局样式表的 CSS 变量定义。
 * 支持自定义前缀（默认 'od'）和默认值。
 *
 * @param {string} [prefix='od'] - CSS 变量前缀
 * @returns {CSSVariablesExport} 变量和选择器映射
 */
function createCSSVariables(prefix: string = 'od'): CSSVariablesExport {
  const p = prefix ? `${prefix}-` : '';

  return {
    variables: {
      [`--${p}header-height`]: '64px',
      [`--${p}footer-height`]: '48px',
      [`--${p}sidebar-width`]: '200px',
      [`--${p}sidebar-collapsed-width`]: '80px',
      [`--${p}animation-enabled`]: '1',
      [`--${p}animation-duration`]: '200ms',
      [`--${p}animation-easing`]: 'ease',
    },
    selectors: {
      layout: `.${prefix}-layout`,
      header: `.${prefix}-layout-header`,
      footer: `.${prefix}-layout-footer`,
      sidebar: `.${prefix}-layout-sidebar`,
      content: `.${prefix}-layout-content`,
    },
  };
}

**使用示例 - 在全局样式表中定义**：

```css
/* global.css */
:root {
  /* 布局变量默认值 */
  --od-header-height: 64px;
  --od-footer-height: 48px;
  --od-sidebar-width: 200px;
  --od-sidebar-collapsed-width: 80px;
  --od-animation-enabled: 1;
  --od-animation-duration: 200ms;
  --od-animation-easing: ease;
}

/* 暗色主题 */
[data-theme="dark"] {
  --od-header-height: 60px;
  --od-footer-height: 44px;
  --od-sidebar-width: 180px;
}

/* 紧凑模式 */
.compact-mode {
  --od-header-height: 48px;
  --od-footer-height: 36px;
  --od-sidebar-width: 160px;
}
````

#### 2.3.4 布局状态管理 (createStore)

> **最佳实践**: 布局状态相对简单，使用框架原生响应式系统即可，无需引入 Vuex/Pinia 等复杂状态管理库。

````typescript
// @openlayout/core - 布局状态管理
// 最佳实践: 使用 Vue 原生响应式系统 (ref/reactive)

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
  // sidebar
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  // header
  toggleHeader: () => void;
  setHeaderVisible: (visible: boolean) => void;
  setHeaderFixed: (fixed: boolean) => void;
  // footer
  toggleFooter: () => void;
  setFooterVisible: (visible: boolean) => void;
  setFooterFixed: (fixed: boolean) => void;
}

interface LayoutStore {
  state: LayoutState;
  actions: LayoutActions;
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
 * @returns {LayoutStore} 包含 state 和 actions 的仓库对象
 */
function createStore(options: UseLayoutStateOptions = {}): LayoutStore {
  const sidebarCollapsed = options.sidebar?.collapsed ?? false;
  const sidebarVisible = true;

  return {
    state: {
      sidebar: { collapsed: sidebarCollapsed, visible: sidebarVisible, width: options.sidebar?.width ?? 200 },
      header: { visible: true, fixed: options.header?.fixed ?? false, height: options.header?.height ?? 64 },
      footer: { visible: true, fixed: options.footer?.fixed ?? false, height: options.footer?.height ?? 48 },
    },
    actions: {
      toggleSidebar: () => {},
      setSidebarCollapsed: () => {},
      toggleHeader: () => {},
      setHeaderVisible: () => {},
      setHeaderFixed: () => {},
      toggleFooter: () => {},
      setFooterVisible: () => {},
      setFooterFixed: () => {},
    },
  };
}

**设计说明**：

- 使用 `LayoutStore` 接口包装 `state` 和 `actions`，结构更清晰，避免交叉类型带来的类型推断问题
- 框架层通过 `store.state` 访问状态，通过 `store.actions` 访问操作方法
- 实际响应式逻辑由 Vue 适配层实现

### 2.4 Vue 层 - TSX 组件实现

> **渲染职责**：Vue 层使用 TSX 编写，负责将 core 层生成的样式应用到组件。
> **属性优先级**：组件 Props > Layout Config (Context) > Default
> **实现方式**：采用函数式组件（Functional Component）写法，直接在 `defineComponent` 中返回渲染函数。

```tsx
// @openlayout/vue - Layout.tsx

import { defineComponent, computed, provide, inject, ref, onMounted, onUnmounted, type StyleValue } from 'vue';
import { createResponsive, createStore, createStylesheet } from '@openlayout/core';
import type { LayoutProps, LayoutConfig, Breakpoint } from '@openlayout/config';
import { resolveConfig } from '@openlayout/config';

export const Layout = defineComponent((props: LayoutProps, { slots }) => {
  const config = computed<LayoutConfig>(() => resolveConfig(props));

  // Responsive State
  const responsiveHelper = createResponsive({ breakpoints: props.breakpoints });
  const breakpoint = ref<Breakpoint>(responsiveHelper.breakpoint);
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 0);
  const isMobile = computed(() => width.value < (props.mobileBreakpoint ?? 768));

  const updateResponsive = () => {
    const current = createResponsive({ breakpoints: props.breakpoints });
    if (current.breakpoint !== breakpoint.value) {
      breakpoint.value = current.breakpoint;
      props.onBreakpointChange?.(current.breakpoint, window.innerWidth);
    }
    width.value = window.innerWidth;
  };

  onMounted(() => {
    window.addEventListener('resize', updateResponsive);
    updateResponsive();
  });

  onUnmounted(() => {
    window.removeEventListener('resize', updateResponsive);
  });

  // Layout State
  const store = createStore(config.value);
  const layoutState = store.state;

  // Actions - 扁平化设计
  const actions = {
    toggleSidebar: () => { layoutState.sidebar.collapsed = !layoutState.sidebar.collapsed; },
    setSidebarCollapsed: (v: boolean) => { layoutState.sidebar.collapsed = v; },
    toggleHeader: () => { layoutState.header.visible = !layoutState.header.visible; },
    setHeaderVisible: (v: boolean) => { layoutState.header.visible = v; },
    setHeaderFixed: (v: boolean) => { layoutState.header.fixed = v; },
    toggleFooter: () => { layoutState.footer.visible = !layoutState.footer.visible; },
    setFooterVisible: (v: boolean) => { layoutState.footer.visible = v; },
    setFooterFixed: (v: boolean) => { layoutState.footer.fixed = v; },
  };

  // Styles
  const styles = computed(() => createStylesheet({
    config: config.value,
    breakpoint: breakpoint.value,
    isMobile: isMobile.value,
    collapsed: layoutState.sidebar.collapsed,
  }));

  provide('layoutConfig', config);
  provide('layoutState', layoutState);
  provide('layoutActions', actions);
  provide('layoutStyles', styles);
  provide('layoutResponsive', { breakpoint, width, isMobile });

  return () => (
    <div class={`od-layout ${props.className ?? ''}`} style={{ ...styles.value.root, ...props.style } as StyleValue}>
      {slots.default?.()}
    </div>
  );
});
````

```tsx
// @openlayout/vue - Header.tsx

import { defineComponent, inject, computed, type ComputedRef, type StyleValue } from 'vue';
import type { HeaderProps } from '@openlayout/config';
import type { LayoutStyles } from '@openlayout/core';

export const Header = defineComponent((props: HeaderProps, { slots }) => {
  const layoutStyles = inject<ComputedRef<LayoutStyles>>('layoutStyles');
  const layoutState = inject<{ header: { visible: boolean } }>('layoutState');

  const mergedStyle = computed<StyleValue>(() => ({
    ...(layoutStyles?.value?.header ?? {}),
    ...(props.height !== undefined ? { '--custom-header-height': `${props.height}px` } : {}),
    ...(props.fixed !== undefined ? { position: props.fixed ? 'fixed' : 'relative' } : {}),
    ...(props.style as Record<string, string | number>),
  }));

  const classNames = computed(() => [
    'od-layout-header',
    props.className,
    { 'od-layout-header--fixed': props.fixed },
    { 'od-layout-header--full': props.full },
  ]);

  return () => {
    if (layoutState?.header.visible === false) return null;
    return (
      <header class={classNames.value} style={mergedStyle.value}>
        {slots.default?.()}
      </header>
    );
  };
});
```

```tsx
// @openlayout/vue - Sidebar.tsx

import { defineComponent, inject, computed, type ComputedRef, type StyleValue } from 'vue';
import type { SidebarProps } from '@openlayout/config';
import type { LayoutStyles } from '@openlayout/core';

export const Sidebar = defineComponent((props: SidebarProps, { slots }) => {
  const layoutStyles = inject<ComputedRef<LayoutStyles>>('layoutStyles');
  const layoutState = inject<{ sidebar: { collapsed: boolean } }>('layoutState');

  const mergedStyle = computed<StyleValue>(() => {
    const isCollapsed = props.collapsed ?? layoutState?.sidebar.collapsed ?? false;
    const cssVars = layoutStyles?.value?.cssVariables ?? {};

    return {
      ...(layoutStyles?.value?.sidebar ?? {}),
      ...(props.width !== undefined || props.min !== undefined
        ? {
            '--custom-sidebar-width': isCollapsed
              ? `${props.min ?? 80}px`
              : `${props.width ?? 200}px`,
          }
        : {}),
      ...(props.style as Record<string, string | number>),
    };
  });

  const classNames = computed(() => [
    'od-layout-sidebar',
    props.className,
    { 'od-layout-sidebar--collapsed': props.collapsed ?? layoutState?.sidebar.collapsed },
    { 'od-layout-sidebar--full': props.full },
    { 'od-layout-sidebar--overlay': props.overlay },
  ]);

  return () => (
    <aside class={classNames.value} style={mergedStyle.value}>
      {slots.default?.()}
    </aside>
  );
});
```

**Vue 函数式组件优势**：

- 直接使用 TypeScript 接口定义 props，无需手动编写运行时 props 定义
- 代码更简洁，减少样板代码
- 利用 Vue 3 的类型推断，确保类型安全

### 2.5 Hooks API 设计

采用**按组件分组**的设计，简洁直观：

```typescript
// 从 @openlayout/vue 导入
import { useLayout, useSidebar, useHeader, useFooter, useContent } from '@openlayout/vue';

// 响应式信息（断点、方向等）
const { breakpoint, width, isMobile } = useLayout();

// Sidebar 状态与方法
const { collapsed, width, min, toggle, setCollapsed } = useSidebar();

// Header 状态与方法  
const { visible, height, fixed, setVisible, setFixed } = useHeader();

// Footer 状态与方法
const { visible, height, fixed, setVisible, setFixed } = useFooter();

// Content 状态与方法
const { visible, scrollable } = useContent();
```

**Hooks 设计说明**：

- `useLayout`: 全局响应式信息（断点、窗口尺寸等）
- `useSidebar`: 侧边栏状态和方法
- `useHeader`: 头部状态和方法
- `useFooter`: 底部状态和方法
- `useContent`: 内容区域状态和方法
- 每个 Hook 只关注自己的组件，职责清晰

***

## 3. 包结构设计

### 3.1 目录结构

```
packages/components/layout/
├── core/          # @openlayout/core - 逻辑与样式层
│   ├── src/
│   │   ├── index.ts
│   │   ├── createResponsive.ts   # 断点检测
│   │   ├── createStylesheet.ts   # 样式生成
│   │   └── createStore.ts        # 状态管理
│   ├── package.json
│   └── tsconfig.json
│
├── config/        # @openlayout/config - 配置和类型
│   ├── src/
│   │   ├── index.ts
│   │   ├── types.ts             # 基础类型
│   │   ├── layout.ts            # Layout 配置
│   │   ├── header.ts            # Header 配置
│   │   ├── footer.ts            # Footer 配置
│   │   ├── sidebar.ts           # Sidebar 配置
│   │   ├── content.ts           # Content 配置
│   │   ├── animation.ts         # 动画配置
│   │   ├── constants.ts         # 默认常量
│   │   └── resolveConfig.ts     # 配置解析
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
│   └── tsconfig.json
```

### 3.2 严格类型配置

所有子包必须继承 `@opendesign/tsconfig` 提供的严格配置。

**tsconfig.json（各子包通用）**:

```json
{
  "extends": [
    "@opendesign/tsconfig/lib",
    "@opendesign/tsconfig/vue"
  ],
  "compilerOptions": {
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

### 3.3 包依赖关系

```
┌─────────────────────────────────────┐
│               vue                   │
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

| 目录     | 包名                 | 说明             |
| ------ | ------------------ | -------------- |
| core   | @openlayout/core   | 断点计算、样式生成、状态管理 |
| config | @openlayout/config | 类型定义和常量        |
| vue    | @openlayout/vue    | Vue3 组件库   |

### 3.5 职责分工

**core 层（逻辑与样式）**：

- 断点计算 (`createResponsive`)
- 样式生成 (`createStylesheet`)
- 状态管理 (`createStore`)
- 无 DOM 依赖，纯业务逻辑

**框架渲染层（vue）**：

- 使用 TSX 编写组件
- 调用 core 层 API
- 处理 DOM 事件
- 处理主题切换

```
┌────────────────────────────────────────────────────────────┐
│                         vue                                 │
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
  /** 横屏断点配置 */
  orientationBreakpoints?: {
    portrait?: Breakpoints;
    landscape?: Breakpoints;
  };
  /** 折叠屏支持 */
  foldBreakpoints?: {
    folded?: number;
    unfolded?: number;
  };
}
```

***

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
    min: 80,
    collapsible: true,
  }}
  content={{
    scrollable: true,
  }}
  animation={{
    enabled: true,
    duration: 200,
    easing: 'ease',
  }}
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
<Layout animation={{ enabled: true, duration: 200 }}>
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
  // 按组件使用对应的 Hook
  const { collapsed, toggle, setCollapsed } = useSidebar();
  const { fixed, setFixed } = useHeader();

  return (
    <Layout>
      <Header>
        <button onClick={toggle}>切换侧边栏</button>
        <button onClick={() => setFixed(!fixed)}>
          {fixed ? '取消固定' : '固定头部'}
        </button>
      </Header>
      <Sidebar>
        <button onClick={() => setCollapsed(true)}>折叠</button>
        <span>状态: {collapsed ? '已折叠' : '已展开'}</span>
      </Sidebar>
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

***

## 5. API 字段参考

### Layout 根容器

#### 对象式配置

```typescript
// header 配置
header: {
  enabled?: boolean;     // 默认 true
  height?: number;        // 默认 64
  fixed?: boolean;       // 默认 false
  full?: boolean;        // 默认 false
}

// footer 配置
footer: {
  enabled?: boolean;     // 默认 true
  height?: number;        // 默认 48
  fixed?: boolean;       // 默认 false
  full?: boolean;        // 默认 false
}

// sidebar 配置
sidebar: {
  enabled?: boolean;       // 默认 true
  width?: number;          // 默认 200
  min?: number;           // 默认 80
  collapsible?: boolean;   // 默认 false
  collapsed?: boolean;    // 默认 false
  full?: boolean;         // 默认 true
  overlay?: boolean;      // 默认 false
}

// content 配置
content: {
  enabled?: boolean;      // 默认 true
  scrollable?: boolean;   // 默认 true
}
```

#### 全局配置

| 字段                 | 类型                   | 默认值   | 说明               |
| ------------------ | -------------------- | ----- | ---------------- |
| breakpoints        | Breakpoints          | 见下方   | 响应式断点配置          |
| mobileBreakpoint   | number               | 768   | 移动端断点（小于此值视为移动端） |
| onBreakpointChange | (breakpoint) => void | -     | 断点变化回调           |
| animation          | AnimationConfig      | 见下方   | 动画配置对象           |
| direction          | 'ltr' \| 'rtl'       | 'ltr' | 文本方向（支持 RTL 语言）  |
| initialState       | object               | -     | Hydration 前的初始状态 |

**AnimationConfig 默认值**：

```typescript
{
  enabled: true,
  duration: 200,
  easing: 'ease',
}
```

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

| 字段                | 类型                  | 默认值   | 说明       |
| ----------------- | ------------------- | ----- | -------- |
| enabled           | boolean             | true  | 是否启用/显示  |
| collapsible       | boolean             | false | 是否可折叠    |
| collapsed         | boolean             | -     | 折叠状态（受控） |
| onCollapsedChange | (collapsed) => void | -     | 变化回调     |
| full              | boolean             | true  | 撑满上下     |
| overlay           | boolean             | false | 遮罩层模式    |
| width             | number              | 200   | 宽度       |
| min               | number              | 80    | 折叠后宽度    |

### Header/Footer（独立 Props）

| 字段      | 类型      | 默认值   | 说明      |
| ------- | ------- | ----- | ------- |
| enabled | boolean | true  | 是否启用/显示 |
| fixed   | boolean | false | 固定定位    |
| full    | boolean | false | 撑满左右    |
| height  | number  | 64/48 | 高度      |

### Content（独立 Props）

| 字段         | 类型      | 默认值  | 说明      |
| ---------- | ------- | ---- | ------- |
| enabled    | boolean | true | 是否启用/显示 |
| scrollable | boolean | true | 是否可滚动   |

***

## 6. 响应式断点设计

### 6.1 默认断点值

| 断点  | 宽度       | 设备类型 |
| --- | -------- | ---- |
| xs  | < 480px  | 超小手机 |
| sm  | ≥ 480px  | 大手机  |
| md  | ≥ 768px  | 平板   |
| lg  | ≥ 992px  | 小笔记本 |
| xl  | ≥ 1200px | 桌面   |
| xxl | ≥ 1400px | 大桌面  |

### 6.2 断点变化行为

| 特性         | xs/sm (手机) | md (平板) | lg/xl/xxl (桌面) |
| ---------- | ---------- | ------- | -------------- |
| Sidebar    | 默认隐藏       | 可配置     | 默认显示           |
| Sidebar 模式 | 遮罩层        | 遮罩层/嵌入  | 嵌入页面           |
| Header     | 固定显示       | 固定显示    | 固定显示           |
| Content    | 全宽         | 全宽/留白   | 正常宽度           |
| 折叠         | 自动折叠       | 可配置     | 默认展开           |

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

***

## 7. 参考资料

- [Ant Design Vue Layout](https://antdv.com/components/layout)

***

## 8. 性能考虑

### 8.1 渲染优化策略

| 优化策略          | 说明               | 适用场景                |
| ------------- | ---------------- | ------------------- |
| `useMemo`     | 缓存复杂计算结果         | 响应式样式计算、断点判断        |
| CSS 变量        | 减少 JS 内存分配，浏览器优化 | 主题切换、响应式调整          |

### 8.2 CSS 变量 vs 内联样式

**推荐优先级**：

1. **CSS 类 + CSS 变量** - 最佳性能，用于静态样式
2. **CSS 变量引用** - 用于动态值（如 `height: var(--od-header-height)`）
3. **内联样式** - 仅用于组件特定的一次性覆盖

```typescript
// ✅ 推荐：使用 CSS 变量
const headerStyle = {
  height: 'var(--od-header-height, 64px)',
};

// ❌ 避免：纯内联样式
const headerStyle = {
  height: '64px',
};
```

### 8.3 包体积优化

| 优化手段         | 说明                                                     |
| ------------ | ------------------------------------------------------ |
| Tree-shaking | core 层使用纯函数，确保未使用代码可被剔除                                |
| 按需导入         | 用户只导入使用的组件（`import { Layout } from '@openlayout/vue'`） |

### 8.4 事件监听优化

```typescript
// 使用防抖处理 resize 事件
import { useDebouncedCallback } from 'use-debounce';

const updateResponsive = useDebouncedCallback(() => {
  // 更新响应式状态
}, 150);
```

### 8.5 内存管理

- 组件卸载时移除所有事件监听（`addEventListener` → `removeEventListener`）
- 避免在 `useEffect` 中创建闭包导致的内存泄漏
- 定期清理 `setTimeout`/`setInterval`

***

## 9. 测试策略

### 9.1 测试框架

| 层级              | 工具                        | 说明                  |
| --------------- | ------------------------- | ------------------- |
| 单元测试            | Vitest                    | core 层纯函数测试         |
| 组件测试            | Vitest + @testing-library/vue | 组件渲染和交互测试（自动化） |
| E2E 测试          | Playwright                | 完整流程测试、多设备响应式       |
| 无障碍测试           | axe-core                  | WCAG 合规性            |

### 9.2 测试范围

- **单元测试**：断点计算、样式生成、状态管理、类型正确性
- **组件测试**：渲染正确性、Props 传递、事件触发、响应式断点、组件状态
- **Storybook 测试**：组件交互、视觉回归、Controls 面板
- **E2E 测试**：完整用户流程、多设备响应式、无障碍性、CSS 变量应用
- **性能测试**：渲染时间、响应速度

### 9.3 测试文件结构

```
packages/components/layout/
├── core/                              # Core 层
│   └── src/
│       └── __tests__/
│           └── index.test.ts          # 断点计算、样式生成、状态管理测试
│
├── config/                            # Config 层 (无测试)
│
├── vue/                               # Vue 层
│   └── src/
│       ├── __tests__/
│       │   └── components.test.ts    # 组件渲染、Props、Hooks 测试
│       ├── stories/
│       │   ├── Layout.stories.tsx    # Storybook 故事
│       │   └── Layout.stories.test.ts # Storybook 交互测试
│       └── e2e/
│           └── layout.spec.ts         # Playwright E2E 测试
```

### 9.4 Core 层单元测试

核心函数测试覆盖：

- `createResponsive`: 断点检测、SSR 支持、边界情况处理
- `getMediaQueries`: 媒体查询生成、自定义媒体类型
- `createStylesheet`: 根容器/Header/Footer/Sidebar/Content 样式生成、CSS 变量、动画配置、Z-Index 管理
- `createStore`: 默认状态、自定义初始值、Actions

### 9.5 Vue 组件测试

组件测试覆盖：

- 模块导出测试
- Props 定义和默认值测试
- 渲染测试（根元素、子元素）
- 样式类名测试（fixed、full、collapsed、overlay）
- 响应式行为测试（mobileBreakpoint、breakpoints）
- 动画配置测试
- 断点变化回调测试

### 9.6 Storybook UI 测试

使用 `@storybook/test` 进行交互测试：

- 故事渲染验证
- 组件可见性测试
- CSS 类名状态测试
- 交互行为测试

### 9.7 E2E 测试

Playwright 测试覆盖：

- **基础渲染测试**：Layout、Header、Sidebar、Content、Footer
- **组件状态测试**：Sidebar 折叠、Header 固定定位、可选组件显示/隐藏
- **响应式测试**：移动端、平板、桌面、多断点切换
- **无障碍测试**：语义化 HTML、键盘导航
- **CSS 变量测试**：Header 高度、Sidebar 宽度、动画变量
- **性能测试**：渲染时间

### 9.8 测试运行命令

```bash
# Core 层单元测试
cd packages/components/layout/core
npm run test

# Vue 层测试
cd packages/components/layout/vue
npm run test          # 单元测试
npm run test:storybook # Storybook 测试
npm run test:e2e     # E2E 测试

# 运行所有测试
cd packages/components/layout
npm run test:all
```

### 9.9 测试最佳实践

1. **Mock 依赖**：core 层使用 Vitest mock，避免实际 DOM 操作
2. **隔离测试**：每个组件独立测试，避免相互依赖
3. **真实场景**：E2E 测试使用真实浏览器，确保与用户行为一致
4. **响应式测试**：覆盖多种视口尺寸，确保响应式正确性
5. **无障碍优先**：使用语义化标签，支持屏幕阅读器和键盘导航

***

## 10. SSR 支持

### 10.1 服务端渲染配置

```vue
<!-- nextjs-app/app/layout.vue -->
<script setup lang="ts">
import { Layout, Header, Sidebar, Content, Footer } from '@openlayout/vue';
</script>

<template>
  <Layout :initialState="{ collapsed: false }">
    <Header>我的应用</Header>
    <Sidebar>导航</Sidebar>
    <Content><slot /></Content>
    <Footer>© 2026</Footer>
  </Layout>
</template>
```

### 10.2 Hydration 对比

| 阶段   | 服务端       | 客户端  |
| ---- | --------- | ---- |
| HTML | 完整渲染      | 完整渲染 |
| 断点   | 默认值 (xxl) | 实际检测 |
| 交互   | 不可用       | 可用   |

***

## 11. 重构方案 - 基于开源最佳实践

### 11.1 设计理念对齐

参考 SoybeanAdmin 等成熟开源项目的架构设计，结合现有方案进行如下优化：

| 维度    | 现有方案          | 重构后方案                      | 参考来源         |
| ----- | ------------- | -------------------------- | ------------ |
| 状态管理  | 框架原生响应式系统     | Pinia                      | SoybeanAdmin |
| 样式方案  | CSS 变量 + 内联样式 | UnoCSS 原子化样式 + CSS 变量      | SoybeanAdmin |
| 项目架构  | 单一配置包         | pnpm monorepo 多包           | SoybeanAdmin |
| 路由集成  | 独立使用          | 布局与路由深度集成 (Elegant Router) | SoybeanAdmin |
| 主题系统  | CSS 变量手动配置    | UnoCSS 主题系统 + 内置明暗主题       | SoybeanAdmin |
| 国际化   | 无             | 内置 i18n 支持                 | SoybeanAdmin |
| 移动端适配 | 基础响应式         | 完整移动端适配 + 触摸优化             | SoybeanAdmin |

### 11.2 状态管理重构 - 引入 Pinia

> **核心理念**：参考 SoybeanAdmin 的状态管理方案，将布局状态从组件内部提升到全局 store 层面，支持多组件共享和持久化。

```typescript
// @openlayout/stores - layout store
// 参考: SoybeanAdmin Pinia store 设计

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { LayoutConfig, SidebarConfig, HeaderConfig, FooterConfig } from '@openlayout/config';

export const useLayoutStore = defineStore('layout', () => {
  // ============ State ============
  const config = ref<LayoutConfig>({
    header: { enabled: true, height: 64, fixed: false, full: false },
    footer: { enabled: true, height: 48, fixed: false, full: false },
    sidebar: { enabled: true, width: 200, min: 80, collapsible: true, collapsed: false, full: true, overlay: false },
    content: { enabled: true, scrollable: true },
    animation: { enabled: true, duration: 200, easing: 'ease' },
    breakpoints: { xs: 480, sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1400 },
    mobileBreakpoint: 768,
  });

  const breakpoint = ref<string>('xxl');
  const isMobile = ref(false);
  const isTablet = ref(false);
  const isDesktop = ref(true);
  const isDark = ref(false);
  const isCollapsed = ref(false);
  const isFixed = ref(false);
  const mobileOpened = ref(false);

  // ============ Getters ============
  const headerHeight = computed(() => config.value.header?.height ?? 64);
  const footerHeight = computed(() => config.value.footer?.height ?? 48);
  const sidebarWidth = computed(() => isCollapsed.value
    ? (config.value.sidebar?.min ?? 80)
    : (config.value.sidebar?.width ?? 200)
  );

  const layoutClassName = computed(() => [
    'od-layout',
    {
      'od-layout--mobile': isMobile.value,
      'od-layout--tablet': isTablet.value,
      'od-layout--desktop': isDesktop.value,
      'od-layout--dark': isDark.value,
      'od-layout--collapsed': isCollapsed.value,
      'od-layout--fixed': isFixed.value,
      'od-layout--mobile-opened': mobileOpened.value,
    }
  ]);

  // ============ Actions ============
  function setConfig(newConfig: Partial<LayoutConfig>) {
    config.value = { ...config.value, ...newConfig };
  }

  function toggleSidebar() {
    if (isMobile.value) {
      mobileOpened.value = !mobileOpened.value;
    } else {
      isCollapsed.value = !isCollapsed.value;
    }
  }

  function setCollapsed(collapsed: boolean) {
    isCollapsed.value = collapsed;
  }

  function toggleMobile() {
    mobileOpened.value = !mobileOpened.value;
  }

  function closeMobile() {
    mobileOpened.value = false;
  }

  function setBreakpoint(bp: string) {
    breakpoint.value = bp;
  }

  function setMobile(mobile: boolean) {
    isMobile.value = mobile;
  }

  function setTablet(tablet: boolean) {
    isTablet.value = tablet;
  }

  function setDesktop(desktop: boolean) {
    isDesktop.value = desktop;
  }

  function toggleDark() {
    isDark.value = !isDark.value;
    if (import.meta.env.client) {
      document.documentElement.classList.toggle('dark', isDark.value);
    }
  }

  function toggleFixed() {
    isFixed.value = !isFixed.value;
  }

  return {
    // State
    config,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isDark,
    isCollapsed,
    isFixed,
    mobileOpened,
    // Getters
    headerHeight,
    footerHeight,
    sidebarWidth,
    layoutClassName,
    // Actions
    setConfig,
    toggleSidebar,
    setCollapsed,
    toggleMobile,
    closeMobile,
    setBreakpoint,
    setMobile,
    setTablet,
    setDesktop,
    toggleDark,
    toggleFixed,
  };
});
```

**设计说明**：

- 使用 Pinia 的 Setup Store 写法，代码更简洁
- 状态分组清晰：配置、响应式状态、交互状态
- 计算属性用于派生状态，避免重复计算
- 支持 SSR 安全的客户端检测 (`import.meta.env.client`)

### 11.3 样式系统重构 - 引入 UnoCSS

> **核心理念**：参考 SoybeanAdmin 的 UnoCSS 集成方案，使用原子化 CSS 减少包体积，配合 CSS 变量实现主题切换。

```typescript
// @openlayout/core - UnoCSS preset 配置
// 参考: SoybeanAdmin UnoCSS preset 设计

import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss';

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      cdn: 'https://esm.sh/',
    }),
  ],
  theme: {
    colors: {
      primary: {
        DEFAULT: '#18a058',
        light: '#36b076',
        dark: '#0f7a45',
      },
    },
    layout: {
      headerHeight: '64px',
      footerHeight: '48px',
      sidebarWidth: '200px',
      sidebarCollapsedWidth: '80px',
    },
  },
  shortcuts: {
    'layout-base': 'flex flex-col min-h-screen',
    'layout-header': 'h-[--layout-header-height] flex-shrink-0',
    'layout-footer': 'h-[--layout-footer-height] flex-shrink-0',
    'layout-sidebar': 'w-[--layout-sidebar-width] flex-shrink-0 transition-all duration-200',
    'layout-content': 'flex-1 min-w-0 overflow-auto',
    'layout-fixed': 'fixed top-0 left-0 right-0 z-1000',
    'layout-overlay': 'fixed top-0 left-0 bottom-0 z-1001',
  },
  variables: {
    '--layout-header-height': '64px',
    '--layout-footer-height': '48px',
    '--layout-sidebar-width': '200px',
    '--layout-sidebar-collapsed-width': '80px',
    '--layout-transition': 'all 0.2s ease',
  },
});
```

**Vue 组件示例**：

```vue
<!-- @openlayout/vue - Layout.vue -->
<script setup lang="ts">
import { useLayoutStore } from '@openlayout/stores';
import { storeToRefs } from 'pinia';

const layoutStore = useLayoutStore();
const { layoutClassName, config } = storeToRefs(layoutStore);
</script>

<template>
  <div :class="layoutClassName" v-bind="$attrs">
    <!-- Header -->
    <layout-header
      v-if="config.header?.enabled !== false"
      :fixed="config.header?.fixed"
      :full="config.header?.full"
    >
      <slot name="header" />
    </layout-header>

    <!-- Main Content Area -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <layout-sidebar
        v-if="config.sidebar?.enabled !== false"
        :collapsed="layoutStore.isCollapsed"
        :overlay="config.sidebar?.overlay || layoutStore.isMobile"
        :width="config.sidebar?.width"
        :min="config.sidebar?.min"
      >
        <slot name="sidebar" />
      </layout-sidebar>

      <!-- Content -->
      <layout-content v-if="config.content?.enabled !== false">
        <slot />
      </layout-content>
    </div>

    <!-- Footer -->
    <layout-footer
      v-if="config.footer?.enabled !== false"
      :fixed="config.footer?.fixed"
      :full="config.footer?.full"
    >
      <slot name="footer" />
    </layout-footer>
  </div>
</template>
```

### 11.4 路由集成 - 布局自动切换

> **核心理念**：参考 SoybeanAdmin 的 Elegant Router 方案，实现布局与路由的深度集成。

```typescript
// @openlayout/core - 布局路由配置

import type { RouteRecordRaw } from 'vue-router';

interface LayoutRouteMeta {
  layout?: 'default' | 'blank' | 'auth' | 'dashboard';
  requiresAuth?: boolean;
  roles?: string[];
  title?: string;
  icon?: string;
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@openlayout/vue/Layout.vue'),
    meta: { layout: 'default' },
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/HomeView.vue'),
        meta: { title: '首页', icon: 'mdi:home' },
      },
    ],
  },
  {
    path: '/auth',
    component: () => import('@openlayout/vue/Layout.vue'),
    meta: { layout: 'auth' },
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { title: '登录' },
      },
    ],
  },
];

export { routes };
```

### 11.5 主题系统重构

> **核心理念**：参考 SoybeanAdmin 的主题配置系统，支持明暗主题切换、主题色配置、紧凑模式等。

```typescript
// @openlayout/stores - theme store

import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export type ThemeScheme = 'light' | 'dark' | 'auto';
export type LayoutMode = 'vertical' | 'horizontal' | 'vertical-mixed';
export type ColorPreset = 'default' | 'green' | 'blue' | 'purple' | 'orange' | 'red';

export const useThemeStore = defineStore('theme', () => {
  const scheme = ref<ThemeScheme>('light');
  const layoutMode = ref<LayoutMode>('vertical');
  const colorPreset = ref<ColorPreset>('default');
  const compact = ref(false);
  const radius = ref(6);

  // 预设颜色
  const colorPresets: Record<ColorPreset, string[]> = {
    default: ['#18a058', '#36b076', '#0f7a45'],
    green: ['#00947e', '#00b377', '#00725e'],
    blue: ['#2080f0', '#4098fc', '#1060d0'],
    purple: ['#9c27b0', '#ba68c8', '#7b1fa2'],
    orange: ['#f57c00', '#ff9800', '#e65100'],
    red: ['#d32f2f', '#ef5350', '#c62828'],
  };

  function setScheme(scheme: ThemeScheme) {
    this.scheme = scheme;
    applyScheme();
  }

  function applyScheme() {
    if (!import.meta.env.client) return;

    const isDark = scheme.value === 'dark' ||
      (scheme.value === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }

  function setColorPreset(preset: ColorPreset) {
    this.colorPreset = preset;
    applyColor();
  }

  function applyColor() {
    const colors = colorPresets[this.colorPreset];
    const root = document.documentElement;
    root.style.setProperty('--od-primary', colors[0]);
    root.style.setProperty('--od-primary-light', colors[1]);
    root.style.setProperty('--od-primary-dark', colors[2]);
  }

  function toggleCompact() {
    this.compact = !this.compact;
    document.documentElement.classList.toggle('compact', this.compact);
  }

  function setRadius(radius: number) {
    this.radius = radius;
    document.documentElement.style.setProperty('--od-radius', `${radius}px`);
  }

  // 监听系统主题变化
  if (import.meta.env.client) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (scheme.value === 'auto') applyScheme();
    });
  }

  return {
    scheme,
    layoutMode,
    colorPreset,
    compact,
    radius,
    colorPresets,
    setScheme,
    setColorPreset,
    toggleCompact,
    setRadius,
  };
});
```

### 11.6 国际化支持

> **核心理念**：参考 SoybeanAdmin 的国际化方案，内置多语言支持。

```typescript
// @openlayout/i18n - 国际化配置

import { createI18n } from 'vue-i18n';
import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';

export const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
});

// layout 相关翻译
export const layoutMessages = {
  'zh-CN': {
    layout: {
      toggleSidebar: '切换侧边栏',
      collapse: '折叠',
      expand: '展开',
      fixed: '固定',
      notFixed: '不固定',
      theme: '主题',
      light: '浅色',
      dark: '深色',
      auto: '跟随系统',
    },
  },
  'en-US': {
    layout: {
      toggleSidebar: 'Toggle Sidebar',
      collapse: 'Collapse',
      expand: 'Expand',
      fixed: 'Fixed',
      notFixed: 'Not Fixed',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      auto: 'Auto',
    },
  },
};
```

### 11.7 移动端交互优化

> **核心理念**：参考 SoybeanAdmin 的移动端适配方案，提供完整的触摸交互支持。

```typescript
// @openlayout/composables - useTouch 移动端交互

import { ref, onMounted, onUnmounted } from 'vue';

interface TouchOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export function useTouch(options: TouchOptions = {}) {
  const { onSwipeLeft, onSwipeRight, threshold = 50 } = options;

  const startX = ref(0);
  const startY = ref(0);
  const currentX = ref(0);
  const currentY = ref(0);
  const isSwiping = ref(false);

  function handleTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    startX.value = touch.clientX;
    startY.value = touch.clientY;
    currentX.value = touch.clientX;
    currentY.value = touch.clientY;
    isSwiping.value = true;
  }

  function handleTouchMove(e: TouchEvent) {
    if (!isSwiping.value) return;

    const touch = e.touches[0];
    currentX.value = touch.clientX;
    currentY.value = touch.clientY;
  }

  function handleTouchEnd() {
    if (!isSwiping.value) return;

    const deltaX = currentX.value - startX.value;
    const deltaY = currentY.value - startY.value;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    isSwiping.value = false;
  }

  onMounted(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
  });

  onUnmounted(() => {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  });

  return {
    startX,
    startY,
    currentX,
    currentY,
    isSwiping,
  };
}
```

### 11.8 重构后的包结构

```
packages/components/layout/
├── .vscode/
│   └── settings.json
│
├── core/                    # @openlayout/core - 逻辑与样式层
│   ├── src/
│   │   ├── index.ts
│   │   ├── createResponsive.ts
│   │   ├── createStylesheet.ts
│   │   └── utils.ts
│   ├── package.json
│   └── tsconfig.json
│
├── config/                  # @openlayout/config - 配置和类型
│   ├── src/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── layout.ts
│   │   └── constants.ts
│   ├── package.json
│   └── tsconfig.json
│
├── stores/                  # @openlayout/stores - 状态管理 (新增)
│   ├── src/
│   │   ├── index.ts
│   │   ├── layout.ts       # 布局状态
│   │   └── theme.ts        # 主题状态
│   ├── package.json
│   └── tsconfig.json
│
├── composables/             # @openlayout/composables - 组合式函数 (新增)
│   ├── src/
│   │   ├── index.ts
│   │   ├── useTouch.ts     # 触摸交互
│   │   ├── useBreakpoint.ts # 断点响应
│   │   └── useSidebar.ts   # 侧边栏状态
│   ├── package.json
│   └── tsconfig.json
│
├── i18n/                    # @openlayout/i18n - 国际化 (新增)
│   ├── src/
│   │   ├── index.ts
│   │   ├── locales/
│   │   │   ├── zh-CN.ts
│   │   │   └── en-US.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── preset/                  # @openlayout/preset - UnoCSS 预设 (新增)
│   ├── src/
│   │   ├── index.ts
│   │   ├── rules.ts
│   │   └── shortcuts.ts
│   ├── package.json
│   └── tsconfig.json
│
├── vue/                     # @openlayout/vue - Vue3 实现
│   ├── src/
│   │   ├── index.ts
│   │   ├── Layout.vue
│   │   ├── Header.vue
│   │   ├── Footer.vue
│   │   ├── Sidebar.vue
│   │   ├── Content.vue
│   │   └── components/     # 内部组件
│   ├── package.json
│   └── tsconfig.json
│
└── package.json             # 根 workspace 配置
```

### 11.9 重构优先级

| 阶段      | 任务                   | 优先级 | 说明          |
| ------- | -------------------- | --- | ----------- |
| Phase 1 | 状态管理重构 (Pinia Store) | P0  | 核心功能，影响后续开发 |
| Phase 1 | 样式系统重构 (UnoCSS 集成)   | P0  | 性能优化，减少包体积  |
| Phase 2 | 主题系统 (明暗主题、主题色)      | P1  | 提升用户体验      |
| Phase 2 | 路由集成 (布局自动切换)        | P1  | 开发效率提升      |
| Phase 3 | 国际化支持 (i18n)         | P2  | 扩展功能        |
| Phase 3 | 移动端优化 (触摸交互)         | P2  | 移动端适配完善     |
| Phase 4 | 组件增强 (标签页、面包屑、权限)    | P3  | Admin 常用功能  |

### 11.10 迁移路径

```typescript
// 旧版 API (兼容)
import { Layout, Header, Sidebar, useLayout } from '@openlayout/vue';

// 新版 API (推荐)
import {
  Layout,
  Header,
  Sidebar,
  useLayoutStore,    // Pinia store
  useThemeStore,    // 主题 store
  useBreakpoint,    // 响应式 hook
} from '@openlayout/vue';

// 组合式兼容层
import { useLayout } from '@openlayout/vue';

// useLayout 内部已迁移到 Pinia
function useLayout() {
  const layoutStore = useLayoutStore();
  const themeStore = useThemeStore();

  return {
    // 兼容旧版 API
    collapsed: layoutStore.isCollapsed,
    toggleSidebar: layoutStore.toggleSidebar,
    // 新增功能
    isMobile: layoutStore.isMobile,
    isDark: themeStore.isDark,
    toggleDark: themeStore.toggleDark,
  };
}
```

### 11.11 参考资料

- [SoybeanAdmin](https://github.com/soybeanjs/soybean-admin) - Vue3 Admin 模板标杆
- [Pinia](https://pinia.vuejs.org/) - Vue 官方推荐状态管理
- [UnoCSS](https://unocss.dev/) - 原子化 CSS 引擎
- [Elegant Router](https://github.com/soybeanjs/elegant-router) - 自动化文件路由
- [VueUse](https://vueuse.org/) - Vue 组合式工具库

