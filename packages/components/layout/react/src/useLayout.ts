import { createLayout } from './createLayout';
import type { UseLayoutReturn } from './types';

/**
 * 默认布局 Hook（零配置）
 * 使用内置默认配置，无需任何设置
 * 
 * @example
 * import { useLayout } from '@openlayout/react';
 * 
 * function App() {
 *   const { collapsed, toggleCollapsed, headerHeight, sidebarWidth } = useLayout();
 *   // ...
 * }
 */
export const useLayout = createLayout();

export type { UseLayoutReturn };
