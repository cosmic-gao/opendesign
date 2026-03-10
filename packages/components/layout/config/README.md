# @openlayout/config

> Layout 配置与类型定义

## 安装

```bash
pnpm add @openlayout/config
```

## 类型

### Breakpoint

```typescript
type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
```

### Breakpoints

```typescript
interface Breakpoints {
  xs?: number;   // 默认 480
  sm?: number;   // 默认 576
  md?: number;   // 默认 768
  lg?: number;   // 默认 992
  xl?: number;   // 默认 1200
  xxl?: number;  // 默认 1400
}
```

### LayoutProps

```typescript
interface LayoutProps {
  header?: HeaderConfig;
  footer?: FooterConfig;
  sidebar?: SidebarConfig;
  content?: ContentConfig;
  breakpoints?: Breakpoints;
  mobileBreakpoint?: number;
  animated?: boolean;
  animationDuration?: number;
  theme?: ThemeMode;
  onBreakpointChange?: (breakpoint: Breakpoint, width: number) => void;
  onThemeChange?: (theme: Exclude<ThemeMode, 'system'>) => void;
  className?: string;
  style?: Record<string, string | number>;
}
```

### HeaderProps

```typescript
interface HeaderProps {
  fixed?: boolean;
  fullWidth?: boolean;
  height?: number;
  as?: ElementType;
  className?: string;
  style?: Record<string, string | number>;
  children?: ReactNode;
}
```

### FooterProps

```typescript
interface FooterProps {
  fixed?: boolean;
  fullWidth?: boolean;
  height?: number;
  as?: ElementType;
  className?: string;
  style?: Record<string, string | number>;
  children?: ReactNode;
}
```

### SidebarProps

```typescript
interface SidebarProps {
  collapsible?: boolean;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  fullHeight?: boolean;
  overlay?: boolean;
  width?: number;
  collapsedWidth?: number;
  as?: ElementType;
  className?: string;
  style?: Record<string, string | number>;
  children?: ReactNode;
}
```

### ContentProps

```typescript
interface ContentProps {
  scrollable?: boolean;
  as?: ElementType;
  className?: string;
  style?: Record<string, string | number>;
  children?: ReactNode;
}
```

## 常量

### DEFAULT_BREAKPOINTS

默认断点配置：

```typescript
{
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
}
```

## License

MIT
