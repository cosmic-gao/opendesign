import { useStore } from '@nanostores/react';
import { 
  $layoutState, 
  setCollapsed, 
  toggleCollapsed as coreToggleCollapsed 
} from '@openlayout/core';

/**
 * 折叠状态 Hook
 * 订阅并操作侧边栏折叠状态
 * 
 * @returns [collapsed, toggleCollapsed, setCollapsed]
 * 
 * @example
 * import { useCollapsed } from '@openlayout/react';
 * 
 * function Sidebar() {
 *   const [collapsed, toggleCollapsed, setCollapsed] = useCollapsed();
 *   // ...
 * }
 */
export function useCollapsed(): [
  boolean, 
  () => void, 
  (value: boolean) => void
] {
  const state = useStore($layoutState);
  return [
    state.collapsed,
    coreToggleCollapsed,
    setCollapsed,
  ];
}
