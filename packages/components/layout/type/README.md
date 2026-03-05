# @openlayout/type

OpenDesign Layout 类型定义包。

## 安装

```bash
npm install @openlayout/type
```

## 类型

### LayoutMode

布局模式。

```typescript
type LayoutMode = 'sidebar' | 'top' | 'mixed';
```

### Breakpoints

响应式断点配置。

```typescript
interface Breakpoints {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  [key: string]: number | undefined;
}
```

### LayoutSize

单个区域的大小配置。

```typescript
interface LayoutSize {
  min?: number;
  max?: number;
  auto?: boolean;
}
```

### LayoutSizeValue

尺寸值的简写形式。

```typescript
type LayoutSizeValue = number | LayoutSize | 'auto';
```

### LayoutSizes

布局尺寸配置。

```typescript
interface LayoutSizes {
  header?: LayoutSizeValue;
  footer?: LayoutSizeValue;
  sidebar?: LayoutSizeValue;
}
```

### LayoutConfig

布局配置。

```typescript
interface LayoutConfig {
  mode: LayoutMode;
  defaultCollapsed: boolean;
  breakpoints: Breakpoints;
  sizes: LayoutSizes;
}
```

### LayoutState

布局状态。

```typescript
interface LayoutState {
  collapsed: boolean;
  activeBreakpoint: string | null;
}
```
