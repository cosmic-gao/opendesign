import { defineComponent, inject, computed, type ComputedRef } from 'vue';
import type { FooterProps } from '@openlayout/config';
import type { LayoutStyles } from '@openlayout/core';

export const Footer = defineComponent({
  name: 'ODFooter',
  props: {
    fixed: { type: Boolean, default: undefined },
    fullWidth: { type: Boolean, default: undefined },
    height: { type: Number, default: undefined },
    className: { type: String, default: '' },
    style: { type: Object, default: () => ({}) },
  },
  setup(props: FooterProps) {
    const layoutStyles = inject<ComputedRef<LayoutStyles>>('layoutStyles');
    const layoutState = inject<{ footer: { visible: boolean } }>('layoutState');

    const mergedStyle = computed(() => ({
      ...(layoutStyles?.value?.footer ?? {}),
      ...(props.height !== undefined ? { height: `${props.height}px` } : {}),
      ...(props.fixed !== undefined ? { position: props.fixed ? 'fixed' : 'relative' } : {}),
      ...props.style,
    }));

    const classNames = computed(() => [
      'od-layout-footer',
      props.className,
      { 'od-layout-footer--fixed': props.fixed },
      { 'od-layout-footer--full-width': props.fullWidth },
    ]);

    return { mergedStyle, classNames, layoutState };
  },
  render() {
    const { mergedStyle, classNames, layoutState, $slots } = this;
    if (layoutState?.footer.visible === false) return null;

    return (
      <footer class={classNames} style={mergedStyle}>
        {$slots.default?.()}
      </footer>
    );
  },
});
