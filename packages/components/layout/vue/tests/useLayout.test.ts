import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useLayout, getState, cleanup } from '../src/useLayout';
import { setCollapsed, setBreakpoint, initState } from '@openlayout/core';

describe('useLayout', () => {
  beforeEach(() => {
    cleanup();
    initState({
      mode: 'sidebar',
      defaultCollapsed: false,
      breakpoints: { xs: 480, sm: 768, md: 1024 },
      sizes: { header: 64, footer: 48, sidebar: 240 },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('应返回初始折叠状态 Ref<false>', () => {
    const layout = useLayout();
    expect(layout.collapsed.value).toBe(false);
  });

  it('应返回快捷属性 headerHeight Ref', () => {
    const layout = useLayout();
    expect(layout.headerHeight.value).toBe(64);
  });

  it('应返回快捷属性 footerHeight Ref', () => {
    const layout = useLayout();
    expect(layout.footerHeight.value).toBe(48);
  });

  it('应返回快捷属性 sidebarWidth Ref', () => {
    const layout = useLayout();
    expect(layout.sidebarWidth.value).toBe(240);
  });

  it('应返回快捷属性 isDesktop 和 isMobile Ref', () => {
    setBreakpoint('lg');
    const layout = useLayout();
    expect(layout.isDesktop.value).toBe(true);
    expect(layout.isMobile.value).toBe(false);
  });

  it('折叠状态变化时 sidebarWidth 应为 0', () => {
    setCollapsed(true);
    const layout = useLayout();
    expect(layout.collapsed.value).toBe(true);
    expect(layout.sidebarWidth.value).toBe(0);
  });

  it('应包含 toggleCollapsed 函数', () => {
    const layout = useLayout();
    expect(typeof layout.toggleCollapsed).toBe('function');
  });

  it('应包含 setCollapsed 函数', () => {
    const layout = useLayout();
    expect(typeof layout.setCollapsed).toBe('function');
  });

  it('应包含 dimensions 完整尺寸对象 Ref', () => {
    const layout = useLayout();
    // 检查新的尺寸属性
    expect(layout.dimensions.value).toHaveProperty('headerHeight');
    expect(layout.dimensions.value).toHaveProperty('headerWidth');
    expect(layout.dimensions.value).toHaveProperty('sidebarWidth');
    expect(layout.dimensions.value).toHaveProperty('sidebarHeight');
    expect(layout.dimensions.value).toHaveProperty('footerHeight');
    expect(layout.dimensions.value).toHaveProperty('footerWidth');
    expect(layout.dimensions.value).toHaveProperty('contentMarginTop');
    expect(layout.dimensions.value).toHaveProperty('contentMarginLeft');
  });

  it('应返回 layoutMode', () => {
    const layout = useLayout();
    expect(layout.layoutMode.value).toBe('sidebar');
  });
});

describe('getState', () => {
  beforeEach(() => {
    cleanup();
    initState({
      mode: 'sidebar',
      defaultCollapsed: false,
      breakpoints: { xs: 480, sm: 768, md: 1024 },
      sizes: { header: 64, footer: 48, sidebar: 240 },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('应返回当前状态', () => {
    const state = getState();
    expect(state).toHaveProperty('collapsed');
    expect(state).toHaveProperty('breakpoint');
  });
});
