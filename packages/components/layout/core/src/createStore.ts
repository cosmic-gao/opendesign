import type { SidebarConfig, HeaderConfig, FooterConfig } from '@openlayout/config';

export interface LayoutState {
  sidebar: {
    collapsed: boolean;
    visible: boolean;
    width: number;
    min: number;
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

export interface UseLayoutStateOptions {
  sidebar?: SidebarConfig;
  header?: { enabled?: boolean; height?: number; fixed?: boolean };
  footer?: { enabled?: boolean; height?: number; fixed?: boolean };
}

export function createStore(options: UseLayoutStateOptions = {}): { state: LayoutState } {
  const sidebarCollapsed = options.sidebar?.collapsed ?? false;
  const sidebarEnabled = options.sidebar?.enabled ?? true;

  return {
    state: {
      sidebar: { 
        collapsed: sidebarCollapsed, 
        visible: sidebarEnabled, 
        width: options.sidebar?.width ?? 200,
        min: options.sidebar?.min ?? 80,
      },
      header: { 
        visible: options.header?.enabled ?? true, 
        fixed: options.header?.fixed ?? false, 
        height: options.header?.height ?? 64,
      },
      footer: { 
        visible: options.footer?.enabled ?? true, 
        fixed: options.footer?.fixed ?? false, 
        height: options.footer?.height ?? 48,
      },
      content: { visible: true },
    },
  };
}
