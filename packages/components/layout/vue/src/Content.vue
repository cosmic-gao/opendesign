<template>
  <component :is="computedAs" :class="computedClass" :style="computedStyle">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLayout } from './useLayout';
import type { ContentProps } from '@openlayout/config';

const props = withDefaults(defineProps<ContentProps>(), {
  as: 'main',
  scrollable: true,
});

const layout = useLayout();

const computedAs = computed(() => props.as ?? 'main');

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
  const style: Record<string, string | number> = {
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
</script>

<style scoped>
.layout-content {
  flex: 1;
  min-width: 0;
}

.layout-content-scrollable {
  overflow: auto;
}
</style>
