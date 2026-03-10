import { defineComponent, inject, computed, type ComputedRef } from 'vue';
import type { HeaderProps } from '@openlayout/config';
import type { LayoutStyles } from '@openlayout/core';

export const Header = defineComponent({
  name: 'ODHeader',
  props: {
    fixed: { type: Boolean, default: undefined },
    fullWidth: { type: Boolean, default: undefined },
    height: { type: Number, default: undefined },
    className: { type: String, default: '' },
    style: { type: Object, default: () => ({}) },
  },
  setup(props: HeaderProps) {
    const layoutStyles = inject<ComputedRef<LayoutStyles>>('layoutStyles');
    const layoutState = inject<{ header: { visible: boolean } }>('layoutState');

    const mergedStyle = computed(() => ({
      ...(layoutStyles?.value?.header ?? {}),
      ...(props.height !== undefined ? { height: `${props.height}px` } : {}),
      ...(props.fixed !== undefined ? { position: props.fixed ? 'fixed' : 'relative' } : {}),
      ...props.style,
    }));

    const classNames = computed(() => [
      'od-layout-header',
      props.className,
      { 'od-layout-header--fixed': props.fixed },
      { 'od-layout-header--full-width': props.fullWidth },
    ]);

    return { mergedStyle, classNames, layoutState };
  },
  render() {
    const { mergedStyle, classNames, layoutState, $slots } = this;
    if (layoutState?.header.visible === false) return null;

    return (
      <header class={classNames} style={mergedStyle}>
        {$slots.default?.()}
      </header>
    );
  },
});
