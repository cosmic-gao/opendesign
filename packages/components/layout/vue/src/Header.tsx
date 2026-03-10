import { defineComponent, inject, computed, type ComputedRef, type StyleValue } from 'vue';
import type { HeaderProps } from '@openlayout/config';
import type { LayoutStyles } from '@openlayout/core';

export const Header = defineComponent((props: HeaderProps, { slots }) => {
  const layoutStyles = inject<ComputedRef<LayoutStyles>>('layoutStyles');
  const layoutState = inject<{ header: { visible: boolean } }>('layoutState');

  const mergedStyle = computed<StyleValue>(() => ({
    ...(layoutStyles?.value?.header ?? {}),
    ...(props.height !== undefined ? { height: `${props.height}px` } : {}),
    ...(props.fixed !== undefined ? { position: props.fixed ? 'fixed' : 'relative' } : {}),
    ...(props.style as Record<string, string | number>),
  }));

  const classNames = computed(() => [
    'od-layout-header',
    props.className,
    { 'od-layout-header--fixed': props.fixed },
    { 'od-layout-header--full-width': props.fullWidth },
  ]);

  return () => {
    if (layoutState?.header.visible === false) return null;

    return (
      <header class={classNames.value} style={mergedStyle.value}>
        {slots.default?.()}
      </header>
    );
  };
});
