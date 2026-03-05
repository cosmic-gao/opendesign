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
 * 校验并规范化尺寸配置
 * @param value - 布局尺寸值（数值、对象或 'auto'）
 * @returns 规范化后的尺寸对象
 */
function createSize(value?: LayoutSizeValue): LayoutSize {
  if (value === undefined) return {};
  
  // 处理 'auto' 简写形式
  if (value === 'auto') {
    return { auto: true };
  }
  
  let size: LayoutSize;
  if (typeof value === 'number') {
    size = { min: value, max: value };
  } else {
    size = { ...value };
  }
  
  // 负值保护
  if (size.min !== undefined && size.min < 0) size.min = 0;
  if (size.max !== undefined && size.max < 0) size.max = 0;
  
  // min > max 修正
  if (size.min !== undefined && size.max !== undefined && size.min > size.max) {
    [size.min, size.max] = [size.max, size.min!];
  }
  
  return size;
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
  
  // 计算 sidebar 实际宽度
  // Core 层不预设 "Mobile" 概念，仅根据 collapsed 状态计算
  // 上层应用应通过配置（如设置 mobile 断点下的 collapsed 默认值）或在外部处理移动端逻辑
  let sidebarMin = sidebar.auto ? undefined : sidebar.min;
  if (state.collapsed) {
    sidebarMin = 0; // 折叠状态
  }
  
  return {
    header: { min: header.auto ? undefined : header.min, max: header.max },
    footer: { min: footer.auto ? undefined : footer.min, max: footer.max },
    sidebar: { min: sidebarMin, max: sidebar.max, auto: sidebar.auto },
  };
}
