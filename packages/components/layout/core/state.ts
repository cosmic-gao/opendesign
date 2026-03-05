/**
 * OpenDesign Layout 状态管理器
 * 不可变状态管理
 */

import type { LayoutState, LayoutConfig, ActiveBreakpoint } from '@openlayout/type';

type Listener = (state: LayoutState) => void;

/**
 * 创建状态管理器
 * @param initialConfig - 初始配置
 * @returns 状态管理对象
 */
export function createState(initialConfig: Partial<LayoutConfig>) {
  let state: LayoutState = {
    collapsed: initialConfig.defaultCollapsed ?? false,
    activeBreakpoint: null,
  };

  const listeners = new Set<Listener>();

  return {
    /**
     * 获取当前状态（只读）
     */
    getState: (): Readonly<LayoutState> => state,
    
    /**
     * 设置折叠状态
     */
    setCollapsed: (collapsed: boolean) => {
      state = { ...state, collapsed };
      listeners.forEach(fn => fn(state));
    },
    
    /**
     * 设置当前断点
     */
    setBreakpoint: (breakpoint: ActiveBreakpoint) => {
      state = { ...state, activeBreakpoint: breakpoint };
      listeners.forEach(fn => fn(state));
    },
    
    /**
     * 订阅状态变更
     */
    subscribe: (fn: Listener) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    
    /**
     * 切换折叠状态
     */
    toggleCollapsed: () => {
      state = { ...state, collapsed: !state.collapsed };
      listeners.forEach(fn => fn(state));
    },
  };
}
