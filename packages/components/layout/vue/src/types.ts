import type { 
  LayoutDimensions, 
  Breakpoints,
  LayoutSizes 
} from '@openlayout/type';
import type { Ref } from 'vue';

/**
 * 断点类型定义
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | null;

/**
 * useLayout 返回值的类型定义
 * Vue 版本：所有状态都是 Ref
 */
export interface UseLayoutReturn {
  // 基础状态（Ref）
  collapsed: Ref<boolean>;
  breakpoint: Ref<Breakpoint>;
  toggleCollapsed: () => void;
  setCollapsed: (value: boolean) => void;
  
  // 快捷属性（自动解包为原始类型）
  headerHeight: Ref<number>;
  footerHeight: Ref<number>;
  sidebarWidth: Ref<number>;
  isMobile: Ref<boolean>;
  isDesktop: Ref<boolean>;
  
  // 完整尺寸（Ref）
  dimensions: Ref<LayoutDimensions>;
}

/**
 * createLayout 配置选项（简化版）
 */
export interface CreateLayoutOptions {
  /** 断点配置，默认 { xs: 480, sm: 768, md: 1024 } */
  breakpoints?: Breakpoints;
  /** 尺寸配置，默认 { header: 64, footer: 48, sidebar: 240 } */
  sizes?: Partial<LayoutSizes>;
  /** 默认折叠状态，默认 false */
  defaultCollapsed?: boolean;
}
