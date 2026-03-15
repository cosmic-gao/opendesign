import type { LayoutConfig, Breakpoint, Breakpoints } from '@openlayout/config';
import { DEFAULT_BREAKPOINTS, DEFAULT_SIZES, DEFAULT_Z_INDEX } from '@openlayout/config';

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
  const breakpointEntries: Array<{ bp: Breakpoint; v: number }> = [
    { bp: 'xs', v: breakpoints.xs ?? DEFAULT_BREAKPOINTS.xs ?? Infinity },
    { bp: 'sm', v: breakpoints.sm ?? DEFAULT_BREAKPOINTS.sm ?? Infinity },
    { bp: 'md', v: breakpoints.md ?? DEFAULT_BREAKPOINTS.md ?? Infinity },
    { bp: 'lg', v: breakpoints.lg ?? DEFAULT_BREAKPOINTS.lg ?? Infinity },
    { bp: 'xl', v: breakpoints.xl ?? DEFAULT_BREAKPOINTS.xl ?? Infinity },
    { bp: 'xxl', v: breakpoints.xxl ?? Infinity },
  ];
  for (const { bp, v } of breakpointEntries) {
    if (width < v) return bp;
  }
  return 'xxl';
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
  const hc = config?.header ?? {};
  const fc = config?.footer ?? {};
  const sc = config?.sidebar ?? {};
  const cc = config?.content ?? {};

  return {
    header: {
      visible: hc.enabled ?? true,
      fixed: hc.fixed ?? false,
      height: hc.height ?? DEFAULT_SIZES.HEADER_HEIGHT,
      full: hc.full ?? false,
    },
    footer: {
      visible: fc.enabled ?? true,
      fixed: fc.fixed ?? false,
      height: fc.height ?? DEFAULT_SIZES.FOOTER_HEIGHT,
      full: fc.full ?? false,
    },
    sidebar: {
      visible: sc.enabled ?? true,
      width: sc.width ?? DEFAULT_SIZES.SIDEBAR_WIDTH,
      min: sc.min ?? DEFAULT_SIZES.SIDEBAR_MIN_WIDTH,
      collapsed: sc.collapsed ?? false,
      overlay: sc.overlay ?? false,
      full: sc.full ?? false,
    },
    content: {
      visible: cc.enabled ?? true,
      scrollable: cc.scrollable ?? true,
    },
  };
}

export function createStylesheet(
  config: Partial<LayoutConfig>,
  state: LayoutState,
  responsive: ResponsiveState,
  sidebarCollapsed?: boolean
): LayoutStyles {
  const { header: hs, footer: fs, sidebar: ss, content: cs } = state;
  const { isMobile, breakpoint } = responsive;
  const collapsed = sidebarCollapsed ?? ss.collapsed;
  const anim = config.animation ?? { enabled: true, duration: 200, easing: 'ease' };

  const cssVariables: Record<string, string> = {
    '--od-header-height': `${hs.height}px`,
    '--od-footer-height': `${fs.height}px`,
    '--od-sidebar-width': collapsed ? `${ss.min}px` : `${ss.width}px`,
    '--od-sidebar-min-width': `${ss.min}px`,
    '--od-animation-enabled': anim.enabled !== false ? '1' : '0',
    '--od-animation-duration': `${anim.duration ?? 200}ms`,
    '--od-animation-easing': anim.easing ?? 'ease',
    '--od-breakpoint': breakpoint,
    '--od-is-mobile': isMobile ? '1' : '0',
  };

  const root: Record<string, string> = { display: 'flex', flexDirection: 'column', minHeight: '100vh', ...cssVariables };

  const header: Record<string, string> = { flexShrink: '0', height: `${hs.height}px` };
  if (hs.fixed) Object.assign(header, { position: 'fixed', top: '0', left: '0', right: '0', zIndex: String(DEFAULT_Z_INDEX.HEADER_FIXED) });
  if (hs.full) header.width = '100%';

  const footer: Record<string, string> = { flexShrink: '0', height: `${fs.height}px` };
  if (fs.fixed) Object.assign(footer, { position: 'fixed', bottom: '0', left: '0', right: '0', zIndex: String(DEFAULT_Z_INDEX.FOOTER_FIXED) });
  if (fs.full) footer.width = '100%';

  const sidebar: Record<string, string> = { flexShrink: '0', width: `${collapsed ? ss.min : ss.width}px`, transition: 'width var(--od-animation-duration, 200ms) ease' };
  if (ss.full) sidebar.height = '100%';
  if (ss.overlay || isMobile) Object.assign(sidebar, { position: 'fixed', zIndex: String(DEFAULT_Z_INDEX.SIDEBAR_OVERLAY) });

  const content: Record<string, string> = { flex: '1', minWidth: '0' };
  if (cs.scrollable) content.overflow = 'auto';

  return { root, header, footer, sidebar, content, cssVariables };
}
