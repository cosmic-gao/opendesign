# @openlayout/core

OpenDesign Layout 核心包，提供状态管理、断点检测、布局计算和 CSS 变量注入功能。

## 安装

```bash
npm install @openlayout/core
```

## API

### createState

创建状态管理器。

```typescript
import { createState } from '@openlayout/core';
import { defaultConfig } from '@openlayout/config';

const state = createState(defaultConfig);

// 获取状态
const { collapsed, activeBreakpoint } = state.getState();

// 订阅状态变更
const unsubscribe = state.subscribe((newState) => {
  console.log('状态变更:', newState);
});

// 设置折叠状态
state.setCollapsed(true);

// 切换折叠状态
state.toggleCollapsed();

// 取消订阅
unsubscribe();
```

### createMedia

创建断点检测器。

```typescript
import { createMedia } from '@openlayout/core';

const media = createMedia({
  xs: 480,
  sm: 768,
  md: 1024,
});

// 获取当前断点
const breakpoint = media.getBreakpoint(); // 'md'

// 订阅断点变化
const unsubscribe = media.subscribe((newBreakpoint) => {
  console.log('断点变化:', newBreakpoint);
});

// 取消订阅
unsubscribe();
```

### createLayout

计算布局尺寸。

```typescript
import { createLayout } from '@openlayout/core';

const config = {
  mode: 'sidebar',
  defaultCollapsed: false,
  breakpoints: { xs: 480, sm: 768, md: 1024 },
  sizes: {
    header: 64,
    footer: 48,
    sidebar: 240,
  },
};

const state = {
  collapsed: false,
  activeBreakpoint: 'md',
};

const layout = createLayout(config, state);
// {
//   header: { min: 64, max: 64 },
//   footer: { min: 48, max: 48 },
//   sidebar: { min: 240, max: 240 }
// }
```

### inject

注入 CSS 变量。

```typescript
import { inject } from '@openlayout/core';

inject({
  header: 64,
  footer: 48,
  sidebar: 240,
});

// 生成的 CSS
// :root {
//   --od-header-height: 64px;
//   --od-footer-height: 48px;
//   --od-sidebar-width: 240px;
// }
```

支持 SSR 环境：

```typescript
import { inject } from '@openlayout/core';

// 传入自定义 document 对象
inject(sizes, customDocument);
```

## 尺寸配置

支持三种配置形式：

```typescript
// 固定值
header: 64

// 范围
header: { min: 48, max: 120 }

// 自动撑开
header: 'auto'
// 或
header: { auto: true }
```

## SSR 支持

所有 API 都支持 SSR 环境：

- `createState` - 纯逻辑，无 DOM 依赖
- `createMedia` - SSR 时返回最大断点
- `createLayout` - 纯逻辑计算
- `inject` - 可传入自定义 document 对象
