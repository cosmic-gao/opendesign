/**
 * OpenDesign Layout 布局计算
 * 计算布局尺寸和边距
 */

import type { LayoutConfig } from '@openlayout/type';

/**
 * 布局计算结果
 */
export interface LayoutCalculated {
  sidebarWidth: number;
  contentWidth: string;
  contentMarginLeft: string;
}

/**
 * 使用计算器
 * @param config - 布局配置
 * @param state - 当前布局状态
 * @returns 计算后的布局尺寸
 */
export function useCalculator(
  config: LayoutConfig,
  state: { collapsed: boolean; isMobile: boolean }
): LayoutCalculated {
  const sidebarWidth = state.isMobile 
    ? 0 
    : (state.collapsed ? config.sidebarCollapsedWidth : config.sidebarWidth);

  return {
    sidebarWidth,
    contentWidth: `calc(100% - ${sidebarWidth}px)`,
    contentMarginLeft: `${sidebarWidth}px`,
  };
}
