import { computed, h } from 'vue';
import { useLayout } from './useLayout';
import { LAYOUT_DEFAULTS, type FooterProps } from '@openlayout/config';

type ExtendedFooterProps = FooterProps & {
  children?: import('vue').VNodeChild;
};

export function Footer(props: ExtendedFooterProps) {
  const layout = useLayout();

  const Tag = computed(() => props.as ?? 'footer');

  const computedClass = computed(() => {
    const classes: string[] = ['layout-footer'];

    if (props.fixed ?? layout.footerFixed.value) {
      classes.push('layout-footer-fixed');
    }

    if (props.fullWidth) {
      classes.push('layout-footer-full-width');
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

    const height = props.height ?? layout.footerHeight.value ?? LAYOUT_DEFAULTS.FOOTER_HEIGHT;
    style.minHeight = height;

    if (props.height) {
      style.height = props.height;
    }

    if (props.fixed ?? layout.footerFixed.value) {
      style.position = 'fixed';
      style.bottom = 0;
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
