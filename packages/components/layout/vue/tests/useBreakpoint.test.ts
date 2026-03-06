import { describe, it, expect, beforeEach } from 'vitest';
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

  it('应返回初始断点 Ref<null>', () => {
    const breakpoint = useBreakpoint();
    expect(breakpoint.value).toBe(null);
  });

  it('设置断点后应返回正确值 Ref', () => {
    setBreakpoint('md');
    const breakpoint = useBreakpoint();
    expect(breakpoint.value).toBe('md');
  });

  it('应支持 xs 断点', () => {
    setBreakpoint('xs');
    const breakpoint = useBreakpoint();
    expect(breakpoint.value).toBe('xs');
  });

  it('应支持 lg 断点', () => {
    setBreakpoint('lg');
    const breakpoint = useBreakpoint();
    expect(breakpoint.value).toBe('lg');
  });
});
