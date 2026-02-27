/**
 * OpenDesign Layout 状态管理器
 * 创建布局状态并提供订阅机制
 */

import type { LayoutState, LayoutConfig } from '@openlayout/type';

/**
 * 状态变更监听器类型
 */
type Listener = (state: LayoutState) => void;

/**
 * 创建状态
 * @param initialConfig - 初始配置
 * @returns 状态管理对象
 */
export function createState(initialConfig: Partial<LayoutConfig>) {
  const state: LayoutState = {
    collapsed: initialConfig.defaultCollapsed ?? false,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    theme: initialConfig.defaultTheme ?? 'light',
    activeRoute: '/',
  };

  const listeners = new Set<Listener>();

  return {
    /**
     * 获取当前状态
     */
    getState: () => state,

    /**
     * 更新状态
     * @param partial - 部分状态更新
     */
    setState: (partial: Partial<LayoutState>) => {
      Object.assign(state, partial);
      listeners.forEach(fn => fn(state));
    },

    /**
     * 订阅状态变更
     * @param fn - 监听函数
     * @returns 取消订阅函数
     */
    subscribe: (fn: Listener) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    /**
     * 切换侧边栏折叠状态
     */
    toggleCollapsed: () => {
      state.collapsed = !state.collapsed;
      listeners.forEach(fn => fn(state));
    },

    /**
     * 设置主题
     * @param theme - 主题名称
     */
    setTheme: (theme: 'light' | 'dark') => {
      state.theme = theme;
      listeners.forEach(fn => fn(state));
    },
  };
}
