/**
 * OpenDesign Layout 状态管理器
 * 不可变状态管理
 */

import type { LayoutState, LayoutConfig, ActiveBreakpoint } from '@openlayout/type';

type Listener = (state: LayoutState) => void;

/**
 * 创建状态管理器
 * @param initialConfig - 初始配置
 * @returns 状态管理对象，包含 getState, setCollapsed, setBreakpoint 等方法
 */
export function createState(initialConfig: Partial<LayoutConfig>) {
  let state: LayoutState = {
    collapsed: initialConfig.defaultCollapsed ?? false,
    breakpoint: null,
  };

  const listeners = new Set<Listener>();

  return {
    /**
     * 获取当前状态（只读）
     * @returns 当前的 LayoutState 对象的只读副本
     */
    getState: (): Readonly<LayoutState> => state,
    
    /**
     * 设置折叠状态
     * @param collapsed - 新的折叠状态
     */
    setCollapsed: (collapsed: boolean) => {
      state = { ...state, collapsed };
      listeners.forEach(fn => fn(state));
    },
    
    /**
     * 设置当前断点
     * @param breakpoint - 当前激活的断点名称或 null
     */
    setBreakpoint: (breakpoint: ActiveBreakpoint) => {
      state = { ...state, breakpoint };
      listeners.forEach(fn => fn(state));
    },
    
    /**
     * 订阅状态变更
     * @param fn - 状态变更时的回调函数
     * @returns 取消订阅的函数
     */
    subscribe: (fn: Listener) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    
    /**
     * 切换折叠状态
     * 自动在 true/false 之间切换
     */
    toggleCollapsed: () => {
      state = { ...state, collapsed: !state.collapsed };
      listeners.forEach(fn => fn(state));
    },
  };
}
