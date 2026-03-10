# @openlayout/core

> 布局逻辑层 - 断点计算、样式生成、状态管理

## 安装

```bash
pnpm add @openlayout/core
```

## 功能

### createResponsive

创建响应式断点监听器。

```typescript
import { createResponsive } from '@openlayout/core';

const { breakpoint, isMobile, isAbove, isBelow } = createResponsive({
  breakpoints: { md: 768 },
  mobileBreakpoint: 768,
});

console.log(breakpoint); // 'lg'
console.log(isMobile);   // false
console.log(isAbove('md')); // true
console.log(isBelow('lg')); // false
```

**参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| breakpoints | `Partial<Breakpoints>` | DEFAULT_BREAKPOINTS | 断点配置 |
| mobileBreakpoint | `number` | 768 | 移动端断点阈值 |
| onChange | `(breakpoint: Breakpoint) => void` | - | 断点变化回调 |

**返回值：**

| 属性 | 类型 | 说明 |
|------|------|------|
| breakpoint | `Breakpoint` | 当前断点 |
| isMobile | `boolean` | 是否移动端 |
| isAbove | `(bp: Breakpoint) => boolean` | 是否大于等于指定断点 |
| isBelow | `(bp: Breakpoint) => boolean` | 是否小于指定断点 |

### createStylesheet

生成布局样式。

```typescript
import { createStylesheet } from '@openlayout/core';

const styles = createStylesheet({
  config: {
    header: { height: 64, fixed: true },
    sidebar: { width: 200, collapsible: true },
  },
  breakpoint: 'lg',
  isMobile: false,
  collapsed: false,
});

console.log(styles.root);
console.log(styles.header);
console.log(styles.sidebar);
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| config | `LayoutConfig` | 布局配置 |
| breakpoint | `Breakpoint` | 当前断点 |
| isMobile | `boolean` | 是否移动端 |
| collapsed | `boolean` | 侧边栏是否折叠 |

**返回值：**

```typescript
interface LayoutStyles {
  root: Record<string, string | number>;
  header: Record<string, string | number>;
  footer: Record<string, string | number>;
  sidebar: Record<string, string | number>;
  content: Record<string, string | number>;
  cssVariables: Record<string, string | number>;
}
```

### createStore

创建布局状态仓库。

```typescript
import { createStore } from '@openlayout/core';

const { state, actions } = createStore({
  sidebar: { defaultCollapsed: true, width: 200 },
  header: { height: 64, fixed: false },
  footer: { height: 48 },
});

// 状态
console.log(state.sidebar.collapsed); // true

// 操作
actions.sidebar.toggle();
actions.sidebar.collapse();
actions.sidebar.expand();
actions.sidebar.show();
actions.sidebar.hide();
actions.sidebar.setCollapsed(false);
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| options | `UseLayoutStateOptions` | 初始配置 |

**返回值：**

```typescript
interface LayoutStore {
  state: LayoutState;
  actions: LayoutActions;
}
```

## CSS 变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--od-header-height` | 64 | 头部高度 |
| `--od-footer-height` | 48 | 底部高度 |
| `--od-sidebar-width` | 200 | 侧边栏宽度 |
| `--od-sidebar-collapsed-width` | 80 | 侧边栏折叠宽度 |
| `--od-animated` | 1 | 是否启用动画 |
| `--od-animation-duration` | 200 | 动画时长 |
| `--od-breakpoint` | - | 当前断点 |
| `--od-is-mobile` | 0/1 | 是否移动端 |

## License

MIT
