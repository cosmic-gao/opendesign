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
    min: context.state.sidebar.width,
    toggle: context.actions.toggleSidebar,
    setCollapsed: context.actions.setSidebarCollapsed,
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
    setVisible: context.actions.setHeaderVisible,
    setFixed: context.actions.setHeaderFixed,
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
    setVisible: context.actions.setFooterVisible,
    setFixed: context.actions.setFooterFixed,
  };
}

export function useContent() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useContent must be used within LayoutProvider');
  }

  return {
    visible: context.state.content.visible,
    scrollable: true,
  };
}
