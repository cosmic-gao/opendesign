import { computed, h } from 'vue';
import { useLayout } from './useLayout';
import { LAYOUT_DEFAULTS, type HeaderProps } from '@openlayout/config';

type ExtendedHeaderProps = HeaderProps & {
  children?: import('vue').VNodeChild;
};

export function Header(props: ExtendedHeaderProps) {
  const layout = useLayout();

  const Tag = computed(() => props.as ?? 'header');

  const computedClass = computed(() => {
    const classes: string[] = ['layout-header'];

    if (props.fixed ?? layout.headerFixed.value) {
      classes.push('layout-header-fixed');
    }

    if (props.fullWidth) {
      classes.push('layout-header-full-width');
    }

    if (props.className) {
      classes.push(props.className);
    }

    return classes;
  });

  const computedStyle = computed(() => {
    const style: Record<string, string | number | undefined> = {
      flexShrink: 0,
    };

    const height = props.height ?? layout.headerHeight.value ?? LAYOUT_DEFAULTS.HEADER_HEIGHT;
    style.minHeight = height;

    if (props.height) {
      style.height = props.height;
    }

    if (props.fixed ?? layout.headerFixed.value) {
      style.position = 'fixed';
      style.top = 0;
      style.left = 0;
      style.right = 0;
      style.zIndex = 100;
    }

    if (props.style) {
      Object.assign(style, props.style);
    }

    return style;
  });

  return () => h(Tag.value, { class: computedClass.value, style: computedStyle.value }, props.children);
}
