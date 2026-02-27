/**
 * OpenDesign Layout 类型定义
 * 提供 TypeScript 类型接口，纯类型定义，无运行时依赖
 */

/**
 * 布局模式
 */
export type LayoutMode = 'sidebar' | 'top' | 'mixed';

/**
 * 主题
 */
export type Theme = 'light' | 'dark';

/**
 * 响应式断点
 */
export interface Breakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

/**
 * 布局配置
 */
export interface LayoutConfig {
  mode: LayoutMode;
  defaultCollapsed: boolean;
  defaultTheme: Theme;
  breakpoints: Breakpoints;
  headerHeight: number;
  sidebarWidth: number;
  sidebarCollapsedWidth: number;
  contentMaxWidth: number;
}

/**
 * 设计令牌
 */
export interface DesignTokens {
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
  };
}

/**
 * 布局状态
 */
export interface LayoutState {
  collapsed: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  theme: Theme;
  activeRoute: string;
}
