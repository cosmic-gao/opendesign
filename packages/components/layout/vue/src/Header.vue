<template>
  <component :is="computedAs" :class="computedClass" :style="computedStyle">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLayout } from './useLayout';
import { LAYOUT_DEFAULTS, type HeaderProps } from '@openlayout/config';

const props = withDefaults(defineProps<HeaderProps>(), {
  as: 'header',
});

const layout = useLayout();

const computedAs = computed(() => props.as ?? 'header');

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
  const style: Record<string, string | number> = {
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
</script>

<style scoped>
.layout-header {
  flex-shrink: 0;
}

.layout-header-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.layout-header-full-width {
  width: 100%;
}
</style>
