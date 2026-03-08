export const LAYOUT_DEFAULTS = {
  HEADER_HEIGHT: 64,
  FOOTER_HEIGHT: 48,
  SIDEBAR_WIDTH: 200,
  COLLAPSED_WIDTH: 80,

  DEFAULT_DIRECTION: 'vertical' as const,
  DEFAULT_COLLAPSED: false,
  DEFAULT_FIXED_HEADER: false,
  DEFAULT_FIXED_FOOTER: false,
  DEFAULT_SIDEBAR_FULL_HEIGHT: true,

  MOBILE_BREAKPOINT: 768,

  DEFAULT_ANIMATED: true,
  DEFAULT_ANIMATION_DURATION: 200,

  BREAKPOINTS: {
    xs: 480,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
  },
} as const;

export const BREAKPOINT_KEYS = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;
