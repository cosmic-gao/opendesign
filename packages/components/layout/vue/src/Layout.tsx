import { computed, h } from 'vue';
import type { LayoutProps } from '@openlayout/config';
import { provideLayout, useLayout } from './useLayout';

export function Layout(props: LayoutProps) {
  provideLayout(props);

  const layout = useLayout();

  const Tag = computed(() => props.as ?? 'div');

  const computedClass = computed(() => {
    const classes: string[] = ['layout'];

    if (layout.direction.value) {
      classes.push(`layout-${layout.direction.value}`);
    }

    if (layout.isMobile.value) {
      classes.push('layout-mobile');
    }

    if (layout.sidebarCollapsed.value) {
      classes.push('layout-sidebar-collapsed');
    }

    if (props.className) {
      classes.push(props.className);
    }

    return classes;
  });

  const computedStyle = computed(() => {
    const style: Record<string, string | number> = {};

    if (props.style) {
      Object.assign(style, props.style);
    }

    return style;
  });

  return () => h(Tag.value, { class: computedClass.value, style: computedStyle.value }, props.children);
}
