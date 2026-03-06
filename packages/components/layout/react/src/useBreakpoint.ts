import { useStore } from '@nanostores/react';
import { $layoutState } from '@openlayout/core';
import type { Breakpoint } from './types';

/**
 * 断点 Hook
 * 订阅当前响应式断点
 * 
 * @returns 当前断点名称
 * 
 * @example
 * import { useBreakpoint } from '@openlayout/react';
 * 
 * function Component() {
 *   const breakpoint = useBreakpoint();
 *   // breakpoint: 'xs' | 'sm' | 'md' | 'lg' | null
 * }
 */
export function useBreakpoint(): Breakpoint {
  const state = useStore($layoutState);
  return state.breakpoint as Breakpoint;
}
