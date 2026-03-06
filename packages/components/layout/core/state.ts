/**
 * OpenDesign Layout 状态管理器
 * 基于 Nanostores 实现
 */

import { atom } from 'nanostores';
import type { LayoutState, LayoutConfig } from '@openlayout/type';

export const $layoutState = atom<LayoutState>({
  collapsed: false,
  breakpoint: null,
});

export function initState(config: Partial<LayoutConfig>): void {
  $layoutState.set({
    collapsed: config.defaultCollapsed ?? false,
    breakpoint: null,
  });
}

export function setCollapsed(collapsed: boolean): void {
  $layoutState.set({ ...$layoutState.get(), collapsed });
}

export function toggleCollapsed(): void {
  const current = $layoutState.get();
  $layoutState.set({ ...current, collapsed: !current.collapsed });
}

export function setBreakpoint(breakpoint: string | null): void {
  $layoutState.set({ ...$layoutState.get(), breakpoint });
}

export function useLayoutState(): LayoutState {
  return $layoutState.get();
}

/**
 * 创建状态管理器（保留 API 兼容性）
 * @param _initialConfig - 初始配置（暂未使用，预留）
 * @returns 状态管理对象
 */
export function createState(_initialConfig?: Partial<LayoutConfig>) {
  return {
    getState: useLayoutState,
    setCollapsed,
    setBreakpoint,
    toggleCollapsed,
    subscribe: (fn: (state: LayoutState) => void) => {
      const unsubscribe = $layoutState.subscribe(fn);
      return unsubscribe;
    },
  };
}
