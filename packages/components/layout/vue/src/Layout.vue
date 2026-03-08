<template>
  <component :is="computedAs" :class="computedClass" :style="computedStyle">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { provideLayout, useLayout } from './useLayout';
import type { LayoutProps } from '@openlayout/config';

const props = withDefaults(defineProps<LayoutProps>(), {
  as: 'div',
});

provideLayout(props);

const layout = useLayout();

const computedAs = computed(() => props.as ?? 'div');

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
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.layout-vertical {
  flex-direction: column;
}

.layout-horizontal {
  flex-direction: row;
}

.layout-sidebar-collapsed {
  transition: all 0.2s ease;
}
</style>
