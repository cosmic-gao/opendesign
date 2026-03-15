import { defineComponent, computed, provide, reactive, onMounted, onUnmounted, type PropType, type ExtractPropTypes } from 'vue';
import { createResponsive, createStore, createStylesheet } from '@openlayout/core';
import type { LayoutConfig } from '@openlayout/config';
import type { ResponsiveState } from '@openlayout/core';

interface LayoutActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (value: boolean) => void;
  toggleHeader: () => void;
  setHeaderVisible: (value: boolean) => void;
  setHeaderFixed: (value: boolean) => void;
  toggleFooter: () => void;
  setFooterVisible: (value: boolean) => void;
  setFooterFixed: (value: boolean) => void;
}

const propTypes = {
  header: { type: Object as PropType<LayoutConfig['header']>, default: () => ({}) },
  footer: { type: Object as PropType<LayoutConfig['footer']>, default: () => ({}) },
  sidebar: { type: Object as PropType<LayoutConfig['sidebar']>, default: () => ({}) },
  content: { type: Object as PropType<LayoutConfig['content']>, default: () => ({}) },
  breakpoints: { type: Object as PropType<LayoutConfig['breakpoints']> },
  mobileBreakpoint: { type: Number, default: 768 },
  animation: { type: Object as PropType<LayoutConfig['animation']>, default: () => ({}) },
  className: { type: String, default: '' },
  style: { type: Object as PropType<Record<string, string | number>>, default: () => ({}) },
  onBreakpointChange: { type: Function as PropType<LayoutConfig['onBreakpointChange']> },
};

export type LayoutProps = ExtractPropTypes<typeof propTypes>;

export const Layout = defineComponent({
  name: 'ODLayout',
  props: propTypes,
  setup(props: LayoutProps) {
    const config = computed<LayoutConfig>(() => props as LayoutConfig);

    const responsive = computed<ResponsiveState>(() => createResponsive({
      breakpoints: props.breakpoints,
      mobileBreakpoint: props.mobileBreakpoint,
    }));

    const layoutState = createStore(config.value);
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

    const styles = computed(() => createStylesheet(config.value, state, responsive.value, state.sidebar.collapsed));

    provide('layoutConfig', config);
    provide('layoutState', state);
    provide('layoutActions', actions);
    provide('layoutStyles', styles);
    provide('layoutResponsive', responsive);

    const updateResponsive = () => {
      const current = createResponsive({ breakpoints: props.breakpoints, mobileBreakpoint: props.mobileBreakpoint });
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
