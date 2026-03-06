import { computed, type ComputedRef } from 'vue';
import { useStore } from '@nanostores/vue';
import { $layoutState } from '@openlayout/core';
import type { Breakpoint } from './types';

/**
 * 断点 Composable
 * 订阅当前响应式断点
 * 
 * @returns 当前断点名称（Ref）
 * 
 * @example
 * <script setup>
 * import { useBreakpoint } from '@openlayout/vue';
 * 
 * const breakpoint = useBreakpoint();
 * // breakpoint.value: 'xs' | 'sm' | 'md' | 'lg' | null
 * </script>
 */
export function useBreakpoint(): ComputedRef<Breakpoint | null> {
  const state = useStore($layoutState);
  return computed(() => state.value.breakpoint as Breakpoint);
}
