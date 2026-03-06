/**
 * OpenDesign Layout 布局计算
 * Core 层仅输出尺寸信息，不泄漏 UI 实现细节
 */

import { createSize } from './utils';
import type { LayoutConfig, LayoutState, LayoutSizeValue, LayoutDimensions } from '@openlayout/type';

/**
 * 计算布局尺寸
 * @param config - 布局配置
 * @param state - 布局状态
 * @returns 计算后的布局尺寸
 */
export function createLayout(
  config: LayoutConfig,
  state: LayoutState
): LayoutDimensions {
  // 1. 获取基础配置尺寸
  const header = createSize(config.sizes.header as LayoutSizeValue);
  const footer = createSize(config.sizes.footer as LayoutSizeValue);
  const sidebar = createSize(config.sizes.sidebar as LayoutSizeValue);

  // 2. 全宽行为 (由用户直接配置)
  const headerFullWidth = config.headerFullWidth ?? false;
  const footerFullWidth = config.footerFullWidth ?? false;

  // 3. 计算基础数值 (Base Metrics)
  const headerH = header.auto ? 0 : (header.min ?? 0);
  const footerH = footer.auto ? 0 : (footer.min ?? 0);
  let sidebarW = sidebar.auto ? 0 : (sidebar.min ?? 0);

  // 4. 处理折叠状态 (Collapsed State)
  if (state.collapsed) {
    sidebarW = 0; 
  }

  // 5. 计算最终布局尺寸与位置 (Final Dimensions & Positioning)
  
  // Sidebar 的垂直位置和高度取决于 Header 和 Footer 是否全宽
  const sidebarTop = headerFullWidth ? headerH : 0;
  let sidebarHeight: string | number = '100%';
  
  if (headerFullWidth && footerFullWidth) {
    sidebarHeight = `calc(100% - ${headerH}px - ${footerH}px)`;
  } else if (headerFullWidth) {
    sidebarHeight = `calc(100% - ${headerH}px)`;
  } else if (footerFullWidth) {
    sidebarHeight = `calc(100% - ${footerH}px)`;
  }

  return {
    // Header
    headerHeight: headerH,
    headerWidth: headerFullWidth ? '100%' : `calc(100% - ${sidebarW}px)`,

    // Sidebar
    sidebarWidth: sidebarW,
    sidebarHeight: sidebarHeight,
    sidebarTop: sidebarTop,

    // Footer
    footerHeight: footerH,
    footerWidth: footerFullWidth ? '100%' : `calc(100% - ${sidebarW}px)`,

    // 内容区域偏移
    contentMarginTop: headerH,
    contentMarginLeft: sidebarW,
  };
}
