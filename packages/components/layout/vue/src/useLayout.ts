import { createLayout } from './createLayout';
import type { UseLayoutReturn } from './types';

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
export const useLayout = createLayout();

export type { UseLayoutReturn };
