import { createLayout } from './createLayout';

const defaultLayoutStore = createLayout();

/**
 * 默认布局 Composable（零配置）
 * 使用内置默认配置，无需任何设置
 * 
 * @example
 * <script setup>
 * import { useLayout } from '@openlayout/vue';
 * 
 * const { collapsed, toggleCollapsed, headerHeight, sidebarWidth } = useLayout();
 * </script>
 * 
 * <template>
 *   <div :style="{ height: headerHeight + 'px' }">
 *     <!-- ... -->
 *   </div>
 * </template>
 */
export const useLayout = defaultLayoutStore.useStore;

export const getState = defaultLayoutStore.getState;
export const cleanup = defaultLayoutStore.cleanup;
