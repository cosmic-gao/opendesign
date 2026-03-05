/**
 * OpenDesign Layout 类型定义
 * 提供 TypeScript 类型接口，纯类型定义，无运行时依赖
 */

/**
 * 布局模式
 */
export type LayoutMode = 'sidebar' | 'top' | 'mixed';

/**
 * 响应式断点（支持任意自定义命名）
 */
export interface Breakpoints {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  [key: string]: number | undefined;
}

/**
 * 当前激活的断点（互斥模型）
 */
export type ActiveBreakpoint = string | null;

/**
 * 单个区域的大小配置（支持简写和完整写法）
 */
export interface LayoutSize {
  min?: number;   // 最小值
  max?: number;   // 最大值
}

/**
 * 简写类型：number = { min: n, max: n }
 */
export type LayoutSizeValue = number | LayoutSize;

/**
 * 布局尺寸配置
 */
export interface LayoutSizes {
  header?: LayoutSizeValue;
  footer?: LayoutSizeValue;
  sidebar?: LayoutSizeValue;
}

/**
 * 布局配置
 */
export interface LayoutConfig {
  mode: LayoutMode;
  defaultCollapsed: boolean;
  breakpoints: Breakpoints;
  sizes: LayoutSizes;
}

/**
 * 布局状态（Core 内部状态，不包含 UI 语义）
 */
export interface LayoutState {
  collapsed: boolean;
  activeBreakpoint: ActiveBreakpoint;
}
