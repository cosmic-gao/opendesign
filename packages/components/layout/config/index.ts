export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export const BREAKPOINT_ORDER: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];

export interface Breakpoints {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  xxl?: number;
}

export const DEFAULT_BREAKPOINTS: Breakpoints = Object.freeze({
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
});

export const DEFAULT_SIZES = Object.freeze({
  HEADER_HEIGHT: 64,
  FOOTER_HEIGHT: 48,
  SIDEBAR_WIDTH: 200,
  SIDEBAR_MIN_WIDTH: 80,
});

export const DEFAULT_Z_INDEX = Object.freeze({
  HEADER_FIXED: 1000,
  FOOTER_FIXED: 1000,
  SIDEBAR_OVERLAY: 1001,
});

export interface VisibilityConfig {
  enabled?: boolean;
  full?: boolean;
}

export interface FixedConfig {
  fixed?: boolean;
}

export interface SizeConfig {
  height?: number;
}

export interface WidthConfig {
  width?: number;
  min?: number;
}

export interface HeaderConfig extends VisibilityConfig, FixedConfig, SizeConfig {}

export interface FooterConfig extends VisibilityConfig, FixedConfig, SizeConfig {}

export interface SidebarConfig extends VisibilityConfig, WidthConfig {
  collapsible?: boolean;
  collapsed?: boolean;
  overlay?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export interface ContentConfig {
  enabled?: boolean;
  scrollable?: boolean;
}

export type EasingType = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | string;

export interface AnimationConfig {
  enabled?: boolean;
  duration?: number;
  easing?: EasingType;
}

export interface LayoutConfig {
  header?: HeaderConfig;
  footer?: FooterConfig;
  sidebar?: SidebarConfig;
  content?: ContentConfig;
  breakpoints?: Breakpoints;
  mobileBreakpoint?: number;
  animation?: AnimationConfig;
  onBreakpointChange?: (breakpoint: Breakpoint, width: number) => void;
}
