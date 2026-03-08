import { ref, onMounted, onUnmounted, inject, provide, computed } from 'vue';
import { createLayout, type LayoutStore } from '@openlayout/core';
import { LAYOUT_DEFAULTS } from '@openlayout/config';

const LAYOUT_KEY = Symbol('OPENLAYOUT_VUE_KEY');

export interface VueLayoutConfig {
  direction?: 'horizontal' | 'vertical';
  header?: { height?: number; fixed?: boolean; fullWidth?: boolean };
  footer?: { height?: number; fixed?: boolean; fullWidth?: boolean };
  sidebar?: { width?: number; collapsedWidth?: number; collapsible?: boolean; defaultCollapsed?: boolean; fullHeight?: boolean; overlay?: boolean };
  content?: { scrollable?: boolean };
  breakpoints?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number; xxl?: number };
  mobileBreakpoint?: number;
  onBreakpointChange?: (breakpoint: string) => void;
  animated?: boolean;
  animationDuration?: number;
  theme?: 'light' | 'dark' | 'system';
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

export function provideLayout(config: VueLayoutConfig = {}) {
  const store = createLayout(config);

  const isMobile = ref(false);
  const theme = ref<'light' | 'dark'>(config.theme === 'system' ? 'light' : (config.theme ?? 'light'));

  const updateResponsive = () => {
    const width = window.innerWidth;
    store.setWidth(width);
    const mobileBreakpoint = config.mobileBreakpoint ?? LAYOUT_DEFAULTS.MOBILE_BREAKPOINT;
    isMobile.value = width < mobileBreakpoint;
    config.onBreakpointChange?.(store.breakpoint);
  };

  const updateTheme = () => {
    if (config.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme.value = prefersDark ? 'dark' : 'light';
    }
    config.onThemeChange?.(theme.value);
  };

  onMounted(() => {
    updateResponsive();
    window.addEventListener('resize', updateResponsive);
    updateTheme();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', updateResponsive);
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', updateTheme);
  });

  provide(LAYOUT_KEY, { store, isMobile, theme });

  return { store, isMobile, theme };
}

export function useLayout() {
  const context = inject<{
    store: LayoutStore;
    isMobile: ReturnType<typeof ref<boolean>>;
    theme: ReturnType<typeof ref<'light' | 'dark'>>;
  }>(LAYOUT_KEY);

  if (!context) {
    throw new Error('useLayout must be used within a Layout component');
  }

  const { store, isMobile, theme } = context;

  return {
    direction: computed(() => store.direction),
    headerHeight: computed(() => store.headerHeight),
    footerHeight: computed(() => store.footerHeight),
    sidebarWidth: computed(() => store.sidebarWidth),
    collapsedWidth: computed(() => store.collapsedWidth),
    headerFixed: computed(() => store.headerFixed),
    footerFixed: computed(() => store.footerFixed),
    sidebarFullHeight: computed(() => store.sidebarFullHeight),
    sidebarCollapsed: computed(() => store.sidebarCollapsed),
    sidebarVisible: computed(() => store.sidebarVisible),
    headerVisible: computed(() => store.headerVisible),
    footerVisible: computed(() => store.footerVisible),
    contentScrollable: computed(() => store.contentScrollable),
    breakpoint: computed(() => store.breakpoint),
    breakpoints: computed(() => store.breakpoints),
    currentWidth: computed(() => store.currentWidth),
    isMobile,
    theme,
    animated: computed(() => store.animated),
    animationDuration: computed(() => store.animationDuration),
    setDirection: store.setDirection,
    setHeaderHeight: store.setHeaderHeight,
    setFooterHeight: store.setFooterHeight,
    setSidebarWidth: store.setSidebarWidth,
    setCollapsedWidth: store.setCollapsedWidth,
    setHeaderFixed: store.setHeaderFixed,
    setFooterFixed: store.setFooterFixed,
    setSidebarFullHeight: store.setSidebarFullHeight,
    setSidebarCollapsed: store.setSidebarCollapsed,
    setSidebarVisible: store.setSidebarVisible,
    setHeaderVisible: store.setHeaderVisible,
    setFooterVisible: store.setFooterVisible,
    setContentScrollable: store.setContentScrollable,
  };
}
