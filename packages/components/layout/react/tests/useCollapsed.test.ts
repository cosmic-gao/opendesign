import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCollapsed } from '../src/useCollapsed';
import { setCollapsed, toggleCollapsed, initState } from '@openlayout/core';

describe('useCollapsed', () => {
  beforeEach(() => {
    initState({
      mode: 'sidebar',
      defaultCollapsed: false,
      breakpoints: { xs: 480, sm: 768, md: 1024 },
      sizes: { header: 64, footer: 48, sidebar: 240 },
    });
  });

  it('应返回初始折叠状态 false', () => {
    const { result } = renderHook(() => useCollapsed());
    const [collapsed] = result.current;
    expect(collapsed).toBe(false);
  });

  it('应返回 toggleCollapsed 函数', () => {
    const { result } = renderHook(() => useCollapsed());
    const [, toggleCollapsedFn] = result.current;
    expect(typeof toggleCollapsedFn).toBe('function');
  });

  it('应返回 setCollapsed 函数', () => {
    const { result } = renderHook(() => useCollapsed());
    const [, , setCollapsedFn] = result.current;
    expect(typeof setCollapsedFn).toBe('function');
  });

  it('调用 setCollapsed(true) 应更新状态', () => {
    const { result } = renderHook(() => useCollapsed());
    const [, , setCollapsedFn] = result.current;
    
    act(() => {
      setCollapsedFn(true);
    });
    
    const [collapsed] = result.current;
    expect(collapsed).toBe(true);
  });

  it('调用 toggleCollapsed 应切换状态', () => {
    const { result } = renderHook(() => useCollapsed());
    const [, toggleFn] = result.current;
    
    act(() => {
      toggleFn();
    });
    
    const [collapsed] = result.current;
    expect(collapsed).toBe(true);
  });
});
