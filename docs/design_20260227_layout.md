# OpenDesign Layout 布局系统架构设计

**项目名称**: OpenDesign Layout
**文档类型**: 架构设计文档
**版本**: 1.1.0
**状态**: 草稿

---

## 1. 背景和目标（Background & Goals）

### 1.1 背景
Layout 是所有应用的基础骨架，负责控制页面主要区域的布局结构。

### 1.2 目标
- **纯粹性（Pure Layout）**：仅控制 header/footer/aside/content 布局，不涉及主题、颜色
- **灵活性（Flexibility）**：支持多种常见布局模式（侧边栏布局、顶部导航布局、混合布局）
- **响应式（Responsiveness）**：完美支持移动端，平板和桌面端
- **CSS 可扩展**：通过 CSS 变量供外部框架（如 TailwindCSS）扩展
- **零依赖**：核心层无运行时依赖，支持 SSR

### 1.3 非目标
- ❌ 不包含主题管理（颜色、字体）
- ❌ 不包含 DesignTokens
- ❌ 不绑定特定 CSS 框架
- ❌ Core 层不泄漏 UI 实现细节

---

## 2. 技术方案（Technical Approach）

### 2.1 整体架构
采用 **"Type + Config + Core" 三层架构**：

```
┌─────────────────────────────────────────────────────────────┐
│                    Framework UI Components                   │
│         (React Components, Vue Components, etc.)            │
├─────────────────────────────────────────────────────────────┤
│                    Framework Adapters                        │
│         (React Hooks/Context, Vue Composables)              │
├─────────────────────────────────────────────────────────────┤
│                    @openlayout/core                         │
│    (State + Media + Layout + Inject)                        │
├─────────────────────────────────────────────────────────────┤
│                    @openlayout/config                       │
│                    (Default Config)                         │
├─────────────────────────────────────────────────────────────┤
│                    @openlayout/type                         │
│                    (TypeScript Types)                       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 类型层（@openlayout/type）

#### 核心职责
- 定义 TypeScript 类型接口
- 纯类型定义，无运行时依赖

#### 类型定义
```typescript
// 布局模式
export type LayoutMode = 'sidebar' | 'top' | 'mixed';

// 响应式断点（支持任意自定义命名）
export interface Breakpoints {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  [key: string]: number | undefined;
}

// 当前激活的断点（互斥模型）
export type ActiveBreakpoint = string | null;

// 单个区域的大小配置（支持简写和完整写法）
export interface LayoutSize {
  min?: number;   // 最小值
  max?: number;   // 最大值
}

// 简写类型：number = { min: n, max: n }
export type LayoutSizeValue = number | LayoutSize;

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
  activeBreakpoint: ActiveBreakpoint;
}
```

### 2.3 配置层（@openlayout/config）

#### 核心职责
- 提供布局配置默认值
- 仅处理业务配置数据

#### 默认配置
```typescript
export const defaultConfig: LayoutConfig = {
  mode: 'sidebar',
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
aside: { }
```

### 2.4 核心层（@openlayout/core）

#### 核心职责
- 纯 JavaScript/TypeScript 逻辑，无框架依赖
- 不可变状态管理（createState）
- 互斥断点检测（createMedia）
- 尺寸计算（createLayout）
- CSS 变量注入（inject）
- 支持 SSR

#### 状态管理器（不可变）
```typescript
// state.ts
import type { LayoutState, LayoutConfig, ActiveBreakpoint } from '@openlayout/type';

type Listener = (state: LayoutState) => void;

export function createState(initialConfig: Partial<LayoutConfig>) {
  let state: LayoutState = {
    collapsed: initialConfig.defaultCollapsed ?? false,
    activeBreakpoint: null,
  };

  const listeners = new Set<Listener>();

  return {
    getState: (): Readonly<LayoutState> => state,
    
    setCollapsed: (collapsed: boolean) => {
      state = { ...state, collapsed };
      listeners.forEach(fn => fn(state));
    },
    
    setBreakpoint: (breakpoint: ActiveBreakpoint) => {
      state = { ...state, activeBreakpoint: breakpoint };
      listeners.forEach(fn => fn(state));
    },
    
    subscribe: (fn: Listener) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    
    toggleCollapsed: () => {
      state = { ...state, collapsed: !state.collapsed };
      listeners.forEach(fn => fn(state));
    },
  };
}
```

#### 互斥断点检测
```typescript
// media.ts
import type { Breakpoints, ActiveBreakpoint } from '@openlayout/type';

interface MediaResult {
  getBreakpoint: () => ActiveBreakpoint;
  subscribe: (callback: (breakpoint: ActiveBreakpoint) => void) => () => void;
}

export function createMedia(breakpoints: Breakpoints): MediaResult {
  function isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // 构建互斥断点区间（无重叠，无空隙）
  function buildQueries(bp: Breakpoints) {
    const keys = Object.keys(bp)
      .filter(k => bp[k] !== undefined)
      .sort((a, b) => bp[a]! - bp[b]!);
    
    // 添加 sentinel 键用于 SSR fallback
    const withSentinel = [':desktop', ...keys];
    
    return withSentinel.map((key, index) => {
      const value = bp[key === ':desktop' ? keys[keys.length - 1]! : key];
      const isFirst = index === 0;
      const isLast = index === withSentinel.length - 1;
      
      let query: string;
      if (isFirst) {
        // xs 及以下
        query = `(max-width: ${value}px)`;
      } else if (isLast) {
        // 最大断点以上
        query = `(min-width: ${value}px)`;
      } else {
        // 中间区间
        const prevKey = withSentinel[index - 1];
        const prevValue = bp[prevKey === ':desktop' ? keys[keys.length - 1]! : prevKey!]!;
        query = `(min-width: ${prevValue + 1}px) and (max-width: ${value}px)`;
      }
      
      return { key: key === ':desktop' ? keys[keys.length - 1]! : key, query };
    });
  }

  let queries: { key: string; mql: MediaQueryList }[] | null = null;
  let currentBreakpoint: ActiveBreakpoint = null;

  const initQueries = () => {
    if (queries || !isBrowser()) return;
    
    const sorted = Object.keys(breakpoints).sort((a, b) => breakpoints[a]! - breakpoints[b]!);
    const largest = sorted[sorted.length - 1];
    
    // 初始计算当前断点
    for (const key of sorted) {
      const mql = window.matchMedia(`(max-width: ${breakpoints[key]!}px)`);
      if (mql.matches) {
        currentBreakpoint = key;
        break;
      }
    }
    if (!currentBreakpoint) {
      currentBreakpoint = largest;
    }

    queries = buildQueries(breakpoints).map(({ key, query }) => ({
      key,
      mql: window.matchMedia(query),
    }));
  };

  return {
    getBreakpoint: (): ActiveBreakpoint => {
      initQueries();
      // SSR fallback：返回最大断点
      if (!queries) {
        const sorted = Object.keys(breakpoints).sort((a, b) => breakpoints[a]! - breakpoints[b]!);
        return sorted[sorted.length - 1] || null;
      }
      return currentBreakpoint;
    },
    subscribe: (callback: (breakpoint: ActiveBreakpoint) => void) => {
      initQueries();
      if (!queries) return () => {};
      
      const handler = (e: MediaQueryListEvent) => {
        if (e.matches) {
          const matched = queries!.find(q => q.mql === e.media);
          if (matched) {
            currentBreakpoint = matched.key;
            callback(currentBreakpoint);
          }
        }
      };
      
      queries.forEach(({ mql }) => mql.addEventListener('change', handler));
      return () => queries!.forEach(({ mql }) => mql.removeEventListener('change', handler));
    },
  };
}
```

#### 布局计算
```typescript
// layout.ts
import type { LayoutConfig, LayoutState, LayoutSize, LayoutSizeValue } from '@openlayout/type';

// Core 层仅输出尺寸信息，不泄漏 UI 实现细节
export interface LayoutDimensions {
  header: LayoutSize;
  footer: LayoutSize;
  aside: LayoutSize;
}

// 校验并规范化尺寸配置
function normalizeSize(value?: LayoutSizeValue): LayoutSize {
  if (value === undefined) return {};
  
  let size: LayoutSize;
  if (typeof value === 'number') {
    size = { min: value, max: value };
  } else {
    size = { ...value };
  }
  
  // 负值保护
  if (size.min !== undefined && size.min < 0) size.min = 0;
  if (size.max !== undefined && size.max < 0) size.max = 0;
  
  // min > max 修正
  if (size.min !== undefined && size.max !== undefined && size.min > size.max) {
    [size.min, size.max] = [size.max, size.min!];
  }
  
  // 默认值
  if (size.min === undefined) size.min = 0;
  if (size.max === undefined) size.max = size.min;
  
  return size;
}

export function createLayout(
  config: LayoutConfig,
  state: LayoutState
): LayoutDimensions {
  const header = normalizeSize(config.sizes.header);
  const footer = normalizeSize(config.sizes.footer);
  const aside = normalizeSize(config.sizes.aside);
  
  // 根据断点判断是否移动端（可由外部配置阈值）
  const breakpointValues = Object.values(config.breakpoints);
  const isMobile = state.activeBreakpoint && 
    config.breakpoints[state.activeBreakpoint] !== undefined &&
    breakpointValues.indexOf(config.breakpoints[state.activeBreakpoint]!) === 0;
  
  // 计算 aside 实际宽度
  let asideWidth = aside.min;
  if (isMobile) {
    asideWidth = 0; // 移动端隐藏侧边栏
  } else if (state.collapsed) {
    asideWidth = 0; // 折叠状态
  }
  
  return {
    header: { min: header.min, max: header.max },
    footer: { min: footer.min, max: footer.max },
    aside: { min: asideWidth, max: aside.max },
  };
}
```

#### CSS 变量注入
```typescript
// inject.ts
import type { LayoutSizes, LayoutSizeValue } from '@openlayout/type';

function normalize(v?: LayoutSizeValue): LayoutSize {
  if (!v) return { min: 0, max: 0 };
  return typeof v === 'number' ? { min: v, max: v } : v;
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

  if (typeof document !== 'undefined') {
    const id = 'od-layout-variables';
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement('style');
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
@openlayout/type       # 类型层（TypeScript 类型定义）
@openlayout/config     # 配置层（默认布局配置）
@openlayout/core       # 核心层（State + Media + Layout + Inject）
@openlayout/react      # React 适配器（后续开发）
@openlayout/vue        # Vue 3 适配器（后续开发）
```

---

## 4. 验收标准

- [ ] `@openlayout/type` 提供完整 TypeScript 类型定义
- [ ] `@openlayout/config` 提供默认配置
- [ ] `@openlayout/core` 可在 Node.js 环境运行
- [ ] 断点系统为互斥模型，保证同时只有一个 active breakpoint
- [ ] 断点区间无重叠、无空隙
- [ ] SSR fallback 使用最大断点而非硬编码
- [ ] Core 层不泄漏 UI 实现细节（定位、边距等）
- [ ] 状态管理为不可变（Immutable）
- [ ] 尺寸计算包含完整的校验逻辑（负值、min>max）
