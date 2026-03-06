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
  const header = createSize(config.sizes.header as LayoutSizeValue);
  const footer = createSize(config.sizes.footer as LayoutSizeValue);
  const sidebar = createSize(config.sizes.sidebar as LayoutSizeValue);
  const topbar = createSize(config.sizes.topbar as LayoutSizeValue);

  let sidebarMin = sidebar.auto ? undefined : sidebar.min;
  let topbarMin = topbar.auto ? undefined : topbar.min;
  let headerMin = header.auto ? undefined : header.min;

  if (state.collapsed) {
    sidebarMin = 0;
    topbarMin = 0;
  }

  switch (config.mode) {
    case 'sidebar':
      return {
        header: { min: headerMin, max: header.max, auto: header.auto },
        footer: { min: footer.auto ? undefined : footer.min, max: footer.max, auto: footer.auto },
        sidebar: { min: sidebarMin, max: sidebar.max, auto: sidebar.auto },
        topbar: { min: 0, max: 0, auto: false },
      };

    case 'top':
      return {
        header: { min: 0, max: 0, auto: false },
        footer: { min: footer.auto ? undefined : footer.min, max: footer.max, auto: footer.auto },
        sidebar: { min: 0, max: 0, auto: false },
        topbar: { min: topbarMin, max: topbar.max, auto: topbar.auto },
      };

    case 'mixed':
      return {
        header: { min: headerMin, max: header.max, auto: header.auto },
        footer: { min: footer.auto ? undefined : footer.min, max: footer.max, auto: footer.auto },
        sidebar: { min: sidebarMin, max: sidebar.max, auto: sidebar.auto },
        topbar: { min: topbarMin, max: topbar.max, auto: topbar.auto },
      };

    default:
      return {
        header: { min: headerMin, max: header.max, auto: header.auto },
        footer: { min: footer.auto ? undefined : footer.min, max: footer.max, auto: footer.auto },
        sidebar: { min: sidebarMin, max: sidebar.max, auto: sidebar.auto },
        topbar: { min: 0, max: 0, auto: false },
      };
  }
}
