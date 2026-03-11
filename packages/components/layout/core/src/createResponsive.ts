import type { Breakpoint, Breakpoints } from '@openlayout/config';
import { DEFAULT_BREAKPOINTS } from '@openlayout/config';

type BreakpointKey = keyof Breakpoints;

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
  onChange?: (breakpoint: Breakpoint) => void;
}

/**
 * 创建媒体查询监听器
 * 
 * @description
 * 使用 window.matchMedia API 监听屏幕宽度变化，返回当前断点状态。
 * 支持 SSR 场景（默认返回 'xxl'）。
 * 
 * @param {MediaQueryOptions} [options={}] - 配置选项
 * @returns {MediaQueryState} 媒体查询状态对象
 * 
 * @example
 * const { breakpoint, isMobile } = createResponsive({
 *   mobileBreakpoint: 768
 * });
 */
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

/**
 * 生成 CSS 媒体查询字符串
 * 
 * @description
 * 根据断点配置生成用于 CSS-in-JS 的媒体查询字符串对象。
 * 
 * @param {Breakpoints} breakpoints - 断点配置
 * @param {string} [mediaType='screen'] - 媒体类型
 * @returns {Record<string, string>} 媒体查询字符串映射
 */
export function getMediaQueries(
  breakpoints: Breakpoints,
  mediaType: string = 'screen'
): Record<string, string> {
  const breakpointKeys = Object.keys(breakpoints).sort(
    (a, b) => (breakpoints[a as BreakpointKey] ?? 0) - (breakpoints[b as BreakpointKey] ?? 0)
  );

  const queries: Record<string, string> = {};

  breakpointKeys.forEach((key, index) => {
    const minWidth = breakpoints[key as BreakpointKey];
    const maxWidth = breakpointKeys[index + 1]
      ? (breakpoints[breakpointKeys[index + 1] as BreakpointKey] ?? 0) - 0.02
      : undefined;

    if (minWidth !== undefined) {
      if (maxWidth !== undefined) {
        queries[key] = `@media ${mediaType} and (min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`;
      } else {
        queries[key] = `@media ${mediaType} and (min-width: ${minWidth}px)`;
      }
    }
  });

  return queries;
}
