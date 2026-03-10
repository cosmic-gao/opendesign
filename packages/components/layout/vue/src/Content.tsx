import { defineComponent, inject, computed, type ComputedRef } from 'vue';
import type { ContentProps } from '@openlayout/config';
import type { LayoutStyles } from '@openlayout/core';

export const Content = defineComponent({
  name: 'ODContent',
  props: {
    scrollable: { type: Boolean, default: undefined },
    className: { type: String, default: '' },
    style: { type: Object, default: () => ({}) },
  },
  setup(props: ContentProps) {
    const layoutStyles = inject<ComputedRef<LayoutStyles>>('layoutStyles');

    const mergedStyle = computed(() => ({
      ...(layoutStyles?.value?.content ?? {}),
      ...(props.scrollable === false ? { overflow: 'hidden' } : 
          props.scrollable === true ? { overflow: 'auto' } : {}),
      ...props.style,
    }));

    return { mergedStyle };
  },
  render() {
    const { mergedStyle, className, $slots } = this;
    const rootClass = ['od-layout-content', className];

    return (
      <main class={rootClass} style={mergedStyle}>
        {$slots.default?.()}
      </main>
    );
  },
});
