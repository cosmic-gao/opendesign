import type { LayoutConfig, Breakpoint, Breakpoints } from '@openlayout/config';
import { DEFAULT_BREAKPOINTS, DEFAULT_SIZES, DEFAULT_Z_INDEX, BREAKPOINT_ORDER } from '@openlayout/config';

export type { Breakpoint, Breakpoints } from '@openlayout/config';
export type { HeaderConfig, FooterConfig, SidebarConfig, ContentConfig, AnimationConfig } from '@openlayout/config';

export interface ResponsiveState {
  breakpoint: Breakpoint;
  breakpoints: Breakpoints;
  width: number;
  isAbove: (bp: Breakpoint) => boolean;
  isBelow: (bp: Breakpoint) => boolean;
  isMobile: boolean;
}

export interface LayoutState {
  header: { visible: boolean; fixed: boolean; height: number; full: boolean };
  footer: { visible: boolean; fixed: boolean; height: number; full: boolean };
  sidebar: { visible: boolean; width: number; min: number; collapsed: boolean; overlay: boolean; full: boolean };
  content: { visible: boolean; scrollable: boolean };
}

export interface LayoutStyles {
  root: Record<string, string>;
  header: Record<string, string>;
  footer: Record<string, string>;
  sidebar: Record<string, string>;
  content: Record<string, string>;
  variables: Record<string, string>;
  cssVariables: Record<string, string>;
}

type GlobalThis = typeof globalThis;

function getEnv<T, K extends keyof GlobalThis>(key: K): T | undefined {
  if (typeof window === 'undefined') return undefined;
  return window[key] as T | undefined;
}

function getWindowWidth(): number {
  return getEnv<number, 'innerWidth'>('innerWidth') ?? Infinity;
}

function getBreakpoint(width: number, breakpoints: Breakpoints): Breakpoint {
  const defaultValue = (bp: Breakpoint) => breakpoints[bp] ?? DEFAULT_BREAKPOINTS[bp] ?? Infinity;
  return BREAKPOINT_ORDER.find((bp) => width < defaultValue(bp)) ?? 'xxl';
}

export function createResponsive(config?: Partial<LayoutConfig>): ResponsiveState {
  const breakpoints: Breakpoints = { ...DEFAULT_BREAKPOINTS, ...config?.breakpoints };
  const mobileBp = config?.mobileBreakpoint ?? breakpoints.md ?? 768;
  const width = getWindowWidth();

  return {
    breakpoint: getBreakpoint(width, breakpoints),
    breakpoints,
    width,
    isAbove: (bp: Breakpoint) => {
      const w = getWindowWidth();
      const v = breakpoints[bp];
      return v === undefined ? true : w >= v;
    },
    isBelow: (bp: Breakpoint) => {
      const w = getWindowWidth();
      const v = breakpoints[bp];
      return v === undefined ? false : w < v;
    },
    isMobile: width < mobileBp,
  };
}

export function createStore(config?: Partial<LayoutConfig>): LayoutState {
  const { header: h, footer: f, sidebar: s, content: c } = config ?? {};

  return {
    header: {
      visible: h?.enabled ?? true,
      fixed: h?.fixed ?? false,
      height: h?.height ?? DEFAULT_SIZES.HEADER_HEIGHT,
      full: h?.full ?? false,
    },
    footer: {
      visible: f?.enabled ?? true,
      fixed: f?.fixed ?? false,
      height: f?.height ?? DEFAULT_SIZES.FOOTER_HEIGHT,
      full: f?.full ?? false,
    },
    sidebar: {
      visible: s?.enabled ?? true,
      width: s?.width ?? DEFAULT_SIZES.SIDEBAR_WIDTH,
      min: s?.min ?? DEFAULT_SIZES.SIDEBAR_MIN_WIDTH,
      collapsed: s?.collapsed ?? false,
      overlay: s?.overlay ?? false,
      full: s?.full ?? false,
    },
    content: {
      visible: c?.enabled ?? true,
      scrollable: c?.scrollable ?? true,
    },
  };
}

function makeStyle(position: 'top' | 'bottom', zIndex: number): Record<string, string> {
  return { position: 'fixed', [position]: '0', left: '0', right: '0', zIndex: String(zIndex) };
}

export function createStylesheet(
  config: Partial<LayoutConfig>,
  state: LayoutState,
  responsive: ResponsiveState,
  sidebarCollapsed?: boolean
): LayoutStyles {
  const { header: h, footer: f, sidebar: s, content: c } = state;
  const { isMobile, breakpoint } = responsive;
  const collapsed = sidebarCollapsed ?? s.collapsed;
  const anim = config.animation ?? { enabled: true, duration: 200, easing: 'ease' };
  const enabled = anim.enabled !== false;
  const duration = anim.duration ?? 200;
  const easing = anim.easing ?? 'ease';

  const width = collapsed ? s.min : s.width;
  const overlay = s.overlay || isMobile;

  const variables: Record<string, string> = {
    '--od-header-height': `${h.height}px`,
    '--od-footer-height': `${f.height}px`,
    '--od-sidebar-width': `${width}px`,
    '--od-sidebar-min-width': `${s.min}px`,
    '--od-animation-enabled': enabled ? '1' : '0',
    '--od-animation-duration': `${duration}ms`,
    '--od-animation-easing': easing,
    '--od-breakpoint': breakpoint,
    '--od-is-mobile': isMobile ? '1' : '0',
  };

  const root: Record<string, string> = { display: 'flex', flexDirection: 'column', minHeight: '100vh', ...variables };

  const header: Record<string, string> = { flexShrink: '0', height: `${h.height}px` };
  if (h.fixed) Object.assign(header, makeStyle('top', DEFAULT_Z_INDEX.HEADER_FIXED));
  if (h.full) header.width = '100%';

  const footer: Record<string, string> = { flexShrink: '0', height: `${f.height}px` };
  if (f.fixed) Object.assign(footer, makeStyle('bottom', DEFAULT_Z_INDEX.FOOTER_FIXED));
  if (f.full) footer.width = '100%';

  const sidebar: Record<string, string> = {
    flexShrink: '0',
    width: `${width}px`,
    transition: `width var(--od-animation-duration, ${duration}ms) ${easing}`,
  };
  if (s.full) sidebar.height = '100%';
  if (overlay) Object.assign(sidebar, { position: 'fixed', zIndex: String(DEFAULT_Z_INDEX.SIDEBAR_OVERLAY) });

  const content: Record<string, string> = { flex: '1', minWidth: '0' };
  if (c.scrollable) content.overflow = 'auto';

  return { root, header, footer, sidebar, content, variables, cssVariables: variables };
}
