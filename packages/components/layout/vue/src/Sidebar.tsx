import { defineComponent, inject, computed, type ComputedRef, type StyleValue } from 'vue';
import type { SidebarProps } from '@openlayout/config';
import type { LayoutStyles } from '@openlayout/core';

export const Sidebar = defineComponent((props: SidebarProps, { slots }) => {
  const layoutStyles = inject<ComputedRef<LayoutStyles>>('layoutStyles');
  const layoutState = inject<{ sidebar: { collapsed: boolean } }>('layoutState');

  const mergedStyle = computed<StyleValue>(() => {
    const isCollapsed = props.collapsed ?? layoutState?.sidebar.collapsed ?? false;
    const cssVars = layoutStyles?.value?.cssVariables ?? {};
    
    const currentWidth = isCollapsed 
      ? (props.collapsedWidth ?? cssVars['--od-sidebar-collapsed-width']) 
      : (props.width ?? cssVars['--od-sidebar-width']);

    return {
      ...(layoutStyles?.value?.sidebar ?? {}),
      width: `${currentWidth}px`,
      ...(props.style as Record<string, string | number>),
    };
  });

  const classNames = computed(() => [
    'od-layout-sidebar',
    props.className,
    { 'od-layout-sidebar--collapsed': props.collapsed ?? layoutState?.sidebar.collapsed },
    { 'od-layout-sidebar--full-height': props.fullHeight },
    { 'od-layout-sidebar--overlay': props.overlay },
  ]);

  return () => (
    <aside class={classNames.value} style={mergedStyle.value}>
      {slots.default?.()}
    </aside>
  );
});
