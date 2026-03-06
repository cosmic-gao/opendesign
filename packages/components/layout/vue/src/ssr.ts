/**
 * SSR 辅助函数
 * 提供服务端渲染相关的工具函数
 */

import type { CreateLayoutOptions } from './types';

/**
 * 获取服务端渲染初始状态
 * 用于确保客户端 hydration 时状态一致
 * 
 * @param options - 布局配置
 * @returns 初始状态对象
 * 
 * @example
 * // Nuxt 服务端
 * import { getServerState } from '@openlayout/vue/ssr';
 * 
 * export default defineEventHandler(() => {
 *   return getServerState({ defaultCollapsed: true });
 * });
 */
export function getServerState(options?: CreateLayoutOptions): {
  collapsed: boolean;
  breakpoint: string | null;
} {
  return {
    collapsed: options?.defaultCollapsed ?? false,
    breakpoint: 'md', // 默认断点
  };
}

/**
 * 创建 SSR 兼容的 Layout 配置
 * 
 * @param options - 布局配置
 * @returns SSR 配置对象
 */
export function createSSRConfig(options?: CreateLayoutOptions): {
  initialCollapsed: boolean;
  initialBreakpoint: string;
} {
  return {
    initialCollapsed: options?.defaultCollapsed ?? false,
    initialBreakpoint: 'md',
  };
}
