# OpenDesign Layout 布局系统架构设计

**项目名称**: OpenDesign Layout
**文档类型**: 架构设计文档
**版本**: 1.2.0
**状态**: 草稿

---

## 修改记录 (Changelog)

| 版本 | 日期 | 修改内容 | 作者 |
|------|------|----------|------|
| 1.2.0 | 2026-02-28 | 架构升级：合并 type/config 到 core；增加设计原则；明确 Core 不知道 UI 原则；使用 Nanostores + @nanostores/media 管理状态 | - |

---

## 1. 背景和目标（Background & Goals）

### 1.1 核心定位

OpenDesign Layout 是一个：

- ✅ **纯结构布局内核**
- ✅ **零运行时依赖**
- ✅ **强类型 + 可预测**
- ✅ **可扩展 + SSR 友好**
- ✅ **超轻量（Core ≤ 3kb gzip 目标）**

它只解决：

> header / footer / aside / content 的结构布局与尺寸控制问题。

### 1.2 设计原则

#### 1️⃣ 单一职责原则（SRP）

| 模块 | 职责 |
|------|------|
| state | 纯状态管理 |
| media | 断点系统 |
| layout | 尺寸计算 |
| inject | CSS 变量注入 |
| config | 默认配置 |

每个模块必须：

- 无副作用（除 inject）
- 可独立测试
- 不互相循环依赖

#### 2️⃣ Core 不知道 UI

Core 层：

- ❌ 不知道 React
- ❌ 不知道 Vue
- ❌ 不知道 DOM 结构
- ❌ 不输出 className
- ❌ 不输出样式对象

Core 只输出：

```ts
LayoutState
LayoutDimensions
string | null  // breakpoint
```

### 1.3 背景

Layout 是所有应用的基础骨架，负责控制页面主要区域的布局结构。

### 1.4 目标

- **纯粹性（Pure Layout）**：仅控制 header/footer/aside/content 布局，不涉及主题、颜色
- **灵活性（Flexibility）**：支持多种常见布局模式（侧边栏布局、顶部导航布局、混合布局）
- **响应式（Responsiveness）**：完美支持移动端，平板和桌面端
- **CSS 可扩展**：通过 CSS 变量供外部框架（如 TailwindCSS）扩展
- **零依赖**：核心层无运行时依赖，支持 SSR

### 1.5 非目标

- ❌ 不包含主题管理（颜色、字体）
- ❌ 不包含 DesignTokens
- ❌ 不绑定特定 CSS 框架
- ❌ Core 层不泄漏 UI 实现细节

---

## 2. 技术方案（Technical Approach）

### 2.1 整体架构

采用 **"Core + Adapter" 两层架构**：

```
┌─────────────────────────────────────────────────────────────┐
│                    Framework UI Components                   │
│         (React Components, Vue Components, etc.)            │
├─────────────────────────────────────────────────────────────┤
│                    Framework Adapters                        │
│         (React Hooks/Context, Vue Composables)              │
├─────────────────────────────────────────────────────────────┤
│                    @openlayout/core                         │
│    (Types + Config + State + Media + Layout + Inject)       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心层（@openlayout/core）

#### 核心职责

- 定义 TypeScript 类型接口
- 提供布局配置默认值
- 纯 JavaScript/TypeScript 逻辑，无框架依赖
- 不可变状态管理（createState）
- 互斥断点检测（createMedia）
- 尺寸计算（createLayout）
- CSS 变量注入（inject）
- 支持 SSR

#### 类型定义

```typescript
// 布局模式
export type LayoutMode = "sidebar" | "top" | "mixed";

// 响应式断点（支持任意自定义命名）
export interface Breakpoints {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  [key: string]: number | undefined;
}

// 当前激活的断点（字符串键名）

// 单个区域的大小配置（支持简写、范围和自动）
export interface LayoutSize {
  min?: number; // 最小值
  max?: number; // 最大值
  auto?: boolean; // 自动撑开（无限制）
}

// 简写类型：number = { min: n, max: n }
export type LayoutSizeValue = number | LayoutSize | "auto";

// 布局尺寸配置
export interface LayoutSizes {
  header?: LayoutSizeValue;
  footer?: LayoutSizeValue;
  aside?: LayoutSizeValue;
}

// 布局配置
export interface LayoutConfig {
  mode: LayoutMode;
  defaultCollapsed: boolean;
  breakpoints: Breakpoints;
  sizes: LayoutSizes;
}

// 布局状态（Core 内部状态，不包含 UI 语义）
export interface LayoutState {
  collapsed: boolean;
  breakpoint: string | null;
}
```

#### 默认配置

```typescript
export const defaultConfig: LayoutConfig = {
  mode: "sidebar",
  defaultCollapsed: false,
  breakpoints: {
    xs: 480,
    sm: 768,
    md: 1024,
  },
  sizes: {
    header: 64,
    footer: 48,
    aside: 240,
  },
};
```

#### 使用示例

```typescript
// 固定值（简写）
aside: 240

// 范围限制
aside: { min: 200, max: 400 }

// 仅最大高度
header: { max: 100 }

// 自动撑开（无限制）
aside: 'auto'
```

#### 状态管理器（使用 Nanostores）

```typescript
// state.ts
import { atom, task } from "nanostores";
import type { LayoutConfig, LayoutState } from "@openlayout/core";

// 创建原子状态
export const $layoutState = atom<LayoutState>({
  collapsed: false,
  breakpoint: null,
});

// 初始化状态
export function initState(config: LayoutConfig): void {
  $layoutState.set({
    collapsed: config.defaultCollapsed ?? false,
    breakpoint: null,
  });
}

// 设置折叠状态
export function setCollapsed(collapsed: boolean): void {
  $layoutState.set({ ...$layoutState.get(), collapsed });
}

// 切换折叠状态
export function toggleCollapsed(): void {
  const current = $layoutState.get();
  $layoutState.set({ ...current, collapsed: !current.collapsed });
}

// 设置断点
export function setBreakpoint(breakpoint: string | null): void {
  $layoutState.set({ ...$layoutState.get(), breakpoint });
}

// 订阅状态变化（用于框架适配器）
export function useLayoutState(): LayoutState {
  return $layoutState.get();
}
```

**使用 Nanostores 的优势**：
- 🏈 **超小**: 265-797 bytes (gzip)
- 🌳 **Tree-shakable**: 只导入使用的功能
- 🌍 **框架无关**: React / Vue / Svelte / Vanilla JS
- 📦 **零依赖**
- 🛠️ **优秀 TypeScript 支持**
- 🧪 **经过生产验证** (Evil Martians 开发，PostCSS 作者)

#### 断点检测（使用 @nanostores/media）

```typescript
// media.ts
import { mapMedia } from "@nanostores/media";
import type { Breakpoints } from "@openlayout/core";

// 构建互斥断点查询（无重叠、无空隙）
function buildQueries(bp: Breakpoints): Record<string, string> {
  const keys = (Object.keys(bp) as (keyof typeof bp)[])
    .filter((k) => bp[k] !== undefined)
    .sort((a, b) => (bp[a] ?? 0) - (bp[b] ?? 0));

  if (keys.length === 0) return {};

  const queries: Record<string, string> = {};

  // 第一个区间：xs 及以下
  queries[keys[0]] = `(max-width: ${bp[keys[0]]}px)`;

  // 中间区间
  for (let i = 1; i < keys.length - 1; i++) {
    queries[keys[i]] = `(min-width: ${bp[keys[i - 1]]! + 1}px) and (max-width: ${bp[keys[i]]}px)`;
  }

  // 最后一个区间
  if (keys.length > 1) {
    const lastKey = keys[keys.length - 1]!;
    queries[lastKey] = `(min-width: ${bp[lastKey]}px)`;
  }

  return queries;
}

// 创建媒体查询状态
export function createMedia(breakpoints: Breakpoints) {
  const queries = buildQueries(breakpoints);
  const $media = mapMedia(queries);

  // 获取当前断点
  function getBreakpoint(): string | null {
    const keys = Object.keys(queries) as (keyof typeof queries)[];
    for (const key of keys) {
      if ($media.get()[key as keyof typeof $media.get()]) {
        return key as string | null;
      }
    }
    // SSR fallback: 返回最大断点
    const sortedKeys = keys.sort((a, b) => (breakpoints[b] ?? 0) - (breakpoints[a] ?? 0));
    return sortedKeys[0] ?? null;
  }

  return {
    $media,
    getBreakpoint,
  };
}
```

**使用 @nanostores/media 的优势**：
- 🏈 **超小**: ~500 bytes
- 🌍 **框架无关**: React / Vue / Svelte / Vanilla
- 🛠️ **SSR 支持**: 服务端返回空对象
- ✅ **零依赖**: Nanostores 官方扩展

#### 布局计算

```typescript
// layout.ts
import type {
  LayoutConfig,
  LayoutDimensions,
  LayoutSize,
  LayoutSizeValue,
  LayoutState,
} from "@openlayout/core";

// 校验并规范化尺寸配置
// 纯函数，无副作用
function normalizeSize(value?: LayoutSizeValue): LayoutSize {
  if (value === undefined || value === "auto") {
    return Object.freeze({ auto: true });
  }

  if (typeof value === "number") {
    return Object.freeze({ min: value, max: value });
  }

  const size: LayoutSize = { ...value };

  // 负值保护
  if (size.min !== undefined && size.min < 0) size.min = 0;
  if (size.max !== undefined && size.max < 0) size.max = 0;

  // min > max 修正
  if (size.min !== undefined && size.max !== undefined && size.min > size.max) {
    [size.min, size.max] = [size.max, size.min!];
  }

  // 默认值（非 auto 模式下）
  if (size.min === undefined) size.min = 0;
  if (size.max === undefined) size.max = size.min;

  return Object.freeze(size);
}

// 判断是否为移动端（基于最小断点）
function isMobileState(
  breakpoint: string | null,
  breakpoints: LayoutConfig["breakpoints"]
): boolean {
  if (!breakpoint) return false;
  
  const breakpointValues = Object.values(breakpoints);
  const minValue = Math.min(...breakpointValues.filter((v): v is number => typeof v === "number"));
  const currentValue = breakpoints[breakpoint];
  
  return currentValue === minValue;
}

// 主布局计算函数
// 纯函数，给定相同输入必定产生相同输出
export function createLayout(
  config: LayoutConfig,
  state: LayoutState
): LayoutDimensions {
  // 规范化各区域尺寸
  const header = normalizeSize(config.sizes.header);
  const footer = normalizeSize(config.sizes.footer);
  const aside = normalizeSize(config.sizes.aside);

  // 判断移动端状态
  const mobile = isMobileState(state.breakpoint, config.breakpoints);

  // 计算侧边栏宽度
  // 移动端或折叠状态时宽度为 0
  const asideWidth = mobile || state.collapsed ? 0 : aside.min;

  return Object.freeze({
    header: { min: header.min, max: header.max },
    footer: { min: footer.min, max: footer.max },
    aside: { min: asideWidth, max: aside.max },
  });
}
```

#### CSS 变量注入

```typescript
// inject.ts
import type { LayoutSizes, LayoutSizeValue } from "@openlayout/core";

function normalize(v?: LayoutSizeValue): LayoutSize {
  if (!v) return { min: 0, max: 0 };
  return typeof v === "number" ? { min: v, max: v } : v;
}

export function inject(sizes: LayoutSizes): void {
  const h = normalize(sizes.header);
  const f = normalize(sizes.footer);
  const a = normalize(sizes.aside);

  const css = `
    :root {
      --od-header-height: ${h.min}px;
      --od-footer-height: ${f.min}px;
      --od-aside-width: ${a.min}px;
    }
  `;

  if (typeof document !== "undefined") {
    const id = "od-layout-variables";
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement("style");
      style.id = id;
      document.head.appendChild(style);
    }
    style.textContent = css;
  }
}
```

---

## 3. 包结构

```
@openlayout/core       # 核心层（Types + Config + State + Media + Layout + Inject）
@openlayout/react     # React 适配器
@openlayout/vue       # Vue 3 适配器
```

**依赖**：
- `nanostores` - 状态管理
- `@nanostores/media` - 断点检测

---

## 4. API 设计

### 4.1 核心 API（一站式创建）

```typescript
import { createLayout } from "@openlayout/core";

// 一站式创建布局实例
const layout = createLayout({
  mode: "sidebar",
  breakpoints: { xs: 480, sm: 768, md: 1024 },
  sizes: { header: 64, aside: 240 },
});

// 获取状态
layout.getState();      // { collapsed: false, breakpoint: 'md' }

// 获取布局尺寸
layout.getDimensions();  // { header: { min: 64, max: 64 }, aside: { min: 240, max: 240 } }

// 订阅状态变化
layout.subscribe((state) => {
  console.log("状态变化:", state);
});
```

### 4.2 React Hooks API

```typescript
import { useLayout, useCollapsed, useBreakpoint, useDimensions } from "@openlayout/react";

function App() {
  // 完整布局状态
  const { collapsed, breakpoint, toggleCollapsed } = useLayout();
  
  // 单一状态（更精确的订阅）
  const collapsed = useCollapsed();
  const breakpoint = useBreakpoint();
  const dimensions = useDimensions();
  
  return (
    <div>
      <Header height={dimensions.header.min} />
      <div style={{ display: "flex" }}>
        <Sidebar width={dimensions.aside.min} collapsed={collapsed} />
        <Content />
      </div>
    </div>
  );
}
```

### 4.3 Vue 3 Composables API

```typescript
import { useLayout, useCollapsed, useBreakpoint, useDimensions } from "@openlayout/vue";

<script setup>
const { collapsed, breakpoint, toggleCollapsed } = useLayout();
const collapsed = useCollapsed();
const breakpoint = useBreakpoint();
const dimensions = useDimensions();
</script>
```

### 4.4 状态操作 API

```typescript
// 切换折叠
layout.toggleCollapsed();

// 设置折叠状态
layout.setCollapsed(true);

// 设置断点（内部自动调用）
layout.setBreakpoint("md");
```

---

## 5. 验收标准

- [ ] `@openlayout/core` 提供完整 TypeScript 类型定义
- [ ] `@openlayout/core` 提供默认配置
- [ ] `@openlayout/core` 可在 Node.js 环境运行
- [ ] **API 友好**：一站式 `createLayout()` 创建
- [ ] **React Hooks**：提供 `useLayout`、`useCollapsed`、`useBreakpoint`、`useDimensions`
- [ ] **Vue Composables**：提供 `useLayout`、`useCollapsed`、`useBreakpoint`、`useDimensions`
- [ ] 断点系统为互斥模型，保证同时只有一个 active breakpoint
- [ ] 断点区间无重叠、无空隙
- [ ] SSR fallback 使用最大断点而非硬编码
- [ ] Core 层不泄漏 UI 实现细节（定位、边距等）
- [ ] 状态管理为不可变（Immutable）
- [ ] 尺寸计算包含完整的校验逻辑（负值、min>max）
