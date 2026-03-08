import type { Breakpoints } from './responsive';

export type Direction = 'horizontal' | 'vertical';

export interface HeaderConfig {
  height?: number;
  fixed?: boolean;
  fullWidth?: boolean;
}

export interface FooterConfig {
  height?: number;
  fixed?: boolean;
  fullWidth?: boolean;
}

export interface SidebarConfig {
  width?: number;
  collapsedWidth?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  fullHeight?: boolean;
  overlay?: boolean;
}

export interface ContentConfig {
  scrollable?: boolean;
}

export interface ResponsiveConfig {
  breakpoints?: Breakpoints;
  mobileBreakpoint?: number;
  onBreakpointChange?: (breakpoint: string) => void;
}

export interface ThemeConfig {
  theme?: 'light' | 'dark' | 'system';
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

export interface AnimationConfig {
  animated?: boolean;
  animationDuration?: number;
}

export interface LayoutConfig {
  header?: HeaderConfig;
  footer?: FooterConfig;
  sidebar?: SidebarConfig;
  content?: ContentConfig;
}

export type LayoutProps = LayoutConfig &
  ResponsiveConfig &
  ThemeConfig &
  AnimationConfig & {
    as?: string;
    className?: string;
    style?: Record<string, string | number>;
    children?: unknown;
  };

export type HeaderProps = {
  as?: string;
  className?: string;
  style?: Record<string, string | number>;
  children?: unknown;
  height?: number;
  fixed?: boolean;
  fullWidth?: boolean;
};

export type FooterProps = {
  as?: string;
  className?: string;
  style?: Record<string, string | number>;
  children?: unknown;
  height?: number;
  fixed?: boolean;
  fullWidth?: boolean;
};

export type SidebarProps = {
  as?: string;
  className?: string;
  style?: Record<string, string | number>;
  children?: unknown;
  collapsible?: boolean;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  fullHeight?: boolean;
  overlay?: boolean;
  width?: number;
  collapsedWidth?: number;
  visible?: boolean;
};

export type ContentProps = {
  as?: string;
  className?: string;
  style?: Record<string, string | number>;
  children?: unknown;
  scrollable?: boolean;
};
