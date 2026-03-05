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
  breakpoints: {
    xs: 480,
    sm: 768,
    md: 1024,
  },
  sizes: {
    header: 64,
    footer: 48,
    sidebar: 240,
  },
};
