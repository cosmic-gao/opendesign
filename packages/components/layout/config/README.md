# @openlayout/config

> 布局配置管理包 - 轻量级、无框架依赖的响应式布局配置解决方案

## 特性

- **框架无关** - 纯 TypeScript 实现，可与 React、Vue、Svelte 等任何框架配合使用
- **泛型适配** - 通过泛型参数，上层框架传入自己的 VNode 和 CSSProperties 类型
- **零依赖** - 不依赖任何外部库，最小化包体积
- **类型安全** - 完整的 TypeScript 类型定义
- **响应式** - 内置 6 个响应式断点配置
- **可验证** - 提供配置验证功能，确保参数合法
- **可合并** - 支持浅合并和深度合并

## 安装

```bash
pnpm add @openlayout/config
```

## 快速开始

```typescript
import { merge, validate } from '@openlayout/config';
import type { CSSProperties as ReactCSSProperties } from 'react';

// 1. 定义布局配置（传入 React 类型）
const config = merge<React.ReactElement, ReactCSSProperties>({
  header: { fixed: true, height: 64 },
  sidebar: { collapsed: false, width: 240 },
  breakpoints: { lg: 1024 }
});

// 2. 验证配置
const result = validate<React.ReactElement, ReactCSSProperties>({
  header: { height: 200 },
  animation: { duration: -10 }
});

if (!result.valid) {
  console.log(result.errors);
}
```

## 核心概念

### 泛型设计

Config 包使用泛型让上层框架自行适配 VNode 和 CSSProperties 类型：

```typescript
// LayoutProps 泛型签名
interface LayoutProps<VNode, CSSProperties> {
  header?: HeaderConfig;
  footer?: FooterConfig;
  sidebar?: SidebarConfig;
  content?: ContentConfig;
  breakpoints?: Breakpoints;
  mobileBreakpoint?: number;
  animation?: AnimationConfig;
  style?: CSSProperties;
  children?: VNode;
}
```

### 配置合并

使用 `merge()` 函数将用户配置与默认配置合并：

```typescript
// 浅合并（默认）
merge<VNode, CSSProperties>(props)

// 深度合并 - 嵌套对象完全合并
merge<VNode, CSSProperties>(props, { deep: true })
```

### 配置验证

使用 `validate()` 函数验证配置合法性：

```typescript
const result = validate<VNode, CSSProperties>(props);

if (!result.valid) {
  // 处理错误
  result.errors.forEach(err => {
    console.log(`${err.field}: ${err.message}`);
  });
}
```

## API 参考

### merge<VNode, CSSProperties>(props, options?)

合并用户配置与默认配置。

**泛型参数**:
- `VNode` - 框架的 VNode 类型
- `CSSProperties` - 框架的 CSS 属性类型

**参数**:
- `props: LayoutProps<VNode, CSSProperties>` - 用户配置
- `options?: { deep?: boolean }` - 合并选项

**返回**: `LayoutConfig`

```typescript
// 浅合并
const config = merge<React.ReactElement, React.CSSProperties>(
  { header: { fixed: true } }
);

// 深度合并
const config = merge<React.ReactElement, React.CSSProperties>(
  { breakpoints: { lg: 1000 } },
  { deep: true }
);
```

### validate<VNode, CSSProperties>(props)

验证布局配置。

**泛型参数**:
- `VNode` - 框架的 VNode 类型
- `CSSProperties` - 框架的 CSS 属性类型

**参数**:
- `props: LayoutProps<VNode, CSSProperties>` - 要验证的配置

**返回**: `ValidationResult`

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}
```

### LayoutConfig

最终配置类型，所有字段都是必需的：

```typescript
interface LayoutConfig {
  header: HeaderConfig;
  footer: FooterConfig;
  sidebar: SidebarConfig;
  content: ContentConfig;
  breakpoints: Breakpoints;
  mobileBreakpoint: number;
  animation: AnimationConfig;
}
```

### 默认配置

| 配置项 | 默认值 |
|--------|--------|
| 断点 | xs:480, sm:576, md:768, lg:992, xl:1200, xxl:1400 |
| 移动端断点 | 768px |
| Header | height: 64px, fixed: false |
| Footer | height: 48px, fixed: false |
| Sidebar | width: 200px, min: 80px |
| Animation | duration: 200ms, easing: 'ease' |

## 验证规则

| 字段 | 规则 |
|------|------|
| header/footer.height | 1 - 10000 |
| sidebar.width | 1 - 10000 |
| sidebar.min | 1 - 10000，且 <= width |
| animation.duration | >= 0 |
| animation.easing | CSS 缓动关键字或 cubic-bezier()/steps() |
| breakpoints.{key} | > 0 |
| breakpoints | 升序排列 |
| mobileBreakpoint | 必须匹配某个断点值 |

## 导出列表

```typescript
// 类型
export type { Breakpoint, Breakpoints, CSSProperties, VNode, ElementType }
export type { LayoutConfig, LayoutProps }
export type { HeaderConfig, HeaderProps }
export type { FooterConfig, FooterProps }
export type { SidebarConfig, SidebarProps }
export type { ContentConfig, ContentProps }
export type { AnimationConfig }
export type { MergeOptions }
export type { ValidationError, ValidationResult }

// 函数
export { merge, validate }

// 常量
export { DEFAULT_BREAKPOINTS, DEFAULT_MOBILE_BREAKPOINT }
export { DEFAULT_ANIMATION, DEFAULT_HEADER, DEFAULT_FOOTER, DEFAULT_SIDEBAR, DEFAULT_CONTENT }
```

## 使用场景

### 与 React 配合

```tsx
import { merge } from '@openlayout/config';

function Layout({ config }) {
  const merged = merge<React.ReactElement, React.CSSProperties>(config);

  return (
    <div style={{ height: '100vh' }}>
      {merged.header.enabled && <Header style={{ height: merged.header.height }} />}
      <div style={{ display: 'flex' }}>
        {merged.sidebar.enabled && <Sidebar width={merged.sidebar.width} />}
        <Content>{merged.content.scrollable ? '可滚动' : '固定'}</Content>
      </div>
      {merged.footer.enabled && <Footer style={{ height: merged.footer.height }} />}
    </div>
  );
}
```

### 与 Vue 配合

```vue
<script setup lang="ts">
import { merge } from '@openlayout/config';
import type { CSSProperties } from '@vue/runtime-core';

const props = defineProps<{
  config: LayoutProps<VNode, CSSProperties>
}>();

const merged = merge<VNode, CSSProperties>(props.config);
</script>

<template>
  <div class="layout">
    <header v-if="merged.header.enabled" :style="{ height: merged.header.height + 'px' }">
      Header
    </header>
    <!-- ... -->
  </div>
</template>
```

## License

MIT
