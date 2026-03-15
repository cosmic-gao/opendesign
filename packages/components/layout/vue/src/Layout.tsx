import { defineComponent, computed, provide, reactive, ref, onMounted, onUnmounted, type PropType } from 'vue';
import { createResponsive, createLayoutState, createStylesheet } from '@openlayout/core';
import type { LayoutProps, LayoutConfig, Breakpoint } from '@openlayout/config';
import type { LayoutState, LayoutStyles, LayoutActions } from '@openlayout/core';

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
    const config = computed<LayoutConfig>(() => props as LayoutConfig);

    const breakpoint = ref<Breakpoint>('lg');
    const width = ref(0);

    const updateResponsive = () => {
      const current = createResponsive({ breakpoints: props.breakpoints, mobileBreakpoint: props.mobileBreakpoint });
      breakpoint.value = current.breakpoint;
      width.value = current.width;
      props.onBreakpointChange?.(current.breakpoint, current.width);
    };

    onMounted(() => {
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', updateResponsive);
        updateResponsive();
      }
    });

    onUnmounted(() => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateResponsive);
      }
    });

    const layoutState = createLayoutState(config.value);
    const state = reactive(layoutState);

    const actions: LayoutActions = {
      toggleSidebar: () => { state.sidebar.collapsed = !state.sidebar.collapsed; },
      setSidebarCollapsed: (v: boolean) => { state.sidebar.collapsed = v; },
      toggleHeader: () => { state.header.visible = !state.header.visible; },
      setHeaderVisible: (v: boolean) => { state.header.visible = v; },
      setHeaderFixed: (v: boolean) => { state.header.fixed = v; },
      toggleFooter: () => { state.footer.visible = !state.footer.visible; },
      setFooterVisible: (v: boolean) => { state.footer.visible = v; },
      setFooterFixed: (v: boolean) => { state.footer.fixed = v; },
    };

    const responsive = computed(() => ({
      breakpoint: breakpoint.value,
      width: width.value,
      isMobile: width.value < (props.mobileBreakpoint ?? 768),
    }));

    const styles = computed(() => createStylesheet(config.value, state, responsive.value, state.sidebar.collapsed));

    provide('layoutConfig', config);
    provide('layoutState', state);
    provide('layoutActions', actions);
    provide('layoutStyles', styles);
    provide('layoutResponsive', responsive);

    return { styles, state };
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
