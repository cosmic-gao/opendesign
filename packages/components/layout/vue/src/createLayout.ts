import { computed, ref } from 'vue';
import { useStore as useNanoStore } from '@nanostores/vue';
import { 
  $layoutState, 
  initState, 
  setCollapsed, 
  toggleCollapsed as coreToggleCollapsed,
  setBreakpoint as coreSetBreakpoint 
} from '@openlayout/core';
import { createLayout as computeLayout } from '@openlayout/core';
import { createMedia } from '@openlayout/core';
import type { LayoutConfig, LayoutSizes } from '@openlayout/type';
import type { CreateLayoutOptions, UseLayoutReturn, Breakpoint } from './types';

/**
 * 默认断点配置
 */
const DEFAULT_BREAKPOINTS: Record<string, number> = {
  xs: 480,
  sm: 768,
  md: 1024,
};

/**
 * 默认尺寸配置
 */
const DEFAULT_SIZES: Required<{
  header: NonNullable<LayoutSizes['header']>;
  footer: NonNullable<LayoutSizes['footer']>;
  sidebar: NonNullable<LayoutSizes['sidebar']>;
}> = {
  header: 64,
  footer: 48,
  sidebar: 240,
};

/**
 * 规范化用户配置为完整配置
 */
function normalizeConfig(options?: CreateLayoutOptions): LayoutConfig {
  const breakpoints = { ...DEFAULT_BREAKPOINTS, ...options?.breakpoints };
  const sizes = {
    header: options?.sizes?.header ?? DEFAULT_SIZES.header,
    footer: options?.sizes?.footer ?? DEFAULT_SIZES.footer,
    sidebar: options?.sizes?.sidebar ?? DEFAULT_SIZES.sidebar,
  };
  
  return {
    mode: options?.mode ?? 'sidebar',
    defaultCollapsed: options?.defaultCollapsed ?? false,
    breakpoints,
    sizes,
  };
}

// 已初始化的配置缓存
let cachedConfig: LayoutConfig | null = null;

// 存储 unsubscribe 函数
let unsubscribeMedia: (() => void) | null = null;

/**
 * Layout Store 类型
 */
export interface LayoutStore {
  useStore: () => UseLayoutReturn;
  getState: () => { collapsed: boolean; breakpoint: string | null };
  cleanup: () => void;
}

/**
 * 创建布局 Store 的工厂函数
 */
export function createLayout(options?: CreateLayoutOptions): LayoutStore {
  // 规范化配置
  const config = normalizeConfig(options);
  
  // 初始化 Core 层状态
  if (!cachedConfig) {
    initState(config);
    cachedConfig = config;
    
    // 创建断点检测并订阅变化
    const media = createMedia(config.breakpoints);
    unsubscribeMedia = media.subscribe((bp: string | null) => {
      coreSetBreakpoint(bp);
    });
    
    // 初始化断点
    const initialBreakpoint = media.getBreakpoint();
    if (initialBreakpoint) {
      coreSetBreakpoint(initialBreakpoint);
    }
  }
  
  function getState(): { collapsed: boolean; breakpoint: string | null } {
    return $layoutState.get();
  }
  
  function cleanup(): void {
    if (unsubscribeMedia) {
      unsubscribeMedia();
      unsubscribeMedia = null;
    }
    cachedConfig = null;
  }
  
  const useStore = (): UseLayoutReturn => {
    // 订阅 Core 层状态
    const state = useNanoStore($layoutState);
    
    // 计算布局尺寸（响应式）
    const dimensions = computed(() => computeLayout(config, state.value));
    
    // 快捷属性：提取高度/宽度数值
    const headerHeight = computed(() => dimensions.value.headerHeight);
    const footerHeight = computed(() => dimensions.value.footerHeight);
    const sidebarWidth = computed(() => dimensions.value.sidebarWidth);
    
    // 快捷属性：断点判断
    const isMobile = computed(() => 
      state.value.breakpoint === 'xs' || state.value.breakpoint === 'sm'
    );
    const isDesktop = computed(() => state.value.breakpoint === 'lg');
    
    return {
      // 基础状态（Ref）
      collapsed: computed(() => state.value.collapsed),
      breakpoint: computed(() => state.value.breakpoint as Breakpoint),
      layoutMode: computed(() => config.mode), // 返回当前模式
      toggleCollapsed: coreToggleCollapsed,
      setCollapsed,
      
      // 快捷属性（Ref）
      headerHeight,
      footerHeight,
      sidebarWidth,
      isMobile,
      isDesktop,
      
      // 完整尺寸（Ref）
      dimensions,
    };
  };
  
  return {
    useStore,
    getState,
    cleanup,
  };
}
