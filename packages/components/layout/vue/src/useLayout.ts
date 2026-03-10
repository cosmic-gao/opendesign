import { inject, computed, type ComputedRef, type Ref } from 'vue';
import type { LayoutConfig, Breakpoint, Breakpoints, ThemeMode } from '@openlayout/config';
import type { LayoutState, LayoutActions } from '@openlayout/core';

export function useLayout() {
  const config = inject<ComputedRef<LayoutConfig>>('layoutConfig');
  const responsive = inject<{ breakpoint: Ref<Breakpoint>, width: Ref<number>, isMobile: Ref<boolean> }>('layoutResponsive');
  
  return {
    // direction: computed(() => config?.value?.direction), // Not defined in config
    isMobile: responsive?.isMobile,
    breakpoint: responsive?.breakpoint,
    breakpoints: computed(() => config?.value?.breakpoints),
    currentWidth: responsive?.width,
    theme: computed(() => config?.value?.theme),
    
    headerHeight: computed(() => config?.value?.header?.height ?? 64),
    footerHeight: computed(() => config?.value?.footer?.height ?? 48),
    sidebarWidth: computed(() => config?.value?.sidebar?.width ?? 200),
    collapsedWidth: computed(() => config?.value?.sidebar?.collapsedWidth ?? 80),
  };
}

export function useSidebar() {
  const state = inject<LayoutState>('layoutState');
  const actions = inject<LayoutActions>('layoutActions');

  return {
    collapsed: computed(() => state?.sidebar.collapsed),
    visible: computed(() => state?.sidebar.visible),
    width: computed(() => state?.sidebar.width),
    toggle: actions?.sidebar.toggle,
    collapse: actions?.sidebar.collapse,
    expand: actions?.sidebar.expand,
    show: actions?.sidebar.show,
    hide: actions?.sidebar.hide,
    setCollapsed: actions?.sidebar.setCollapsed,
  };
}

export function useHeader() {
  const state = inject<LayoutState>('layoutState');
  const actions = inject<LayoutActions>('layoutActions');

  return {
    visible: computed(() => state?.header.visible),
    fixed: computed(() => state?.header.fixed),
    height: computed(() => state?.header.height),
    show: actions?.header.show,
    hide: actions?.header.hide,
    setFixed: actions?.header.setFixed,
  };
}

export function useFooter() {
  const state = inject<LayoutState>('layoutState');
  const actions = inject<LayoutActions>('layoutActions');

  return {
    visible: computed(() => state?.footer.visible),
    fixed: computed(() => state?.footer.fixed),
    height: computed(() => state?.footer.height),
    show: actions?.footer.show,
    hide: actions?.footer.hide,
    setFixed: actions?.footer.setFixed,
  };
}
