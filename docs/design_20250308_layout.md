# OpenDesign Layout 布局组件设计方案

**版本**: 1.1.0  
**状态**: 进行中

---

## 修改记录 (Changelog)

| 版本 | 日期 | 修改内容 |
|------|------|----------|
| 1.1.0 | 2025-03-10 | 优化：Vue 使用 TSX 编写；breakpoint 计算和 CSS 动态样式移至 core 层；增强 TS 类型安全 |
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

| 层级 | 职责 |
|------|------|
| **core** | 断点计算、响应式样式生成、布局状态管理 |
| **vue/react** | 组件渲染、DOM 事件绑定、框架特定 API |

### 2.2 组件 Props 设计

#### Layout 根容器

```typescript
interface LayoutProps {
  // ==================== Header 配置 ====================
  header?: {
    /** Header 高度 */
    height?: number;
    /** 固定定位 */
    fixed?: boolean;
    /** 撑满左右（与 Sidebar 对齐） */
    fullWidth?: boolean;
  };

  // ==================== Footer 配置 ====================
  footer?: {
    /** Footer 高度 */
    height?: number;
    /** 固定定位 */
    fixed?: boolean;
    /** 撑满左右 */
    fullWidth?: boolean;
  };

  // ==================== Sidebar 配置 ====================
  sidebar?: {
    /** Sidebar 宽度 */
    width?: number;
    /** 折叠后宽度 */
    collapsedWidth?: number;
    /** 是否可折叠 */
    collapsible?: boolean;
    /** 默认折叠状态 */
    defaultCollapsed?: boolean;
    /** 撑满上下 */
    fullHeight?: boolean;
    /** 遮罩层模式（移动端） */
    overlay?: boolean;
  };

  // ==================== Content 配置 ====================
  content?: {
    /** 是否可滚动 */
    scrollable?: boolean;
  };

  // ==================== 响应式断点配置 ====================
  /** 响应式断点设置 */
  breakpoints?: {
    /** 超小 - 手机 (< 480px) */
    xs?: number;
    /** 小 - 大手机 (≥ 480px) */
    sm?: number;
    /** 中 - 平板 (≥ 768px) */
    md?: number;
    /** 大 - 小笔记本 (≥ 992px) */
    lg?: number;
    /** 超大 - 桌面 (≥ 1200px) */
    xl?: number;
    /** 超超大 - 大桌面 (≥ 1400px) */
    xxl?: number;
  };

  /** 移动端断点（小于此值视为移动端） */
  mobileBreakpoint?: number;

  /** 断点变化回调 */
  onBreakpointChange?: (breakpoint: Breakpoint) => void;

  // ==================== 全局配置 ====================
  /** 是否启用动画 */
  animated?: boolean;
  /** 动画时长 */
  animationDuration?: number;

  /** 主题模式 */
  theme?: 'light' | 'dark' | 'system';
  /** 主题变化回调 */
  onThemeChange?: (theme: 'light' | 'dark') => void;

  // ==================== 渲染控制 ====================
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
```

**设计说明**：
- 使用对象式配置 `header`、`footer`、`sidebar`、`content` 分组管理子组件属性
- 层级清晰，避免属性平铺导致的混乱
- 子组件仍可单独接收 props，根容器配置作为默认值

#### Header 组件

```typescript
interface HeaderProps {
  /** 固定定位 */
  fixed?: boolean;
  /** 撑满左右（与 Sidebar 对齐） */
  fullWidth?: boolean;
  /** 自定义渲染 */
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
```

#### Footer 组件

```typescript
interface FooterProps {
  /** 固定定位 */
  fixed?: boolean;
  /** 撑满左右 */
  fullWidth?: boolean;
  /** 自定义渲染 */
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
```

#### Sidebar 组件

```typescript
interface SidebarProps {
  /** 可折叠 */
  collapsible?: boolean;
  /** 折叠状态（受控） */
  collapsed?: boolean;
  /** 默认折叠状态（非受控） */
  defaultCollapsed?: boolean;
  /** 折叠状态变化回调 */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** 撑满上下 */
  fullHeight?: boolean;
  /** 遮罩层模式（移动端） */
  overlay?: boolean;
  /** 自定义渲染 */
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
```

#### Content 组件

```typescript
interface ContentProps {
  /** 可滚动 */
  scrollable?: boolean;
  /** 自定义渲染 */
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
```

### 2.3 Hooks API 设计

```typescript
// 从 @openlayout/react 导入
import { useLayout, useSidebar, useHeader, useFooter } from '@openlayout/react';

// 断点类型（来自 @openlayout/config）
import type { Breakpoint } from '@openlayout/config';

// 根布局状态（框架适配层返回）
const {
  // 布局方向
  direction,
  // 响应式状态（框架适配层处理 isMobile）
  isMobile,        // 框架层返回：width < mobileBreakpoint
  breakpoint,      // 断点值：'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
  breakpoints,     // 断点配置
  currentWidth,    // 当前视口宽度
  // 主题状态
  theme,
  // 尺寸
  headerHeight,
  footerHeight,
  sidebarWidth,
  collapsedWidth,
} = useLayout();

// Sidebar 状态和操作
const {
  // 状态
  collapsed,
  visible,
  width,
  // 操作
  toggle,
  collapse,
  expand,
  show,
  hide,
} = useSidebar();

// Header 状态
const {
  visible: headerVisible,
  fixed: headerFixed,
  height: headerHeight,
  show: showHeader,
  hide: hideHeader,
} = useHeader();

// Footer 状态
const {
  visible: footerVisible,
  fixed: footerFixed,
  height: footerHeight,
  show: showFooter,
  hide: hideFooter,
} = useFooter();
```

### 2.4 内部 CSS 布局结构

组件内部使用 Flexbox 实现布局，不暴露给外部，但作为实现参考：

```css
/* Layout 根容器 */
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* 垂直布局（默认） */
.layout-vertical {
  flex-direction: column;
}

/* 水平布局 */
.layout-horizontal {
  flex-direction: row;
}

/* Header */
.layout-header {
  flex-shrink: 0;
}
.layout-header.fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}
.layout-header.full-width {
  width: 100%;
}

/* Footer */
.layout-footer {
  flex-shrink: 0;
}
.layout-footer.fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}
.layout-footer.full-width {
  width: 100%;
}

/* Sidebar */
.layout-sidebar {
  flex-shrink: 0;
  transition: width 200ms ease;
}
.layout-sidebar.full-height {
  height: 100%;
}
.layout-sidebar.overlay {
  position: fixed;
  z-index: 99;
}

/* Content */
.layout-content {
  flex: 1;
  min-width: 0;
}
.layout-content.scrollable {
  overflow: auto;
}
```

---

## 3. 包结构设计

### 3.1 目录结构

```
packages/components/layout/
├── core/          # @openlayout/core - 纯逻辑层
│   ├── src/
│   │   ├── index.ts
│   │   ├── createLayout.ts      # 创建布局实例
│   │   ├── useLayout.ts         # 根布局状态
│   │   ├── useSidebar.ts        # Sidebar 状态
│   │   ├── useHeader.ts         # Header 状态
│   │   ├── useFooter.ts         # Footer 状态
│   │   ├── useContent.ts        # Content 状态
│   │   ├── useResponsive.ts     # 响应式状态
│   │   ├── LayoutContext.ts     # Context 定义
│   │   └── types.ts             # 核心类型
│   └── package.json
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
│
├── vue/           # @openlayout/vue - Vue 适配
│   ├── src/
│   │   ├── index.ts
│   │   ├── Layout.vue
│   │   ├── Header.vue
│   │   ├── Footer.vue
│   │   ├── Sidebar.vue
│   │   ├── Content.vue
│   │   └── useLayout.ts
│   └── package.json
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
    └── package.json
```

### 3.2 包依赖关系

```
┌─────────────────────────────────────┐
│           vue / react               │
│         (框架适配层)                 │
│   依赖: @openlayout/core           │
│   依赖: @openlayout/config         │
├─────────────────────────────────────┤
│              core                   │
│          (纯逻辑层)                  │
│   依赖: @openlayout/config (类型)   │
├─────────────────────────────────────┤
│             config                  │
│       (配置和类型定义)              │
│        (无外部依赖)                 │
└─────────────────────────────────────┘
```

### 3.3 包名定义

| 目录 | 包名 | 说明 |
|------|------|------|
| core | @openlayout/core | 纯逻辑状态管理 |
| config | @openlayout/config | 类型定义和常量 |
| vue | @openlayout/vue | Vue3 组件库 |
| react | @openlayout/react | React 组件库 |

### 3.4 职责分工

**core 层（纯逻辑）**：
- 只处理 Breakpoint 断点计算
- 不涉及具体业务判断（如 isMobile）
- 提供断点变化事件，由框架适配层决定如何响应

**框架适配层（vue/react）**：
- 负责具体业务判断（如 isMobile）
- 处理移动端适配逻辑
- 处理主题切换（跟随系统等）
- 处理 DOM 监听和事件绑定

```
┌────────────────────────────────────────────────────────────┐
│                      framework (vue/react)                  │
│  • 监听 window.resize                                      │
│  • 判断 isMobile = width < mobileBreakpoint                │
│  • 处理主题切换（跟随系统）                                  │
│  • 触发 onBreakpointChange 回调                           │
├────────────────────────────────────────────────────────────┤
│                         core                              │
│  • 存储 breakpoints 配置                                   │
│  • 计算当前 breakpoint                                      │
│  • 提供 breakpoint 变化事件                                │
│  • 不判断 isMobile，只提供断点数值                         │
├────────────────────────────────────────────────────────────┤
│                        config                              │
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

**core 层（纯逻辑）**：

```typescript
// core/src/useResponsive.ts
import { ref, computed } from 'vue'; // 或 React hooks
import type { Breakpoint, Breakpoints } from '@openlayout/config';
import { DEFAULT_BREAKPOINTS } from '@openlayout/config';

export function createResponsive(config: { breakpoints?: Breakpoints }) {
  const breakpoints = ref(config.breakpoints ?? DEFAULT_BREAKPOINTS);
  const currentWidth = ref(0);

  // 计算当前断点（纯数值计算）
  const breakpoint = computed<Breakpoint>(() => {
    const width = currentWidth.value;
    const bp = breakpoints.value;

    if (width < (bp.xs ?? 480)) return 'xs';
    if (width < (bp.sm ?? 576)) return 'sm';
    if (width < (bp.md ?? 768)) return 'md';
    if (width < (bp.lg ?? 992)) return 'lg';
    if (width < (bp.xl ?? 1200)) return 'xl';
    return 'xxl';
  });

  return {
    breakpoints,
    currentWidth,
    breakpoint,
    setWidth: (width: number) => { currentWidth.value = width; },
  };
}
```

**framework 适配层（vue/react）**：

```typescript
// react/src/useLayout.tsx
import { useEffect, useState } from 'react';
import { createResponsive } from '@openlayout/core';
import type { ResponsiveConfig } from '@openlayout/config';

export function useResponsive(config: ResponsiveConfig) {
  const { breakpoints, breakpoint, setWidth } = createResponsive(config);

  // 框架适配层处理 DOM 监听
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWidth(width);

      // 框架层处理 isMobile 业务判断
      const mobile = width < (config.mobileBreakpoint ?? 768);
      setIsMobile(mobile);

      // 触发回调
      config.onBreakpointChange?.(breakpoint.value);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [config.mobileBreakpoint, config.onBreakpointChange]);

  return {
    breakpoints: breakpoints.value,
    breakpoint: breakpoint.value,
    isMobile,  // 框架层业务判断
    currentWidth: currentWidth.value,
  };
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
