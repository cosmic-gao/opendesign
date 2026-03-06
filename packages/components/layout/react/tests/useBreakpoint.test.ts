import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBreakpoint } from '../src/useBreakpoint';
import { setBreakpoint, initState } from '@openlayout/core';

describe('useBreakpoint', () => {
  beforeEach(() => {
    initState({
      mode: 'sidebar',
      defaultCollapsed: false,
      breakpoints: { xs: 480, sm: 768, md: 1024 },
      sizes: { header: 64, footer: 48, sidebar: 240 },
    });
  });

  it('应返回初始断点 null', () => {
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe(null);
  });

  it('设置断点后应返回正确值', () => {
    const { result } = renderHook(() => useBreakpoint());
    
    act(() => {
      setBreakpoint('md');
    });
    
    expect(result.current).toBe('md');
  });

  it('应支持 xs 断点', () => {
    const { result } = renderHook(() => useBreakpoint());
    
    act(() => {
      setBreakpoint('xs');
    });
    
    expect(result.current).toBe('xs');
  });

  it('应支持 lg 断点', () => {
    const { result } = renderHook(() => useBreakpoint());
    
    act(() => {
      setBreakpoint('lg');
    });
    
    expect(result.current).toBe('lg');
  });
});
