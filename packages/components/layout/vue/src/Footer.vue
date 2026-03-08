<template>
  <component :is="computedAs" :class="computedClass" :style="computedStyle">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLayout } from './useLayout';
import { LAYOUT_DEFAULTS, type FooterProps } from '@openlayout/config';

const props = withDefaults(defineProps<FooterProps>(), {
  as: 'footer',
});

const layout = useLayout();

const computedAs = computed(() => props.as ?? 'footer');

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
  const style: Record<string, string | number> = {
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
</script>

<style scoped>
.layout-footer {
  flex-shrink: 0;
}

.layout-footer-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.layout-footer-full-width {
  width: 100%;
}
</style>
