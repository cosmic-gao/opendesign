/**
 * OpenDesign Layout 类型定义
 * 提供 TypeScript 类型接口，纯类型定义，无运行时依赖
 * @module @openlayout/type
 */

/**
 * 布局模式 (预设)
 * @typedef {'sidebar' | 'mixed' | 'top' | 'blank'} LayoutMode
 * - sidebar: 侧边优先，Sidebar 占满左侧全高
 * - mixed: 顶部优先，Header 占满顶部全宽
 * - top: 顶部导航，无 Sidebar
 * - blank: 空白模式，无 Header/Sidebar/Footer
 */
export type LayoutMode = 'sidebar' | 'mixed' | 'top' | 'blank';

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
 * 单个区域的大小配置
 */
export interface LayoutSize {
  min?: number;
  max?: number;
  auto?: boolean;
}

export type LayoutSizeValue = number | LayoutSize | 'auto';

/**
 * 布局尺寸配置
 */
export interface LayoutSizes {
  header?: LayoutSizeValue;
  footer?: LayoutSizeValue;
  sidebar?: LayoutSizeValue;
}

/**
 * 布局行为配置 (高级控制)
 */
export interface LayoutBehavior {
  /** Header 是否占满顶部全宽 (覆盖 Sidebar 顶部) */
  headerFullWidth?: boolean;
  /** Footer 是否占满底部全宽 (覆盖 Sidebar 底部) */
  footerFullWidth?: boolean;
}

/**
 * 布局配置
 */
export interface LayoutConfig extends LayoutBehavior {
  /** 布局模式 (预设组合) */
  mode: LayoutMode;
  /** 默认是否折叠 */
  defaultCollapsed: boolean;
  /** 断点配置 */
  breakpoints: Breakpoints;
  /** 尺寸配置 */
  sizes: LayoutSizes;
}

/**
 * 布局状态
 */
export interface LayoutState {
  collapsed: boolean;
  breakpoint: string | null
}

/**
 * 布局尺寸计算结果 (像素值或 CSS 值)
 */
export interface LayoutDimensions {
  /** 头部高度 (px) */
  headerHeight: number;
  /** 头部宽度 (px 或 '100%') */
  headerWidth: number | string;
  
  /** 侧边栏宽度 (px) */
  sidebarWidth: number;
  /** 侧边栏高度 (px 或 CSS calc) */
  sidebarHeight: number | string;
  /** 侧边栏距离顶部偏移 (px) */
  sidebarTop: number;
  
  /** 底部高度 (px) */
  footerHeight: number;
  /** 底部宽度 (px 或 '100%') */
  footerWidth: number | string;
  
  /** 内容区域上边距 (px) */
  contentMarginTop: number;
  /** 内容区域左边距 (px) */
  contentMarginLeft: number;
}
