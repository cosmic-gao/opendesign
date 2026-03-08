import { LAYOUT_DEFAULTS, type LayoutConfig, type ResponsiveConfig, type ThemeConfig, type AnimationConfig } from './constants';
import type { LayoutStore, Breakpoint } from './types';

export interface CreateLayoutOptions extends LayoutConfig, ResponsiveConfig, ThemeConfig, AnimationConfig {
  direction?: 'horizontal' | 'vertical';
}

export function createLayout(options: CreateLayoutOptions = {}): LayoutStore {
  let direction: 'horizontal' | 'vertical' = options.direction ?? LAYOUT_DEFAULTS.DEFAULT_DIRECTION;
  const headerHeight = options.header?.height ?? LAYOUT_DEFAULTS.HEADER_HEIGHT;
  const footerHeight = options.footer?.height ?? LAYOUT_DEFAULTS.FOOTER_HEIGHT;
  const sidebarWidth = options.sidebar?.width ?? LAYOUT_DEFAULTS.SIDEBAR_WIDTH;
  const collapsedWidth = options.sidebar?.collapsedWidth ?? LAYOUT_DEFAULTS.COLLAPSED_WIDTH;
  const headerFixed = options.header?.fixed ?? LAYOUT_DEFAULTS.DEFAULT_FIXED_HEADER;
  const footerFixed = options.footer?.fixed ?? LAYOUT_DEFAULTS.DEFAULT_FIXED_FOOTER;
  const sidebarFullHeight = options.sidebar?.fullHeight ?? LAYOUT_DEFAULTS.DEFAULT_SIDEBAR_FULL_HEIGHT;
  const defaultCollapsed = options.sidebar?.defaultCollapsed ?? LAYOUT_DEFAULTS.DEFAULT_COLLAPSED;
  const animated = options.animated ?? LAYOUT_DEFAULTS.DEFAULT_ANIMATED;
  const animationDuration = options.animationDuration ?? LAYOUT_DEFAULTS.DEFAULT_ANIMATION_DURATION;

  let _headerFixed = headerFixed;
  let _footerFixed = footerFixed;
  let _sidebarFullHeight = sidebarFullHeight;
  let _sidebarCollapsed = defaultCollapsed;
  let _sidebarVisible = true;
  let _headerVisible = true;
  let _footerVisible = true;
  let _contentScrollable = options.content?.scrollable ?? true;

  let _currentWidth = 0;
  let _breakpoint: Breakpoint = 'xxl';

  return {
    direction,
    headerHeight,
    footerHeight,
    sidebarWidth,
    collapsedWidth,
    get headerFixed() { return _headerFixed; },
    get footerFixed() { return _footerFixed; },
    get sidebarFullHeight() { return _sidebarFullHeight; },
    get sidebarCollapsed() { return _sidebarCollapsed; },
    get sidebarVisible() { return _sidebarVisible; },
    get headerVisible() { return _headerVisible; },
    get footerVisible() { return _footerVisible; },
    get contentScrollable() { return _contentScrollable; },
    get animated() { return animated; },
    get animationDuration() { return animationDuration; },
    get theme() { return options.theme ?? 'light'; },
    get breakpoints() { return options.breakpoints ?? LAYOUT_DEFAULTS.BREAKPOINTS; },
    get breakpoint(): Breakpoint { return _breakpoint; },
    get currentWidth() { return _currentWidth; },

    setDirection: (value) => { direction = value; },
    setHeaderHeight: () => {},
    setFooterHeight: () => {},
    setSidebarWidth: () => {},
    setCollapsedWidth: () => {},
    setHeaderFixed: (value) => { _headerFixed = value; },
    setFooterFixed: (value) => { _footerFixed = value; },
    setSidebarFullHeight: (value) => { _sidebarFullHeight = value; },
    setSidebarCollapsed: (value) => { _sidebarCollapsed = value; },
    setSidebarVisible: (value) => { _sidebarVisible = value; },
    setHeaderVisible: (value) => { _headerVisible = value; },
    setFooterVisible: (value) => { _footerVisible = value; },
    setContentScrollable: (value) => { _contentScrollable = value; },
    setWidth: (width: number) => {
      _currentWidth = width;
      const bp = options.breakpoints ?? LAYOUT_DEFAULTS.BREAKPOINTS;
      if (width < (bp.xs ?? 480)) _breakpoint = 'xs';
      else if (width < (bp.sm ?? 576)) _breakpoint = 'sm';
      else if (width < (bp.md ?? 768)) _breakpoint = 'md';
      else if (width < (bp.lg ?? 992)) _breakpoint = 'lg';
      else if (width < (bp.xl ?? 1200)) _breakpoint = 'xl';
      else _breakpoint = 'xxl';
    },
  };
}
