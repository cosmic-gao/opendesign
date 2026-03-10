import { computed, h, type VNodeChild } from 'vue';
import { useLayout } from './useLayout';
import type { ContentProps } from '@openlayout/config';

export function Content(props: ContentProps) {
  const layout = useLayout();

  const Tag = computed(() => props.as ?? 'main');

  const computedClass = computed(() => {
    const classes: string[] = ['layout-content'];

    if (props.scrollable && layout.contentScrollable.value) {
      classes.push('layout-content-scrollable');
    }

    if (props.className) {
      classes.push(props.className);
    }

    return classes;
  });

  const computedStyle = computed(() => {
    const style: Record<string, string | number | undefined> = {
      flex: 1,
      minWidth: 0,
    };

    if (props.scrollable && layout.contentScrollable.value) {
      style.overflow = 'auto';
    }

    if (props.style) {
      Object.assign(style, props.style);
    }

    return style;
  });

  return () => h(Tag.value, { class: computedClass.value, style: computedStyle.value }, props.children);
}
