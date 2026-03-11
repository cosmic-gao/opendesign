import { useContext } from 'react';
import { LayoutContext } from './Layout';

export function useSidebar() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useSidebar must be used within LayoutProvider');
  }

  return {
    collapsed: context.state.sidebar.collapsed,
    visible: context.state.sidebar.visible,
    width: context.state.sidebar.width,
    toggle: context.actions.sidebar.toggle,
    collapse: context.actions.sidebar.collapse,
    expand: context.actions.sidebar.expand,
    show: context.actions.sidebar.show,
    hide: context.actions.sidebar.hide,
    setCollapsed: context.actions.sidebar.setCollapsed,
  };
}

export function useHeader() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useHeader must be used within LayoutProvider');
  }

  return {
    visible: context.state.header.visible,
    fixed: context.state.header.fixed,
    height: context.state.header.height,
    show: context.actions.header.show,
    hide: context.actions.header.hide,
    setFixed: context.actions.header.setFixed,
  };
}

export function useFooter() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useFooter must be used within LayoutProvider');
  }

  return {
    visible: context.state.footer.visible,
    fixed: context.state.footer.fixed,
    height: context.state.footer.height,
    show: context.actions.footer.show,
    hide: context.actions.footer.hide,
    setFixed: context.actions.footer.setFixed,
  };
}
