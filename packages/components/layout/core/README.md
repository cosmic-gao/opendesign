# @openlayout/core

> 布局核心 - 响应式断点、状态管理、样式生成

## 安装

```bash
pnpm add @openlayout/core
```

## 依赖

```bash
pnpm add @openlayout/config
```

## API

### createResponsive

创建响应式状态，监听窗口变化。

```typescript
import { createResponsive } from '@openlayout/core';

const responsive = createResponsive({
  breakpoints: { md: 768, lg: 992 },
  mobileBreakpoint: 768,
});

console.log(responsive.breakpoint);  // 'xxl'
console.log(responsive.width);         // 1400
console.log(responsive.isMobile);     // false
console.log(responsive.isAbove('md')); // true
console.log(responsive.isBelow('lg')); // false
```

**参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| config | `Partial<LayoutConfig>` | - | 布局配置，支持 breakpoints 和 mobileBreakpoint |

**返回值 - ResponsiveState：**

| 属性 | 类型 | 说明 |
|------|------|------|
| breakpoint | `Breakpoint` | 当前断点 |
| breakpoints | `Breakpoints` | 断点配置 |
| width | `number` | 当前窗口宽度 |
| isAbove | `(bp: Breakpoint) => boolean` | 是否大于等于指定断点 |
| isBelow | `(bp: Breakpoint) => boolean` | 是否小于指定断点 |
| isMobile | `boolean` | 是否移动端 |

---

### createLayoutState

根据配置创建布局状态。

```typescript
import { createLayoutState } from '@openlayout/core';

const state = createLayoutState({
  header: { enabled: true, height: 64, fixed: true, full: true },
  footer: { enabled: false, height: 48 },
  sidebar: { enabled: true, width: 200, min: 80, collapsed: false, overlay: true },
  content: { enabled: true, scrollable: true },
});

console.log(state.header.visible);   // true
console.log(state.sidebar.width);   // 200
console.log(state.sidebar.collapsed); // false
```

**参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| config | `Partial<LayoutConfig>` | - | 布局配置 |

**返回值 - LayoutState：**

```typescript
interface LayoutState {
  header: { visible: boolean; fixed: boolean; height: number; full: boolean };
  footer: { visible: boolean; fixed: boolean; height: number; full: boolean };
  sidebar: { visible: boolean; width: number; min: number; collapsed: boolean; overlay: boolean; full: boolean };
  content: { visible: boolean; scrollable: boolean };
}
```

---

### createStylesheet

根据配置和状态生成 CSS 样式对象。

```typescript
import { createStylesheet } from '@openlayout/core';

const styles = createStylesheet(
  { animation: { enabled: true, duration: 200, easing: 'ease' } },
  state,
  responsive,
  false  // sidebarCollapsed
);

console.log(styles.root);
console.log(styles.header);
console.log(styles.sidebar);
console.log(styles.cssVariables);
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| config | `Partial<LayoutConfig>` | 布局配置 |
| state | `LayoutState` | 布局状态 |
| responsive | `ResponsiveState` | 响应式状态 |
| sidebarCollapsed | `boolean` | 侧边栏是否折叠（可选） |

**返回值 - LayoutStyles：**

```typescript
interface LayoutStyles {
  root: Record<string, string>;
  header: Record<string, string>;
  footer: Record<string, string>;
  sidebar: Record<string, string>;
  content: Record<string, string>;
  cssVariables: Record<string, string>;
}
```

---

## 使用示例

```typescript
import { createResponsive, createLayoutState, createStylesheet } from '@openlayout/core';
import type { LayoutConfig } from '@openlayout/config';

const config: Partial<LayoutConfig> = {
  header: { enabled: true, height: 64, fixed: true },
  footer: { enabled: true, height: 48 },
  sidebar: { enabled: true, width: 200, collapsed: false, overlay: true },
  content: { enabled: true, scrollable: true },
  breakpoints: { md: 768, lg: 992 },
  mobileBreakpoint: 768,
};

// 创建响应式状态
const responsive = createResponsive(config);

// 创建布局状态
const state = createLayoutState(config);

// 生成样式
const styles = createStylesheet(config, state, responsive, false);

// 应用样式
Object.assign(container.style, styles.root);
Object.assign(header.style, styles.header);
Object.assign(sidebar.style, styles.sidebar);
Object.assign(content.style, styles.content);
```

## CSS 变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--od-header-height` | 64px | 头部高度 |
| `--od-footer-height` | 48px | 底部高度 |
| `--od-sidebar-width` | 200px | 侧边栏宽度 |
| `--od-sidebar-min-width` | 80px | 侧边栏最小宽度 |
| `--od-animation-enabled` | 1 | 是否启用动画 |
| `--od-animation-duration` | 200ms | 动画时长 |
| `--od-animation-easing` | ease | 动画缓动函数 |
| `--od-breakpoint` | - | 当前断点 |
| `--od-is-mobile` | 0/1 | 是否移动端 |

## License

MIT
