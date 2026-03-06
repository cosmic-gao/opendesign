/**
 * OpenDesign Layout 布局计算
 * Core 层仅输出尺寸信息，不泄漏 UI 实现细节
 */

import type { LayoutConfig, LayoutState, LayoutSize, LayoutSizeValue } from '@openlayout/type';

/**
 * 布局尺寸计算结果
 */
export interface LayoutDimensions {
  header: LayoutSize;
  footer: LayoutSize;
  sidebar: LayoutSize;
}

/**
 * 校验并规范化数字范围
 * @param min - 最小值
 * @param max - 最大值
 * @returns 校验后的 min/max
 */
function range(min?: number, max?: number): [number, number] {
  let lo = min ?? 0;
  let hi = max ?? lo;

  if (lo < 0) lo = 0;
  if (hi < 0) hi = 0;
  if (lo > hi) [lo, hi] = [hi, lo];

  return [lo, hi];
}

/**
 * 校验并规范化尺寸配置
 * @param value - 布局尺寸值（数值、对象或 'auto'）
 * @returns 规范化后的尺寸对象
 */
function createSize(value?: LayoutSizeValue): LayoutSize {
  if (value === undefined) return { auto: true };
  if (value === 'auto') return { auto: true };

  if (typeof value === 'number') {
    const [min, max] = range(value, value);
    return { min, max };
  }

  const [min, max] = range(value.min, value.max);
  return { min, max, auto: value.auto };
}

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
  const header = createSize(config.sizes.header);
  const footer = createSize(config.sizes.footer);
  const sidebar = createSize(config.sizes.sidebar);

  let sidebarMin = sidebar.auto ? undefined : sidebar.min;
  if (state.collapsed) {
    sidebarMin = 0;
  }

  return {
    header: { min: header.auto ? undefined : header.min, max: header.max, auto: header.auto },
    footer: { min: footer.auto ? undefined : footer.min, max: footer.max, auto: footer.auto },
    sidebar: { min: sidebarMin, max: sidebar.max, auto: sidebar.auto },
  };
}
