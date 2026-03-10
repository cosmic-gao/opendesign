import { defineComponent, inject, computed, type ComputedRef } from 'vue';
import type { SidebarProps } from '@openlayout/config';
import type { LayoutStyles } from '@openlayout/core';

export const Sidebar = defineComponent({
  name: 'ODSidebar',
  props: {
    collapsible: { type: Boolean, default: undefined },
    collapsed: { type: Boolean, default: undefined },
    defaultCollapsed: { type: Boolean, default: undefined },
    fullHeight: { type: Boolean, default: undefined },
    overlay: { type: Boolean, default: undefined },
    width: { type: Number, default: undefined },
    collapsedWidth: { type: Number, default: undefined },
    className: { type: String, default: '' },
    style: { type: Object, default: () => ({}) },
    onCollapsedChange: { type: Function, default: undefined },
  },
  setup(props: SidebarProps) {
    const layoutStyles = inject<ComputedRef<LayoutStyles>>('layoutStyles');
    const layoutState = inject<{ sidebar: { collapsed: boolean } }>('layoutState');

    const mergedStyle = computed(() => {
      const isCollapsed = props.collapsed ?? layoutState?.sidebar.collapsed ?? false;
      const cssVars = layoutStyles?.value?.cssVariables ?? {};
      
      const currentWidth = isCollapsed 
        ? (props.collapsedWidth ?? cssVars['--od-sidebar-collapsed-width']) 
        : (props.width ?? cssVars['--od-sidebar-width']);

      return {
        ...(layoutStyles?.value?.sidebar ?? {}),
        width: `${currentWidth}px`,
        ...props.style,
      };
    });

    const classNames = computed(() => [
      'od-layout-sidebar',
      props.className,
      { 'od-layout-sidebar--collapsed': props.collapsed ?? layoutState?.sidebar.collapsed },
      { 'od-layout-sidebar--full-height': props.fullHeight },
      { 'od-layout-sidebar--overlay': props.overlay },
    ]);

    return { mergedStyle, classNames };
  },
  render() {
    const { mergedStyle, classNames, $slots } = this;

    return (
      <aside class={classNames} style={mergedStyle}>
        {$slots.default?.()}
      </aside>
    );
  },
});
