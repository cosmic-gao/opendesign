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

| 层级       | 职责                     |
| -------- | ---------------------- |
| **core** | 断点计算、响应式样式生成、布局状态管理    |
| **vue**  | 组件渲染、DOM 事件绑定、框架特定 API |

### 2.2 组件 Props 设计

#### Layout 根容器

```typescript
import type { Breakpoint, Breakpoints } from '@openlayout/config';

interface LayoutConfig {
  header: HeaderConfig;
  footer: FooterConfig;
  sidebar: SidebarConfig;
  content: ContentConfig;
  breakpoints: Breakpoints;
  mobileBreakpoint: number;
  animation: AnimationConfig;
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

interface LayoutProps<VNode, CSSProperties, Element> extends Partial<LayoutConfig> {
  onBreakpointChange?: (breakpoint: Breakpoint, width: number) => void;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
```

**设计说明**：

- `LayoutConfig` 是最终配置类型，**所有字段必需**，通过 `merge()` 函数从用户输入生成
- `LayoutProps` 是用户输入类型，泛型参数（`VNode`, `CSSProperties`, `Element`）由上层框架提供具体类型
- 使用对象式配置 `header`、`footer`、`sidebar`、`content` 分组管理子组件属性
- 层级清晰，避免属性平铺导致的混乱
- 子组件仍可单独接收 props，根容器配置作为默认值
- config 包**无框架依赖**，VNode、CSSProperties 和 Element 类型由框架层通过泛型参数注入

#### Header 组件

```typescript
import type { HeaderConfig } from '@openlayout/config';

interface HeaderProps<VNode, CSSProperties, Element> extends Partial<HeaderConfig> {
  as?: Element;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
```

#### Footer 组件

```typescript
import type { FooterConfig } from '@openlayout/config';

interface FooterProps<VNode, CSSProperties, Element> extends Partial<FooterConfig> {
  as?: Element;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
```

#### Sidebar 组件

```typescript
import type { SidebarConfig } from '@openlayout/config';

interface SidebarProps<VNode, CSSProperties, Element> extends Partial<SidebarConfig> {
  onCollapsedChange?: (collapsed: boolean) => void;
  as?: Element;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
```

#### Content 组件

```typescript
import type { ContentConfig } from '@openlayout/config';

interface ContentProps<VNode, CSSProperties, Element> extends Partial<ContentConfig> {
  as?: Element;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
```

### 2.3 Core 层 - 断点计算与样式生成

> **核心职责**：core 层处理所有与布局相关的**逻辑计算**和**样式生成**，框架层只负责渲染。
>
> **状态管理**：采用 [nanostores](https://github.com/nanostores/nanostores) 实现轻量级状态管理
>
> **最佳实践参考**：
>
> - 断点检测使用 `window.resize` 事件（参考 [use-breakpoint](https://www.npmjs.com/package/use-breakpoint)、[vue-mq](https://www.npmjs.com/package/vue-mq)、[Material UI useMediaQuery](https://mui.com/material-ui/react-use-media-query/)）
> - CSS 变量存储动态值，通过 JS 监听断点变化设置变量值
> - 使用 nanostores 实现框架无关的响应式状态

#### 2.3.1 断点检测 (createResponsive)

```typescript
// @openlayout/core - 基于 nanostores 的断点检测
// 参考: use-breakpoint, vue-mq, Material UI useMediaQuery

import { atom } from 'nanostores';
import { DEFAULT_BREAKPOINTS, type Breakpoint, type Breakpoints } from '@openlayout/config';
import type { ResponsiveState } from './types';
import { $responsiveState } from './createStore';

export interface CreateResponsiveOptions {
  breakpoints?: Partial<Breakpoints>;
  mobileBreakpoint?: number;
}

export interface ResponsiveHelper {
  $state: typeof $responsiveState;
  isAbove: (breakpoint: Breakpoint) => boolean;
  isBelow: (breakpoint: Breakpoint) => boolean;
  init: () => void;
  destroy: () => void;
}

/**
 * 创建断点检测器
 * 
 * @description
 * 使用 window.resize 监听屏幕宽度变化，更新 $responsiveState。
 * 支持 SSR 场景（初始返回 'xxl', width: 0）。
 * 
 * @param {CreateResponsiveOptions} [options={}] - 配置选项
 * @returns {ResponsiveHelper} 响应式帮助器
 * 
 * @example
 * const helper = createResponsive({ mobileBreakpoint: 768 });
 * helper.init(); // 开始监听
 * // 订阅 $responsiveState 获取实时值
 * helper.destroy(); // 停止监听
 */
export function createResponsive(options: CreateResponsiveOptions = {}): ResponsiveHelper {
  const breakpoints: Breakpoints = { ...DEFAULT_BREAKPOINTS, ...options.breakpoints };
  const mobileThreshold = options.mobileBreakpoint ?? breakpoints.md ?? 768;
  let resizeListener: (() => void) | null = null;

  const init = () => {
    const update = () => {
      if (typeof window === 'undefined') return;
      const width = window.innerWidth;
      let breakpoint: Breakpoint = 'xxl';
      if (width < (breakpoints.xs ?? 480)) breakpoint = 'xs';
      else if (width < (breakpoints.sm ?? 576)) breakpoint = 'sm';
      else if (width < (breakpoints.md ?? 768)) breakpoint = 'md';
      else if (width < (breakpoints.lg ?? 992)) breakpoint = 'lg';
      else if (width < (breakpoints.xl ?? 1200)) breakpoint = 'xl';

      $responsiveState.set({
        breakpoint,
        width,
        isMobile: width < mobileThreshold,
        isTablet: width >= mobileThreshold && width < (breakpoints.lg ?? 992),
        isDesktop: width >= (breakpoints.lg ?? 992),
      });
    };

    resizeListener = () => update();
    window.addEventListener('resize', resizeListener);
    update();
  };

  const destroy = () => {
    if (resizeListener) {
      window.removeEventListener('resize', resizeListener);
      resizeListener = null;
    }
  };

  return {
    $state: $responsiveState,
    isAbove: (bp: Breakpoint) => {
      const state = $responsiveState.get();
      const threshold = breakpoints[bp];
      return threshold !== undefined && state.width >= threshold;
    },
    isBelow: (bp: Breakpoint) => {
      const state = $responsiveState.get();
      const threshold = breakpoints[bp];
      return threshold !== undefined && state.width < threshold;
    },
    init,
    destroy,
  };
}

/**
 * 生成 CSS 媒体查询字符串
 * 
 * @description
 * 根据断点配置生成用于 CSS-in-JS 的媒体查询字符串对象。
 * 
 * @param {Breakpoints} breakpoints - 断点配置
 * @returns {Record<Breakpoint, string>} 媒体查询字符串映射
 */
export function getMediaQueries(breakpoints: Breakpoints): Record<Breakpoint, string> {
  const keys = (['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as Breakpoint[]);
  const queries: Partial<Record<Breakpoint, string>> = {};

  keys.forEach((key, index) => {
    const minWidth = breakpoints[key];
    const maxKey = keys[index + 1];
    const maxWidth = maxKey ? (breakpoints[maxKey] ?? 0) - 0.02 : undefined;

    if (minWidth !== undefined) {
      if (maxWidth !== undefined && maxWidth > 0) {
        queries[key] = `@media (min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`;
      } else {
        queries[key] = `@media (min-width: ${minWidth}px)`;
      }
    }
  });

  return queries as Record<Breakpoint, string>;
}
```

**最佳实践说明**：

- 使用 nanostores `atom` 存储响应式状态，框架层订阅 `$responsiveState` 获取实时值
- 提供 `init`/`destroy` 生命周期管理
- 提供 `isAbove`、`isBelow` 方法判断断点关系
- `getMediaQueries` 辅助函数生成 CSS 媒体查询字符串
- 支持 SSR（服务端渲染）场景
- 内部使用 `$responsiveState`，统一响应式数据流

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

import type { LayoutConfig } from '@openlayout/config';
import type { LayoutStyles } from './types';

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

#### 2.3.3 CSS 变量导出 (可选)

> **设计说明**：core 层提供 CSS 变量导出功能，便于主题系统和外部样式表使用。
> **注意**：此函数与 `createStylesheet.ts` 中的 `createCSSVariables` 不同，此函数用于导出静态默认值供全局样式表使用。

```typescript
// @openlayout/core - CSS 变量导出（用于全局样式表）

type LayoutSelector = 'layout' | 'header' | 'footer' | 'sidebar' | 'content';

interface CSSVariablesExport {
  variables: Record<string, string | number>;
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
function getCSSVariables(prefix: string = 'od'): CSSVariablesExport {
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
```

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
```

#### 2.3.4 状态管理 (createStore + nanostores)

> **核心方案**：采用 [nanostores](https://github.com/nanostores/nanostores) 作为 core 层状态管理库。
>
> **优势**：
> - 超轻量：286 - 1013 bytes (gzip)
> - 零依赖：纯 JavaScript，无外部依赖
> - 多框架支持：React, Vue, Svelte, Solid, Vanilla JS
> - 原子化设计：适合 layout 多区域状态管理

##### types.ts - 核心类型定义

```typescript
// @openlayout/core/src/types.ts
import type { Breakpoint } from '@openlayout/config';

/** 操作目标 */
export type LayoutTarget = 'sidebar' | 'header' | 'footer';

/** 操作符 - 完整单词 */
export type LayoutOperator = 'collapse' | 'expand' | 'show' | 'hide' | 'stick' | 'unstick';

/** 统一 Action */
export interface LayoutAction {
  target: LayoutTarget;
  operator: LayoutOperator;
}

/** 响应式状态 */
export interface ResponsiveState {
  breakpoint: Breakpoint;
  width: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/** 验证结果 */
export interface ValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
}
```

##### createStore.ts - 状态管理实现

```typescript
// @openlayout/core/src/createStore.ts
import { atom, map } from 'nanostores';
import { merge, validate, DEFAULT_BREAKPOINTS, type LayoutConfig } from '@openlayout/config';
import type { LayoutAction, ResponsiveState, ValidationResult } from './types';

/** 状态 Store */
export const $layoutState = map({
  sidebar: { collapsed: false, visible: true, width: 200 },
  header: { visible: true, fixed: false, height: 64 },
  footer: { visible: true, fixed: false, height: 48 },
});

/** 响应式 Store */
export const $responsiveState = atom<ResponsiveState>({
  breakpoint: 'xxl',
  width: 0,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
});

const DEFAULT_CONFIG: LayoutConfig = {
  header: { enabled: true, height: 64, fixed: false, full: false },
  footer: { enabled: true, height: 48, fixed: false, full: false },
  sidebar: { enabled: true, width: 200, min: 80, collapsible: true, collapsed: false, full: true, overlay: false },
  content: { enabled: true, scrollable: true },
  animation: { enabled: true, duration: 200, easing: 'ease' },
  breakpoints: DEFAULT_BREAKPOINTS,
  mobileBreakpoint: 768,
};

export interface CreateStoreOptions {
  sidebar?: Partial<LayoutConfig['sidebar']>;
  header?: Partial<LayoutConfig['header']>;
  footer?: Partial<LayoutConfig['footer']>;
}

/**
 * 初始化布局状态
 * @description 使用 config 包的 merge + validate 能力
 */
export function createStore(options: CreateStoreOptions = {}): void {
  const config = merge<LayoutConfig>(
    DEFAULT_CONFIG,
    { header: options.header, footer: options.footer, sidebar: options.sidebar },
    { deep: true }
  );

  const validation = validate(config);
  if (!validation.valid) {
    console.warn('[createStore] Config validation warnings:', validation.errors);
  }

  $layoutState.set({
    sidebar: { collapsed: config.sidebar.collapsed ?? false, visible: config.sidebar.enabled ?? true, width: config.sidebar.width ?? 200 },
    header: { visible: config.header.enabled ?? true, fixed: config.header.fixed ?? false, height: config.header.height ?? 64 },
    footer: { visible: config.footer.enabled ?? true, fixed: config.footer.fixed ?? false, height: config.footer.height ?? 48 },
  });

  $responsiveState.set({ breakpoint: 'xxl', width: 0, isMobile: false, isTablet: false, isDesktop: true });
}

/**
 * 执行布局操作
 */
export function dispatch(action: LayoutAction): void {
  const state = $layoutState.get();
  const { target, operator } = action;

  switch (target) {
    case 'sidebar':
      switch (operator) {
        case 'collapse': $layoutState.setKey('sidebar', { ...state.sidebar, collapsed: true }); break;
        case 'expand': $layoutState.setKey('sidebar', { ...state.sidebar, collapsed: false }); break;
        case 'show': $layoutState.setKey('sidebar', { ...state.sidebar, visible: true }); break;
        case 'hide': $layoutState.setKey('sidebar', { ...state.sidebar, visible: false }); break;
      }
      break;
    case 'header':
      switch (operator) {
        case 'show': $layoutState.setKey('header', { ...state.header, visible: true }); break;
        case 'hide': $layoutState.setKey('header', { ...state.header, visible: false }); break;
        case 'stick': $layoutState.setKey('header', { ...state.header, fixed: true }); break;
        case 'unstick': $layoutState.setKey('header', { ...state.header, fixed: false }); break;
      }
      break;
    case 'footer':
      switch (operator) {
        case 'show': $layoutState.setKey('footer', { ...state.footer, visible: true }); break;
        case 'hide': $layoutState.setKey('footer', { ...state.footer, visible: false }); break;
        case 'stick': $layoutState.setKey('footer', { ...state.footer, fixed: true }); break;
        case 'unstick': $layoutState.setKey('footer', { ...state.footer, fixed: false }); break;
      }
      break;
  }
}

/**
 * 验证布局配置
 * @description 封装 config 包的 validate，方便框架层调用
 */
export function validateConfig(config: LayoutConfig): ValidationResult {
  return validate(config);
}
```

**设计说明**：

- 使用 `nanostores` 的 `atom` 和 `map` 实现状态管理，框架层订阅即可
- `LayoutAction` 统一所有操作，通过 `{ target, operator }` 模式
- 操作符使用完整单词：`collapse`/`expand`, `show`/`hide`, `stick`/`unstick`
- `createStore` 内部集成 `config.merge` 和 `config.validate`
- 框架层通过 `dispatch({ target: 'sidebar', operator: 'collapse' })` 触发更新

**框架层集成示例 (Vue)**：

```typescript
// @openlayout/vue - useLayout.ts

import { computed } from 'vue';
import { $layoutState, $responsiveState, createStore, createResponsive, createStylesheet, dispatch } from '@openlayout/core';
import { useStore } from '@nanostores/vue';
import type { LayoutConfig } from '@openlayout/config';

export function useLayout(config: LayoutConfig) {
  createStore();
  const responsiveHelper = createResponsive({
    breakpoints: config.breakpoints,
    mobileBreakpoint: config.mobileBreakpoint,
  });
  responsiveHelper.init();

  const state = useStore($layoutState);
  const responsive = useStore($responsiveState);

  const styles = computed(() => createStylesheet({
    config,
    breakpoint: responsive.breakpoint,
    isMobile: responsive.isMobile,
    collapsed: state.sidebar.collapsed,
  }));

  const actions = {
    collapseSidebar: () => dispatch({ target: 'sidebar', operator: 'collapse' }),
    expandSidebar: () => dispatch({ target: 'sidebar', operator: 'expand' }),
    hideSidebar: () => dispatch({ target: 'sidebar', operator: 'hide' }),
    showSidebar: () => dispatch({ target: 'sidebar', operator: 'show' }),
    hideHeader: () => dispatch({ target: 'header', operator: 'hide' }),
    showHeader: () => dispatch({ target: 'header', operator: 'show' }),
    stickHeader: () => dispatch({ target: 'header', operator: 'stick' }),
    unstickHeader: () => dispatch({ target: 'header', operator: 'unstick' }),
    hideFooter: () => dispatch({ target: 'footer', operator: 'hide' }),
    showFooter: () => dispatch({ target: 'footer', operator: 'show' }),
    stickFooter: () => dispatch({ target: 'footer', operator: 'stick' }),
    unstickFooter: () => dispatch({ target: 'footer', operator: 'unstick' }),
  };

  return { state, responsive, styles, actions };
}
```

### 2.4 Vue 层 - TSX 组件实现

> **渲染职责**：Vue 层使用 TSX 编写，负责将 core 层生成的样式应用到组件。
> **属性优先级**：组件 Props > Layout Config (Context) > Default
> **实现方式**：采用函数式组件（Functional Component）写法，直接在 `defineComponent` 中返回渲染函数。
> **状态管理**：使用 `@nanostores/vue` 订阅 core 层的 nanostores

```tsx
// @openlayout/vue - Layout.tsx

import { defineComponent, computed, provide, ref, onMounted, onUnmounted, type StyleValue } from 'vue';
import { useStore } from '@nanostores/vue';
import { createResponsive, createStylesheet, $layoutState, $responsiveState, dispatch } from '@openlayout/core';
import type { LayoutProps, LayoutConfig, Breakpoint } from '@openlayout/config';
import { resolveConfig } from '@openlayout/config';

export const Layout = defineComponent((props: LayoutProps, { slots }) => {
  const config = computed<LayoutConfig>(() => resolveConfig(props));

  // 使用 nanostores 订阅状态
  const layoutState = useStore($layoutState);
  const responsiveState = useStore($responsiveState);

  // Responsive State
  const breakpoint = ref<Breakpoint>('xxl');
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 0);
  const isMobile = computed(() => width.value < (props.mobileBreakpoint ?? 768));

  const updateResponsive = () => {
    const current = createResponsive({ breakpoints: props.breakpoints });
    if (current.breakpoint !== breakpoint.value) {
      breakpoint.value = current.breakpoint;
      props.onBreakpointChange?.(current.breakpoint, window.innerWidth);
    }
    width.value = window.innerWidth;
    $responsiveState.set({
      breakpoint: current.breakpoint,
      width: window.innerWidth,
      isMobile: isMobile.value,
      isTablet: isMobile.value && width.value >= 576,
      isDesktop: !isMobile.value,
    });
  };

  onMounted(() => {
    window.addEventListener('resize', updateResponsive);
    updateResponsive();
  });

  onUnmounted(() => {
    window.removeEventListener('resize', updateResponsive);
  });

  // Actions - 使用 dispatch 统一触发
  const actions = {
    collapseSidebar: () => dispatch({ target: 'sidebar', operator: 'collapse' }),
    expandSidebar: () => dispatch({ target: 'sidebar', operator: 'expand' }),
    hideSidebar: () => dispatch({ target: 'sidebar', operator: 'hide' }),
    showSidebar: () => dispatch({ target: 'sidebar', operator: 'show' }),
    hideHeader: () => dispatch({ target: 'header', operator: 'hide' }),
    showHeader: () => dispatch({ target: 'header', operator: 'show' }),
    stickHeader: () => dispatch({ target: 'header', operator: 'stick' }),
    unstickHeader: () => dispatch({ target: 'header', operator: 'unstick' }),
    hideFooter: () => dispatch({ target: 'footer', operator: 'hide' }),
    showFooter: () => dispatch({ target: 'footer', operator: 'show' }),
    stickFooter: () => dispatch({ target: 'footer', operator: 'stick' }),
    unstickFooter: () => dispatch({ target: 'footer', operator: 'unstick' }),
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
│   │   ├── index.ts              # 统一导出
│   │   ├── types.ts              # 核心类型定义
│   │   ├── createResponsive.ts   # 断点检测
│   │   ├── createStylesheet.ts   # CSS 样式生成
│   │   └── createStore.ts        # 状态管理 + validateConfig (nanostores)
│   ├── package.json
│   └── tsconfig.json
│
├── config/        # @openlayout/config - 配置和类型
│   ├── src/
│   │   ├── index.ts              # 统一导出
│   │   ├── types.ts              # 基础类型 (Breakpoint, Breakpoints)
│   │   ├── layout.ts             # LayoutConfig, LayoutProps
│   │   ├── header.ts             # HeaderConfig, HeaderProps
│   │   ├── footer.ts             # FooterConfig, FooterProps
│   │   ├── sidebar.ts            # SidebarConfig, SidebarProps
│   │   ├── content.ts            # ContentConfig, ContentProps
│   │   ├── animation.ts          # AnimationConfig
│   │   ├── constants.ts          # 默认常量
│   │   ├── merge.ts              # 配置合并
│   │   └── validate.ts           # 配置验证
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
│   依赖: @nanostores/vue            │
│   依赖: @opendesign/tsconfig (dev) │
├─────────────────────────────────────┤
│              core                   │
│          (纯逻辑层)                  │
│   依赖: @openlayout/config         │
│   依赖: nanostores                 │
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
| vue    | @openlayout/vue    | Vue3 组件库       |

### 3.5 职责分工

**core 层（逻辑与样式）**：

- 断点计算 (`createResponsive`) - 基于 window\.matchMedia
- 样式生成 (`createStylesheet`) - CSS 变量 + 样式对象
- 状态管理 (`createStore`) - nanostores 原子化状态
- 配置验证 (`validateConfig`) - 封装 config.validate
- 无 DOM 依赖，纯业务逻辑
- 最大化利用 config 包（merge + validate）

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

config 包已定义 `Breakpoint` 和 `Breakpoints` 类型，详见 [config/src/types.ts](packages/components/layout/config/src/types.ts)

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

| 优化策略      | 说明               | 适用场景         |
| --------- | ---------------- | ------------ |
| `useMemo` | 缓存复杂计算结果         | 响应式样式计算、断点判断 |
| CSS 变量    | 减少 JS 内存分配，浏览器优化 | 主题切换、响应式调整   |

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

| 层级     | 工具                            | 说明             |
| ------ | ----------------------------- | -------------- |
| 单元测试   | Vitest                        | core 层纯函数测试    |
| 组件测试   | Vitest + @testing-library/vue | 组件渲染和交互测试（自动化） |
| E2E 测试 | Playwright                    | 完整流程测试、多设备响应式  |
| 无障碍测试  | axe-core                      | WCAG 合规性       |

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

