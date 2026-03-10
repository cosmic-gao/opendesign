import { useContext, computed } from 'react';
import { LayoutContext } from './Layout';
import type { Breakpoint } from '@openlayout/config';

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within LayoutProvider');
  }
  return context;
}

export function useSidebar() {
  const { state, actions } = useLayout();

  return {
    collapsed: computed(() => state.sidebar.collapsed),
    visible: computed(() => state.sidebar.visible),
    width: computed(() => state.sidebar.width),
    toggle: actions.sidebar.toggle,
    collapse: actions.sidebar.collapse,
    expand: actions.sidebar.expand,
    show: actions.sidebar.show,
    hide: actions.sidebar.hide,
    setCollapsed: actions.sidebar.setCollapsed,
  };
}

export function useHeader() {
  const { state, actions } = useLayout();

  return {
    visible: computed(() => state.header.visible),
    fixed: computed(() => state.header.fixed),
    height: computed(() => state.header.height),
    show: actions.header.show,
    hide: actions.header.hide,
    setFixed: actions.header.setFixed,
  };
}

export function useFooter() {
  const { state, actions } = useLayout();

  return {
    visible: computed(() => state.footer.visible),
    fixed: computed(() => state.footer.fixed),
    height: computed(() => state.footer.height),
    show: actions.footer.show,
    hide: actions.footer.hide,
    setFixed: actions.footer.setFixed,
  };
}
