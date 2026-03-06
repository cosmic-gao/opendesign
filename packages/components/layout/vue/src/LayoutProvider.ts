import { provide, inject, h, type InjectionKey, type Component } from 'vue';
import { createLayout } from './createLayout';
import type { UseLayoutReturn } from './types';
import type { CreateLayoutOptions } from './types';

/**
 * Layout Provider 注入键
 */
const LayoutProviderKey: InjectionKey<{
  useStore: () => UseLayoutReturn;
}> = Symbol('LayoutProvider');

/**
 * Layout Provider 组件属性
 */
interface LayoutProviderProps {
  /** 自定义配置 */
  config?: CreateLayoutOptions;
}

/**
 * Layout Provider 组件
 * 用于组件树中需要独立配置的场景
 * 
 * @example
 * <script setup>
 * import { LayoutProvider, useLayoutContext } from '@openlayout/vue';
 * </script>
 * 
 * <template>
 *   <LayoutProvider :config="{ breakpoints: { xs: 480, sm: 768 } }">
 *     <MainLayout />
 *   </LayoutProvider>
 * </template>
 */
export const LayoutProvider: Component<LayoutProviderProps> = {
  name: 'LayoutProvider',
  props: {
    config: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props: LayoutProviderProps) {
    const { useStore } = createLayout(props.config);
    
    provide(LayoutProviderKey, {
      useStore,
    });
    
    return () => h('div', { style: { display: 'contents' } });
  },
};

/**
 * 使用 Layout Context
 * 
 * @example
 * <script setup>
 * const layout = useLayoutContext();
 * const { collapsed, headerHeight } = layout();
 * </script>
 */
export function useLayoutContext(): () => UseLayoutReturn {
  const context = inject(LayoutProviderKey);
  
  if (!context) {
    throw new Error('useLayoutContext must be used within LayoutProvider');
  }
  
  return context.useStore;
}
