import { computed, type ComputedRef, inject, type Ref } from "vue";
import type { LayoutConfig } from "@openlayout/config";
import type { LayoutState, LayoutActions, ResponsiveState } from "@openlayout/core";

export function useLayout() {
  const config = inject<ComputedRef<LayoutConfig>>("layoutConfig");
  const responsive = inject<ComputedRef<ResponsiveState>>("layoutResponsive");

  return {
    isMobile: computed(() => responsive?.value.isMobile),
    breakpoint: computed(() => responsive?.value.breakpoint),
    breakpoints: computed(() => config?.value?.breakpoints),
    width: computed(() => responsive?.value.width),
    headerHeight: computed(() => config?.value?.header?.height ?? 64),
    footerHeight: computed(() => config?.value?.footer?.height ?? 48),
    sidebarWidth: computed(() => config?.value?.sidebar?.width ?? 200),
    sidebarMinWidth: computed(() => config?.value?.sidebar?.min ?? 80),
  };
}

export function useSidebar() {
  const state = inject<LayoutState>("layoutState");
  const actions = inject<LayoutActions>("layoutActions");

  return {
    collapsed: computed(() => state?.sidebar.collapsed),
    visible: computed(() => state?.sidebar.visible),
    width: computed(() => state?.sidebar.width),
    min: computed(() => state?.sidebar.min),
    toggle: actions?.toggleSidebar,
    setCollapsed: actions?.setSidebarCollapsed,
  };
}

export function useHeader() {
  const state = inject<LayoutState>("layoutState");
  const actions = inject<LayoutActions>("layoutActions");

  return {
    visible: computed(() => state?.header.visible),
    fixed: computed(() => state?.header.fixed),
    height: computed(() => state?.header.height),
    full: computed(() => state?.header.full),
    setVisible: actions?.setHeaderVisible,
    setFixed: actions?.setHeaderFixed,
  };
}

export function useFooter() {
  const state = inject<LayoutState>("layoutState");
  const actions = inject<LayoutActions>("layoutActions");

  return {
    visible: computed(() => state?.footer.visible),
    fixed: computed(() => state?.footer.fixed),
    height: computed(() => state?.footer.height),
    full: computed(() => state?.footer.full),
    setVisible: actions?.setFooterVisible,
    setFixed: actions?.setFooterFixed,
  };
}

export function useContent() {
  const state = inject<LayoutState>("layoutState");

  return {
    visible: computed(() => state?.content.visible),
    scrollable: computed(() => state?.content.scrollable),
  };
}
