import type { 
  LayoutDimensions, 
  Breakpoints,
  LayoutSizes,
  LayoutMode 
} from '@openlayout/type';

/**
 * 断点类型定义
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | null;

/**
 * useLayout 返回值的类型定义
 */
export interface UseLayoutReturn {
  // 基础状态
  collapsed: boolean;
  breakpoint: Breakpoint;
  toggleCollapsed: () => void;
  setCollapsed: (value: boolean) => void;
  
  // 快捷属性
  headerHeight: number;
  footerHeight: number;
  sidebarWidth: number;
  topbarHeight: number;
  isMobile: boolean;
  isDesktop: boolean;
  
  // 完整尺寸
  dimensions: LayoutDimensions;
}

/**
 * createLayout 配置选项（简化版）
 * 布局模式默认为 sidebar
 */
export interface CreateLayoutOptions {
  /** 布局模式，默认 'sidebar' */
  mode?: LayoutMode;
  /** 断点配置，默认 { xs: 480, sm: 768, md: 1024 } */
  breakpoints?: Breakpoints;
  /** 尺寸配置，默认 { header: 64, footer: 48, sidebar: 240 } */
  sizes?: Partial<LayoutSizes>;
  /** 默认折叠状态，默认 false */
  defaultCollapsed?: boolean;
}
