/**
 * OpenDesign Layout 响应式检测
 * 使用 matchMedia 检测屏幕尺寸变化
 * 支持 SSR（服务端渲染）环境
 */

import type { Breakpoints } from '@openlayout/type';

/**
 * 媒体查询匹配结果
 */
export interface MediaQueryMatches {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * 媒体查询结果订阅回调
 */
type MediaQueryCallback = (matches: MediaQueryMatches) => void;

/**
 * 检查是否在浏览器环境中
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

/**
 * 使用媒体检测
 * @param breakpoints - 响应式断点配置
 * @returns 媒体查询检测对象
 */
export function useMedia(breakpoints: Breakpoints) {
  // 延迟初始化，只在浏览器环境中创建
  let queries: {
    mobile: MediaQueryList;
    tablet: MediaQueryList;
    desktop: MediaQueryList;
  } | null = null;

  const initQueries = () => {
    if (queries) return;
    if (!isBrowser()) return;
    
    queries = {
      mobile: window.matchMedia(`(max-width: ${breakpoints.mobile}px)`),
      tablet: window.matchMedia(`(min-width: ${breakpoints.mobile}px) and (max-width: ${breakpoints.tablet}px)`),
      desktop: window.matchMedia(`(min-width: ${breakpoints.tablet}px)`),
    };
  };

  return {
    /**
     * 获取当前匹配状态
     * SSR 环境下默认返回桌面端
     */
    getMatches: (): MediaQueryMatches => {
      initQueries();
      
      // SSR 或非浏览器环境，默认返回桌面端
      if (!queries) {
        return { isMobile: false, isTablet: false, isDesktop: true };
      }
      
      return {
        isMobile: queries.mobile.matches,
        isTablet: queries.tablet.matches,
        isDesktop: queries.desktop.matches,
      };
    },

    /**
     * 订阅匹配状态变化
     * @param callback - 回调函数
     * @returns 取消订阅函数
     */
    subscribe: (callback: MediaQueryCallback) => {
      initQueries();
      
      // 非浏览器环境，不订阅
      if (!queries) {
        return () => {};
      }

      const handler = () => callback(getMatches());

      queries.mobile.addEventListener('change', handler);
      queries.tablet.addEventListener('change', handler);
      queries.desktop.addEventListener('change', handler);

      return () => {
        queries?.mobile.removeEventListener('change', handler);
        queries?.tablet.removeEventListener('change', handler);
        queries?.desktop.removeEventListener('change', handler);
      };
    },
  };
}
