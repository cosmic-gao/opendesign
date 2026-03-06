import { describe, it, expect } from 'vitest';
import { createMedia } from './media';
import type { Breakpoints } from '@openlayout/type';

describe('createMedia', () => {
  describe('buildQueries', () => {
    it('应正确构建单个断点查询', () => {
      const breakpoints: Breakpoints = { md: 1024 };
      const media = createMedia(breakpoints);

      const breakpoint = media.getBreakpoint();
      expect(breakpoint).toBe('md');
    });

    it('应正确构建多个断点查询', () => {
      const breakpoints: Breakpoints = { xs: 480, sm: 768, md: 1024 };
      const media = createMedia(breakpoints);

      const breakpoint = media.getBreakpoint();
      expect(['xs', 'sm', 'md']).toContain(breakpoint);
    });

    it('空断点配置应返回 null', () => {
      const breakpoints: Breakpoints = {};
      const media = createMedia(breakpoints);

      const breakpoint = media.getBreakpoint();
      expect(breakpoint).toBeNull();
    });
  });

  describe('subscribe', () => {
    it('应返回取消订阅函数', () => {
      const breakpoints: Breakpoints = { md: 1024 };
      const media = createMedia(breakpoints);

      const unsubscribe = media.subscribe(() => {});
      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
    });
  });

  describe('边界情况', () => {
    it('应处理 undefined 值', () => {
      const breakpoints = { xs: undefined, sm: 768 } as Breakpoints;
      const media = createMedia(breakpoints);

      const breakpoint = media.getBreakpoint();
      expect(breakpoint).toBe('sm');
    });

    it('应按数值排序断点', () => {
      const breakpoints: Breakpoints = { lg: 1200, xs: 480, md: 1024 };
      const media = createMedia(breakpoints);

      const breakpoint = media.getBreakpoint();
      expect(['xs', 'md', 'lg']).toContain(breakpoint);
    });
  });
});
