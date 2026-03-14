import type { SidebarConfig } from '@openlayout/config';

export interface LayoutState {
  sidebar: {
    collapsed: boolean;
    visible: boolean;
    width: number;
  };
  header: {
    visible: boolean;
    fixed: boolean;
    height: number;
  };
  footer: {
    visible: boolean;
    fixed: boolean;
    height: number;
  };
  content: {
    visible: boolean;
  };
}

export interface LayoutActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleHeader: () => void;
  setHeaderVisible: (visible: boolean) => void;
  setHeaderFixed: (fixed: boolean) => void;
  toggleFooter: () => void;
  setFooterVisible: (visible: boolean) => void;
  setFooterFixed: (fixed: boolean) => void;
}

export interface UseLayoutStateOptions {
  sidebar?: SidebarConfig;
  header?: { enabled?: boolean; height?: number; fixed?: boolean };
  footer?: { enabled?: boolean; height?: number; fixed?: boolean };
}

export interface LayoutStore {
  state: LayoutState;
  actions: LayoutActions;
}

export function createStore(options: UseLayoutStateOptions = {}): LayoutStore {
  const sidebarCollapsed = options.sidebar?.collapsed ?? false;
  const sidebarVisible = options.sidebar?.enabled ?? true;

  return {
    state: {
      sidebar: { collapsed: sidebarCollapsed, visible: sidebarVisible, width: options.sidebar?.width ?? 200 },
      header: { visible: options.header?.enabled ?? true, fixed: options.header?.fixed ?? false, height: options.header?.height ?? 64 },
      footer: { visible: options.footer?.enabled ?? true, fixed: options.footer?.fixed ?? false, height: options.footer?.height ?? 48 },
      content: { visible: true },
    },
    actions: {
      toggleSidebar: () => {},
      setSidebarCollapsed: () => {},
      toggleHeader: () => {},
      setHeaderVisible: () => {},
      setHeaderFixed: () => {},
      toggleFooter: () => {},
      setFooterVisible: () => {},
      setFooterFixed: () => {},
    },
  };
}
