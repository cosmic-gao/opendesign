/**
 * OpenDesign Layout 互斥断点检测
 * 保证同时只有一个 active breakpoint
 */

import type { Breakpoints, ActiveBreakpoint } from '@openlayout/type';

interface MediaResult {
  getBreakpoint: () => ActiveBreakpoint;
  subscribe: (callback: (breakpoint: ActiveBreakpoint) => void) => () => void;
}

/**
 * 创建断点检测器
 * @param breakpoints - 断点配置
 * @returns 断点检测对象
 */
export function createMedia(breakpoints: Breakpoints): MediaResult {
  function isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // 构建互斥断点区间（无重叠，无空隙）
  function buildQueries(bp: Breakpoints) {
    const keys = Object.keys(bp)
      .filter(k => bp[k] !== undefined)
      .sort((a, b) => bp[a]! - bp[b]!);
    
    // 添加 sentinel 键用于 SSR fallback
    const withSentinel = [':desktop', ...keys];
    
    return withSentinel.map((key, index) => {
      const value = bp[key === ':desktop' ? keys[keys.length - 1]! : key];
      const isFirst = index === 0;
      const isLast = index === withSentinel.length - 1;
      
      let query: string;
      if (isFirst) {
        // xs 及以下
        query = `(max-width: ${value}px)`;
      } else if (isLast) {
        // 最大断点以上
        query = `(min-width: ${value}px)`;
      } else {
        // 中间区间
        const prevKey = withSentinel[index - 1];
        const prevValue = bp[prevKey === ':desktop' ? keys[keys.length - 1]! : prevKey!]!;
        query = `(min-width: ${prevValue + 1}px) and (max-width: ${value}px)`;
      }
      
      return { key: key === ':desktop' ? keys[keys.length - 1]! : key, query };
    });
  }

  let queries: { key: string; mql: MediaQueryList }[] | null = null;
  let currentBreakpoint: ActiveBreakpoint = null;

  const initQueries = () => {
    if (queries || !isBrowser()) return;
    
    const sorted = Object.keys(breakpoints).sort((a, b) => breakpoints[a]! - breakpoints[b]!);
    const largest = sorted[sorted.length - 1];
    
    // 初始计算当前断点
    for (const key of sorted) {
      const mql = window.matchMedia(`(max-width: ${breakpoints[key]!}px)`);
      if (mql.matches) {
        currentBreakpoint = key;
        break;
      }
    }
    if (!currentBreakpoint) {
      currentBreakpoint = largest;
    }

    queries = buildQueries(breakpoints).map(({ key, query }) => ({
      key,
      mql: window.matchMedia(query),
    }));
  };

  return {
    getBreakpoint: (): ActiveBreakpoint => {
      initQueries();
      // SSR fallback：返回最大断点
      if (!queries) {
        const sorted = Object.keys(breakpoints).sort((a, b) => breakpoints[a]! - breakpoints[b]!);
        return sorted[sorted.length - 1] || null;
      }
      return currentBreakpoint;
    },
    subscribe: (callback: (breakpoint: ActiveBreakpoint) => void) => {
      initQueries();
      if (!queries) return () => {};
      
      const handler = (e: MediaQueryListEvent) => {
        if (e.matches) {
          const matched = queries!.find(q => q.mql === e.media);
          if (matched) {
            currentBreakpoint = matched.key;
            callback(currentBreakpoint);
          }
        }
      };
      
      queries.forEach(({ mql }) => mql.addEventListener('change', handler));
      return () => queries!.forEach(({ mql }) => mql.removeEventListener('change', handler));
    },
  };
}
