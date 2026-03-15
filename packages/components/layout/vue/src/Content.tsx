import { defineComponent, inject, computed, type ComputedRef, type StyleValue } from 'vue';
import type { ContentConfig } from '@openlayout/config';
import type { LayoutStyles } from '@openlayout/core';

export type ContentProps = ContentConfig & { className?: string; style?: Record<string, string | number> };

export const Content = defineComponent((props: ContentProps, { slots }) => {
  const layoutStyles = inject<ComputedRef<LayoutStyles>>('layoutStyles');
  const layoutState = inject<{ content: { visible: boolean } }>('layoutState');

  const mergedStyle = computed<StyleValue>(() => ({
    ...(layoutStyles?.value?.content ?? {}),
    ...(props.scrollable === false ? { overflow: 'hidden' } : 
        props.scrollable === true ? { overflow: 'auto' } : {}),
    ...(props.style as Record<string, string | number>),
  }));

  const rootClass = computed(() => ['od-layout-content', props.className]);

  return () => {
    if (layoutState?.content.visible === false) return null;
    return (
      <main class={rootClass.value} style={mergedStyle.value}>
        {slots.default?.()}
      </main>
    );
  };
});
