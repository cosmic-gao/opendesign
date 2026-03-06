import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createState, setCollapsed, toggleCollapsed, setBreakpoint, initState, $layoutState } from './state';
import type { LayoutConfig } from '@openlayout/type';

describe('createState', () => {
  beforeEach(() => {
    $layoutState.set({ collapsed: false, breakpoint: null });
  });

  describe('基础功能', () => {
    it('应返回包含正确方法的对象', () => {
      const state = createState();

      expect(typeof state.getState).toBe('function');
      expect(typeof state.setCollapsed).toBe('function');
      expect(typeof state.setBreakpoint).toBe('function');
      expect(typeof state.toggleCollapsed).toBe('function');
      expect(typeof state.subscribe).toBe('function');
    });

    it('getState 应返回当前状态', () => {
      const state = createState();
      const currentState = state.getState();

      expect(currentState).toHaveProperty('collapsed');
      expect(currentState).toHaveProperty('breakpoint');
    });
  });

  describe('订阅功能', () => {
    it('subscribe 应在状态变化时触发回调', () => {
      const state = createState();
      const callback = vi.fn();

      const unsubscribe = state.subscribe(callback);

      setCollapsed(true);

      expect(callback).toHaveBeenCalled();

      unsubscribe();
    });

    it('unsubscribe 应停止接收更新', () => {
      const state = createState();
      const callback = vi.fn();

      const unsubscribe = state.subscribe(callback);
      callback.mockClear();
      unsubscribe();

      setCollapsed(true);

      expect(callback).not.toHaveBeenCalled();
    });
  });
});

describe('setCollapsed', () => {
  beforeEach(() => {
    $layoutState.set({ collapsed: false, breakpoint: null });
  });

  it('应设置 collapsed 状态', () => {
    setCollapsed(true);
    expect($layoutState.get().collapsed).toBe(true);
  });
});

describe('toggleCollapsed', () => {
  beforeEach(() => {
    $layoutState.set({ collapsed: false, breakpoint: null });
  });

  it('应切换 collapsed 状态', () => {
    toggleCollapsed();
    expect($layoutState.get().collapsed).toBe(true);

    toggleCollapsed();
    expect($layoutState.get().collapsed).toBe(false);
  });
});

describe('setBreakpoint', () => {
  beforeEach(() => {
    $layoutState.set({ collapsed: false, breakpoint: null });
  });

  it('应设置 breakpoint', () => {
    setBreakpoint('md');
    expect($layoutState.get().breakpoint).toBe('md');
  });

  it('应允许设置 null', () => {
    setBreakpoint('md');
    setBreakpoint(null);
    expect($layoutState.get().breakpoint).toBeNull();
  });
});

describe('initState', () => {
  beforeEach(() => {
    $layoutState.set({ collapsed: false, breakpoint: null });
  });

  it('应使用 defaultCollapsed 初始化', () => {
    const config: Partial<LayoutConfig> = { defaultCollapsed: true };
    initState(config);

    expect($layoutState.get().collapsed).toBe(true);
  });

  it('应重置 breakpoint 为 null', () => {
    $layoutState.set({ collapsed: false, breakpoint: 'md' });
    initState({});

    expect($layoutState.get().breakpoint).toBeNull();
  });
});
