/**
 * OpenDesign Layout 类型定义
 * 提供 TypeScript 类型接口，纯类型定义，无运行时依赖
 * @module @openlayout/type
 */

/**
 * 布局模式
 * @typedef {'sidebar' | 'mixed' | 'top' | 'blank'} LayoutMode
 * - sidebar: 侧边优先，Sidebar 占满左侧全高
 * - mixed: 顶部优先，Header 占满顶部全宽
 * - top: 顶部导航，无 Sidebar
 * - blank: 空白模式，无 Header/Sidebar/Footer
 */
export type LayoutMode = 'sidebar' | 'mixed' | 'top' | 'blank';

/**
 * 响应式断点（支持任意自定义命名）
 * @interface
 */
export interface Breakpoints {
  /** 移动端断点 */
  xs?: number;
  /** 平板断点 */
  sm?: number;
  /** 桌面端断点 */
  md?: number;
  /** 大桌面端断点 */
  lg?: number;
  /** 其他自定义断点 */
  [key: string]: number | undefined;
}

/**
 * 单个区域的大小配置（支持简写和完整写法）
 * @interface
 */
export interface LayoutSize {
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 自动撑开（不设置固定值） */
  auto?: boolean;
}

/**
 * 简写类型：number = { min: n, max: n }，或 'auto'
 * @typedef {number | LayoutSize | 'auto'} LayoutSizeValue
 */
export type LayoutSizeValue = number | LayoutSize | 'auto';

/**
 * 布局尺寸配置
 * @interface
 */
export interface LayoutSizes {
  /** 头部区域尺寸 */
  header?: LayoutSizeValue;
  /** 底部区域尺寸 */
  footer?: LayoutSizeValue;
  /** 侧边栏区域尺寸 */
  sidebar?: LayoutSizeValue;
}

/**
 * 布局配置
 * @interface
 */
export interface LayoutConfig {
  /** 布局模式 */
  mode: LayoutMode;
  /** 默认是否折叠 */
  defaultCollapsed: boolean;
  /** 断点配置 */
  breakpoints: Breakpoints;
  /** 尺寸配置 */
  sizes: LayoutSizes;
}

/**
 * 布局状态（Core 内部状态，不包含 UI 语义）
 * @interface
 */
export interface LayoutState {
  /** 当前是否折叠 */
  collapsed: boolean;
  /** 当前激活的断点 */
  breakpoint: string | null
}

/**
 * 布局尺寸计算结果 (像素值或 CSS 值)
 * @interface
 */
export interface LayoutDimensions {
  /** 头部高度 (px) */
  headerHeight: number;
  /** 头部宽度 (px 或 '100%') */
  headerWidth: number | '100%';
  
  /** 侧边栏宽度 (px) */
  sidebarWidth: number;
  /** 侧边栏高度 (px 或 '100%') */
  sidebarHeight: number | '100%';
  
  /** 底部高度 (px) */
  footerHeight: number;
  /** 底部宽度 (px 或 '100%') */
  footerWidth: number | '100%';
  
  /** 内容区域上边距 (px) - 通常等于 headerHeight */
  contentMarginTop: number;
  /** 内容区域左边距 (px) - 通常等于 sidebarWidth */
  contentMarginLeft: number;
}
