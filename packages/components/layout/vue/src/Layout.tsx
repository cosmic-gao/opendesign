import { defineComponent, computed, provide, reactive, ref, onMounted, onUnmounted, type PropType } from 'vue';
import { createResponsive, createStore, createStylesheet } from '@openlayout/core';
import type { LayoutProps, LayoutConfig, Breakpoint } from '@openlayout/config';
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
    animation: { type: Object as PropType<LayoutProps['animation']>, default: () => ({}) },
    className: { type: String, default: '' },
    style: { type: Object as PropType<Record<string, string | number>>, default: () => ({}) },
    onBreakpointChange: { type: Function as PropType<LayoutProps['onBreakpointChange']>, default: undefined },
  },
  setup(props) {
    const config = computed<LayoutConfig>(() => resolveConfig(props as LayoutProps));

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

    const store = createStore(config.value);
    const layoutState = reactive(store.state);

    const actions = {
      toggleSidebar: () => { layoutState.sidebar.collapsed = !layoutState.sidebar.collapsed; },
      setSidebarCollapsed: (v: boolean) => { layoutState.sidebar.collapsed = v; },
      toggleHeader: () => { layoutState.header.visible = !layoutState.header.visible; },
      setHeaderVisible: (v: boolean) => { layoutState.header.visible = v; },
      setHeaderFixed: (v: boolean) => { layoutState.header.fixed = v; },
      toggleFooter: () => { layoutState.footer.visible = !layoutState.footer.visible; },
      setFooterVisible: (v: boolean) => { layoutState.footer.visible = v; },
      setFooterFixed: (v: boolean) => { layoutState.footer.fixed = v; },
    };

    const styles = computed(() => createStylesheet({
      config: config.value,
      breakpoint: breakpoint.value,
      isMobile: isMobile.value,
      collapsed: layoutState.sidebar.collapsed,
    }));

    provide('layoutConfig', config);
    provide('layoutState', layoutState);
    provide('layoutActions', actions);
    provide('layoutStyles', styles);
    provide('layoutResponsive', { breakpoint, width, isMobile });

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
