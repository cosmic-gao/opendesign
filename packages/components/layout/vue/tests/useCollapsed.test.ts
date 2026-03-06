import { describe, it, expect, beforeEach } from 'vitest';
import { useCollapsed } from '../src/useCollapsed';
import { setCollapsed, initState } from '@openlayout/core';

describe('useCollapsed', () => {
  beforeEach(() => {
    initState({
      mode: 'sidebar',
      defaultCollapsed: false,
      breakpoints: { xs: 480, sm: 768, md: 1024 },
      sizes: { header: 64, footer: 48, sidebar: 240 },
    });
  });

  it('应返回初始折叠状态 Ref<false>', () => {
    const [collapsed] = useCollapsed();
    expect(collapsed.value).toBe(false);
  });

  it('应返回 toggleCollapsed 函数', () => {
    const [, toggleCollapsedFn] = useCollapsed();
    expect(typeof toggleCollapsedFn).toBe('function');
  });

  it('应返回 setCollapsed 函数', () => {
    const [, , setCollapsedFn] = useCollapsed();
    expect(typeof setCollapsedFn).toBe('function');
  });

  it('调用 setCollapsed(true) 应更新状态', () => {
    const [, , setCollapsedFn] = useCollapsed();
    setCollapsedFn(true);
    const [collapsed] = useCollapsed();
    expect(collapsed.value).toBe(true);
  });

  it('调用 toggleCollapsed 应切换状态', () => {
    const [, toggleFn] = useCollapsed();
    toggleFn();
    const [collapsed] = useCollapsed();
    expect(collapsed.value).toBe(true);
  });
});
