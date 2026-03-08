<template>
  <component
    :is="computedAs"
    :class="computedClass"
    :style="computedStyle"
    @click="handleToggle"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useLayout } from './useLayout';
import type { SidebarProps } from '@openlayout/config';

const props = withDefaults(defineProps<SidebarProps>(), {
  as: 'aside',
  fullHeight: true,
  defaultCollapsed: false,
  visible: true,
});

const emit = defineEmits<{
  (e: 'update:collapsed', value: boolean): void;
  (e: 'collapsed-change', value: boolean): void;
}>();

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

watch(collapsed, (val) => {
  emit('update:collapsed', val);
  emit('collapsed-change', val);
});

const computedAs = computed(() => props.as ?? 'aside');

const handleToggle = () => {
  if (props.collapsible) {
    if (isControlled.value) {
      emit('update:collapsed', !props.collapsed);
      emit('collapsed-change', !props.collapsed);
    } else {
      internalCollapsed.value = !internalCollapsed.value;
      emit('update:collapsed', internalCollapsed.value);
      emit('collapsed-change', internalCollapsed.value);
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
  const style: Record<string, string | number> = {
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
</script>

<style scoped>
.layout-sidebar {
  flex-shrink: 0;
  transition: width 0.2s ease;
}

.layout-sidebar-full-height {
  height: 100%;
}

.layout-sidebar-collapsed {
  width: v-bind(computedWidth);
}

.layout-sidebar-collapsible {
  cursor: pointer;
}

.layout-sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 99;
}

.layout-sidebar-hidden {
  overflow: hidden;
}
</style>
