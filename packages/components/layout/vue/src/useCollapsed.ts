import { computed, type ComputedRef } from 'vue';
import { useStore } from '@nanostores/vue';
import { 
  $layoutState, 
  setCollapsed, 
  toggleCollapsed as coreToggleCollapsed 
} from '@openlayout/core';

/**
 * 折叠状态 Composable
 * 订阅并操作侧边栏折叠状态
 * 
 * @returns [collapsed, toggleCollapsed, setCollapsed]
 * 
 * @example
 * <script setup>
 * import { useCollapsed } from '@openlayout/vue';
 * 
 * const [collapsed, toggleCollapsed, setCollapsed] = useCollapsed();
 * </script>
 */
export function useCollapsed(): [
  ComputedRef<boolean>, 
  () => void, 
  (value: boolean) => void
] {
  const state = useStore($layoutState);
  return [
    computed(() => state.value.collapsed),
    coreToggleCollapsed,
    setCollapsed,
  ];
}
