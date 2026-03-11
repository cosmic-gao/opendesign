import { defineComponent, computed, provide, reactive, ref, onMounted, onUnmounted, type PropType } from 'vue';
import { createResponsive, createStore, createStylesheet } from '@openlayout/core';
import type { LayoutProps, LayoutConfig, Breakpoint, ThemeMode } from '@openlayout/config';
import { resolveConfig } from '@openlayout/config';

export const Layout = defineComponent({
  name: 'ODLayout',
  props: {
    header: { type: Object as PropType<LayoutProps['header']>, default: () => ({}) },
    footer: { type: Object as PropType<LayoutProps['footer']>, default: () => ({}) },
    sidebar: { type: Object as PropType<LayoutProps['sidebar']>, default: () => ({}) },
    content: { type: Object as PropType<LayoutProps['content']>, default: () => ({}) },
    breakpoints: { type: Object as PropType<LayoutProps['breakpoints']>, default: undefined },
    mobileBreakpoint: { type: Number, default: 768 },
    animated: { type: Boolean, default: true },
    animationDuration: { type: Number, default: 200 },
    className: { type: String, default: '' },
    style: { type: Object as PropType<Record<string, string | number>>, default: () => ({}) },
    onBreakpointChange: { type: Function as PropType<LayoutProps['onBreakpointChange']>, default: undefined },
    onThemeChange: { type: Function as PropType<LayoutProps['onThemeChange']>, default: undefined },
    theme: { type: String as PropType<ThemeMode>, default: 'light' },
  },
  setup(props) {
    const config = computed<LayoutConfig>(() => resolveConfig(props as LayoutProps));

    // Reactive Responsive State
    const responsiveHelper = createResponsive({ breakpoints: props.breakpoints });
    const breakpoint = ref<Breakpoint>(responsiveHelper.breakpoint);
    const width = ref(typeof window !== 'undefined' ? window.innerWidth : 0);
    const isMobile = computed(() => width.value < (props.mobileBreakpoint ?? 768));

    const updateResponsive = () => {
      const current = createResponsive({ breakpoints: props.breakpoints });
      if (current.breakpoint !== breakpoint.value) {
        breakpoint.value = current.breakpoint;
        props.onBreakpointChange?.(current.breakpoint, window.innerWidth);
      }
      width.value = window.innerWidth;
    };

    onMounted(() => {
      window.addEventListener('resize', updateResponsive);
      updateResponsive();
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateResponsive);
    });

    // Reactive Layout State
    const store = createStore(config.value);
    // Make state reactive
    // We need to sync store state with props if controlled, but for now let's use the store state as source of truth for internal logic
    // But store.state is a plain object. We wrap it in reactive.
    const layoutState = reactive(store.state);
    
    // Override actions to update reactive state
    // Since createStore actions are empty in Core (it says "actual reactive logic by framework"), we need to implement them here or in a hook.
    // The Core `createStore` is just a factory for initial state and empty actions.
    // We need to implement the actions to mutate `layoutState`.
    const actions = {
      sidebar: {
        toggle: () => { layoutState.sidebar.collapsed = !layoutState.sidebar.collapsed; },
        collapse: () => { layoutState.sidebar.collapsed = true; },
        expand: () => { layoutState.sidebar.collapsed = false; },
        show: () => { layoutState.sidebar.visible = true; },
        hide: () => { layoutState.sidebar.visible = false; },
        setCollapsed: (v: boolean) => { layoutState.sidebar.collapsed = v; },
      },
      header: {
        show: () => { layoutState.header.visible = true; },
        hide: () => { layoutState.header.visible = false; },
        setFixed: (v: boolean) => { layoutState.header.fixed = v; },
      },
      footer: {
        show: () => { layoutState.footer.visible = true; },
        hide: () => { layoutState.footer.visible = false; },
        setFixed: (v: boolean) => { layoutState.footer.fixed = v; },
      },
    };

    // Styles
    const styles = computed(() => createStylesheet({
      config: config.value,
      breakpoint: breakpoint.value,
      isMobile: isMobile.value,
      collapsed: layoutState.sidebar.collapsed,
    }));

    provide('layoutConfig', config);
    provide('layoutState', layoutState);
    provide('layoutActions', actions); // Need to provide actions for hooks
    provide('layoutStyles', styles);
    provide('layoutResponsive', { breakpoint, width, isMobile }); // Provide responsive info

    return { styles, layoutState };
  },
  render() {
    const { styles, $slots, className, style } = this;
    const rootClass = ['od-layout', className];

    return (
      <div class={rootClass} style={{ ...styles.root, ...style }}>
        {$slots.default?.()}
      </div>
    );
  },
});
