import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLayout, getState, cleanup } from '../src/useLayout';
import { $layoutState, setCollapsed, setBreakpoint, initState } from '@openlayout/core';

describe('useLayout', () => {
  beforeEach(() => {
    cleanup();
    initState({
      mode: 'sidebar',
      defaultCollapsed: false,
      breakpoints: { xs: 480, sm: 768, md: 1024 },
      sizes: { header: 64, footer: 48, sidebar: 240, topbar: 56 },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('应返回初始折叠状态 false', () => {
    const { result } = renderHook(() => useLayout());
    expect(result.current.collapsed).toBe(false);
  });

  it('应返回快捷属性 headerHeight', () => {
    const { result } = renderHook(() => useLayout());
    expect(result.current.headerHeight).toBe(64);
  });

  it('应返回快捷属性 footerHeight', () => {
    const { result } = renderHook(() => useLayout());
    expect(result.current.footerHeight).toBe(48);
  });

  it('应返回快捷属性 sidebarWidth', () => {
    const { result } = renderHook(() => useLayout());
    expect(result.current.sidebarWidth).toBe(240);
  });

  it('应返回快捷属性 topbarHeight (sidebar模式为0)', () => {
    const { result } = renderHook(() => useLayout());
    expect(result.current.topbarHeight).toBe(0);
  });

  it('应返回快捷属性 isDesktop 和 isMobile', () => {
    act(() => {
      setBreakpoint('lg');
    });
    const { result } = renderHook(() => useLayout());
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isMobile).toBe(false);
  });

  it('折叠状态变化时 sidebarWidth 应为 0', () => {
    const { result } = renderHook(() => useLayout());
    
    act(() => {
      setCollapsed(true);
    });
    
    expect(result.current.collapsed).toBe(true);
    expect(result.current.sidebarWidth).toBe(0);
  });

  it('应包含 toggleCollapsed 函数', () => {
    const { result } = renderHook(() => useLayout());
    expect(typeof result.current.toggleCollapsed).toBe('function');
  });

  it('应包含 setCollapsed 函数', () => {
    const { result } = renderHook(() => useLayout());
    expect(typeof result.current.setCollapsed).toBe('function');
  });

  it('应包含 dimensions 完整尺寸对象', () => {
    const { result } = renderHook(() => useLayout());
    expect(result.current.dimensions).toHaveProperty('header');
    expect(result.current.dimensions).toHaveProperty('footer');
    expect(result.current.dimensions).toHaveProperty('sidebar');
    expect(result.current.dimensions).toHaveProperty('topbar');
  });
});

describe('getState', () => {
  beforeEach(() => {
    cleanup();
    initState({
      mode: 'sidebar',
      defaultCollapsed: false,
      breakpoints: { xs: 480, sm: 768, md: 1024 },
      sizes: { header: 64, footer: 48, sidebar: 240, topbar: 56 },
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
