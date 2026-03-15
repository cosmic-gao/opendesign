import { defineComponent, inject, computed, type ComputedRef, type StyleValue } from 'vue';
import type { FooterConfig } from '@openlayout/config';
import type { LayoutStyles } from '@openlayout/core';

export type FooterProps = FooterConfig & { className?: string; style?: Record<string, string | number> };

export const Footer = defineComponent((props: FooterProps, { slots }) => {
  const layoutStyles = inject<ComputedRef<LayoutStyles>>('layoutStyles');
  const layoutState = inject<{ footer: { visible: boolean } }>('layoutState');

  const mergedStyle = computed<StyleValue>(() => ({
    ...(layoutStyles?.value?.footer ?? {}),
    ...(props.height !== undefined ? { height: `${props.height}px` } : {}),
    ...(props.fixed !== undefined ? { position: props.fixed ? 'fixed' : 'relative' } : {}),
    ...(props.style as Record<string, string | number>),
  }));

  const classNames = computed(() => [
    'od-layout-footer',
    props.className,
    { 'od-layout-footer--fixed': props.fixed },
    { 'od-layout-footer--full': props.full },
  ]);

  return () => {
    if (layoutState?.footer.visible === false) return null;

    return (
      <footer class={classNames.value} style={mergedStyle.value}>
        {slots.default?.()}
      </footer>
    );
  };
});
