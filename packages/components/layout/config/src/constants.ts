import type { Breakpoints } from './types';

export const DEFAULT_BREAKPOINTS: Breakpoints = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
};

export const DEFAULT_MOBILE_BREAKPOINT = 768;

export const DEFAULT_ANIMATION = {
  enabled: true,
  duration: 200,
  easing: 'ease',
} as const;

export const DEFAULT_HEADER = {
  enabled: true,
  height: 64,
  fixed: false,
  full: false,
} as const;

export const DEFAULT_FOOTER = {
  enabled: true,
  height: 48,
  fixed: false,
  full: false,
} as const;

export const DEFAULT_SIDEBAR = {
  enabled: true,
  width: 200,
  min: 80,
  collapsible: false,
  collapsed: false,
  full: true,
  overlay: false,
} as const;

export const DEFAULT_CONTENT = {
  enabled: true,
  scrollable: true,
} as const;
