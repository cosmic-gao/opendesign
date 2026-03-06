/**
 * @openlayout/react - React 适配器入口
 * 提供 React Hooks 与 Core 层交互
 */

// 主 Hooks
export { useLayout, getState, cleanup } from './useLayout';
export { createLayout } from './createLayout';

// 单一职责 Hooks
export { useCollapsed } from './useCollapsed';
export { useBreakpoint } from './useBreakpoint';

// 组件式 API
export { LayoutProvider, useLayoutContext } from './LayoutProvider';

// CSS 变量注入
export { inject } from '@openlayout/core';

// SSR 辅助
export { getServerState, createSSRConfig } from './ssr';

// 类型导出
export type { 
  UseLayoutReturn,
  CreateLayoutOptions,
  Breakpoint 
} from './types';
