import { computed, h, ref, watch, type VNodeChild } from 'vue';
import { useLayout } from './useLayout';
import type { SidebarProps } from '@openlayout/config';

export function Sidebar(props: SidebarProps) {
  const layout = useLayout();

  const isControlled = computed(() => props.collapsed !== undefined);

  const internalCollapsed = ref(props.defaultCollapsed ?? false);

  watch(() => props.defaultCollapsed, (newVal) => {
    internalCollapsed.value = newVal ?? false;
  });

  const collapsed = computed(() => {
    if (isControlled.value) {
      return props.collapsed ?? false;
    }
    return internalCollapsed.value;
  });

  const computedWidth = computed(() => {
    if (!props.visible) return 0;
    return collapsed.value
      ? (props.collapsedWidth ?? layout.collapsedWidth.value)
      : (props.width ?? layout.sidebarWidth.value);
  });

  const Tag = computed(() => props.as ?? 'aside');

  const handleToggle = () => {
    if (props.collapsible) {
      if (!isControlled.value) {
        internalCollapsed.value = !internalCollapsed.value;
      }
    }
  };

  const computedClass = computed(() => {
    const classes: string[] = ['layout-sidebar'];

    if (props.fullHeight) {
      classes.push('layout-sidebar-full-height');
    }

    if (collapsed.value) {
      classes.push('layout-sidebar-collapsed');
    }

    if (props.collapsible) {
      classes.push('layout-sidebar-collapsible');
    }

    if (layout.isMobile.value && props.overlay) {
      classes.push('layout-sidebar-overlay');
    }

    if (!props.visible) {
      classes.push('layout-sidebar-hidden');
    }

    if (props.className) {
      classes.push(props.className);
    }

    return classes;
  });

  const computedStyle = computed(() => {
    const style: Record<string, string | number | undefined> = {
      flexShrink: 0,
      width: computedWidth.value,
      transition: 'width 0.2s ease',
    };

    if (layout.isMobile.value && props.overlay) {
      style.position = 'fixed';
      style.top = 0;
      style.left = 0;
      style.bottom = 0;
      style.zIndex = 99;
    }

    if (props.fullHeight && !layout.isMobile.value) {
      style.height = '100%';
    }

    if (!props.visible) {
      style.overflow = 'hidden';
    }

    if (props.style) {
      Object.assign(style, props.style);
    }

    return style;
  });

  return () => h(Tag.value, {
    class: computedClass.value,
    style: computedStyle.value,
    onClick: handleToggle,
  }, props.children);
}
