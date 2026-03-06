/**
 * OpenDesign Layout 共享工具函数
 */

import type { LayoutSize, LayoutSizeValue } from '@openlayout/type';

/**
 * 校验并规范化数字范围
 * @param min - 最小值
 * @param max - 最大值
 * @returns 校验后的 min/max
 */
export function range(min?: number, max?: number): [number, number] {
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
export function createSize(value?: LayoutSizeValue): LayoutSize {
  if (value === undefined) return { auto: true };
  if (value === 'auto') return { auto: true };

  if (typeof value === 'number') {
    const [min, max] = range(value, value);
    return { min, max };
  }

  const [min, max] = range(value.min, value.max);
  return { min, max, auto: value.auto };
}
