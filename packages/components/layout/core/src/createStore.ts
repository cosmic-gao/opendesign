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
}

export interface LayoutActions {
  sidebar: {
    toggle: () => void;
    collapse: () => void;
    expand: () => void;
    show: () => void;
    hide: () => void;
    setCollapsed: (collapsed: boolean) => void;
  };
  header: {
    show: () => void;
    hide: () => void;
    setFixed: (fixed: boolean) => void;
  };
  footer: {
    show: () => void;
    hide: () => void;
    setFixed: (fixed: boolean) => void;
  };
}

export interface UseLayoutStateOptions {
  sidebar?: SidebarConfig;
  header?: { height?: number; fixed?: boolean };
  footer?: { height?: number; fixed?: boolean };
}

export interface LayoutStore {
  state: LayoutState;
  actions: LayoutActions;
}

/**
 * 创建布局状态仓库
 * 
 * @description
 * 初始化布局状态并提供操作方法。
 * 此函数仅返回初始状态和空操作函数，实际响应式逻辑由框架层实现。
 * 
 * @param {UseLayoutStateOptions} [options={}] - 初始配置
 * @returns {LayoutStore} 状态和操作
 */
export function createStore(options: UseLayoutStateOptions = {}): LayoutStore {
  const sidebarCollapsed = options.sidebar?.defaultCollapsed ?? false;
  const sidebarVisible = true;

  return {
    state: {
      sidebar: { collapsed: sidebarCollapsed, visible: sidebarVisible, width: options.sidebar?.width ?? 200 },
      header: { visible: true, fixed: options.header?.fixed ?? false, height: options.header?.height ?? 64 },
      footer: { visible: true, fixed: options.footer?.fixed ?? false, height: options.footer?.height ?? 48 },
    },
    actions: {
      sidebar: {
        toggle: () => {},
        collapse: () => {},
        expand: () => {},
        show: () => {},
        hide: () => {},
        setCollapsed: () => {},
      },
      header: { show: () => {}, hide: () => {}, setFixed: () => {} },
      footer: { show: () => {}, hide: () => {}, setFixed: () => {} },
    },
  };
}
