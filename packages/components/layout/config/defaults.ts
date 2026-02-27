/**
 * OpenDesign Layout 默认配置
 * 提供 LayoutConfig 默认值
 */

import type { LayoutConfig } from '@openlayout/type';

/**
 * 默认布局配置
 */
export const defaultConfig: LayoutConfig = {
  mode: 'sidebar',
  defaultCollapsed: false,
  defaultTheme: 'light',
  breakpoints: {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
  },
  headerHeight: 64,
  sidebarWidth: 240,
  sidebarCollapsedWidth: 64,
  contentMaxWidth: 1200,
};
