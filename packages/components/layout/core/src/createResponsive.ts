import type { Breakpoint, Breakpoints } from '@openlayout/config';
import { DEFAULT_BREAKPOINTS } from '@openlayout/config';

export interface MediaQueryState {
  breakpoint: Breakpoint;
  breakpoints: Breakpoints;
  isAbove: (breakpoint: Breakpoint) => boolean;
  isBelow: (breakpoint: Breakpoint) => boolean;
  isMobile: boolean;
}

export interface MediaQueryOptions {
  breakpoints?: Partial<Breakpoints>;
  mobileBreakpoint?: number;
}

export function createResponsive(options: MediaQueryOptions = {}): MediaQueryState {
  const breakpoints: Breakpoints = {
    ...DEFAULT_BREAKPOINTS,
    ...options.breakpoints,
  };

  const mobileThreshold = options.mobileBreakpoint ?? breakpoints.md ?? 768;

  const getBreakpoint = (): Breakpoint => {
    if (typeof window === 'undefined') return 'xxl';
    const width = window.innerWidth;
    if (width < (breakpoints.xs ?? 480)) return 'xs';
    if (width < (breakpoints.sm ?? 576)) return 'sm';
    if (width < (breakpoints.md ?? 768)) return 'md';
    if (width < (breakpoints.lg ?? 992)) return 'lg';
    if (width < (breakpoints.xl ?? 1200)) return 'xl';
    return 'xxl';
  };

  const isAbove = (breakpoint: Breakpoint): boolean => {
    if (typeof window === 'undefined') return true;
    const threshold = breakpoints[breakpoint];
    if (threshold === undefined) return true;
    return window.innerWidth >= threshold;
  };

  const isBelow = (breakpoint: Breakpoint): boolean => {
    if (typeof window === 'undefined') return false;
    const threshold = breakpoints[breakpoint];
    if (threshold === undefined) return false;
    return window.innerWidth < threshold;
  };

  return {
    breakpoint: getBreakpoint(),
    breakpoints,
    isAbove,
    isBelow,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < mobileThreshold : false,
  };
}
