import { createContext, useContext, type ReactNode } from 'react';
import { createLayout } from './createLayout';
import type { UseLayoutReturn } from './types';
import type { CreateLayoutOptions } from './types';

/**
 * Layout Context 类型
 */
interface LayoutContextValue {
  useStore: () => UseLayoutReturn;
}

/**
 * 创建 Layout Context
 */
const LayoutContext = createContext<LayoutContextValue | null>(null);

/**
 * Layout Provider 组件属性
 */
interface LayoutProviderProps {
  /** 子组件 */
  children: ReactNode;
  /** 自定义配置 */
  config?: CreateLayoutOptions;
}

/**
 * Layout Provider 组件
 * 用于组件树中需要独立配置的场景
 * 
 * @example
 * import { LayoutProvider, useLayoutContext } from '@openlayout/react';
 * 
 * function App() {
 *   return (
 *     <LayoutProvider config={{ breakpoints: { xs: 480, sm: 768 } }}>
 *       <MainLayout />
 *     </LayoutProvider>
 *   );
 * }
 * 
 * function MainLayout() {
 *   const { collapsed, headerHeight } = useLayoutContext();
 *   // ...
 * }
 */
export function LayoutProvider({ children, config }: LayoutProviderProps) {
  const { useStore } = createLayout(config);
  
  const value: LayoutContextValue = {
    useStore,
  };
  
  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

/**
 * 使用 Layout Context
 * 
 * @example
 * function MainLayout() {
 *   const { collapsed, headerHeight, sidebarWidth } = useLayoutContext();
 *   // ...
 * }
 */
export function useLayoutContext(): UseLayoutReturn {
  const context = useContext(LayoutContext);
  
  if (!context) {
    throw new Error('useLayoutContext must be used within LayoutProvider');
  }
  
  return context.useStore();
}
