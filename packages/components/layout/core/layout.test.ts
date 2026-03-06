import { describe, it, expect } from 'vitest';
import { createLayout } from './layout';
import type { LayoutConfig, LayoutState } from '@openlayout/type';

describe('createLayout', () => {
  const defaultState: LayoutState = {
    collapsed: false,
    breakpoint: null,
  };

  describe('Sidebar 布局 (header + sidebar + footer)', () => {
    // headerFullWidth: false, footerFullWidth: false
    const sidebarConfig: LayoutConfig = {
      sizes: { header: 64, footer: 48, sidebar: 240 },
    };

    it('应正确计算尺寸', () => {
      const result = createLayout(sidebarConfig, defaultState);

      expect(result.headerHeight).toBe(64);
      expect(result.headerWidth).toContain('calc(100% - 240px)');
      
      expect(result.sidebarWidth).toBe(240);
      expect(result.sidebarHeight).toBe('100%');
      expect(result.sidebarTop).toBe(0);
      
      expect(result.footerHeight).toBe(48);
      expect(result.footerWidth).toContain('calc(100% - 240px)');
      
      expect(result.contentMarginTop).toBe(64);
      expect(result.contentMarginLeft).toBe(240);
    });
  });

  describe('Mixed 布局 (header全宽 + sidebar + footer)', () => {
    // headerFullWidth: true, footerFullWidth: false
    const mixedConfig: LayoutConfig = { 
      sizes: { header: 64, footer: 48, sidebar: 240 },
      headerFullWidth: true,
    };

    it('应正确计算尺寸', () => {
      const result = createLayout(mixedConfig, defaultState);

      expect(result.headerHeight).toBe(64);
      expect(result.headerWidth).toBe('100%');
      
      expect(result.sidebarWidth).toBe(240);
      expect(result.sidebarTop).toBe(64);
      expect(result.sidebarHeight).toContain('calc(100% - 64px)');
      
      expect(result.footerHeight).toBe(48);
      expect(result.footerWidth).toContain('calc(100% - 240px)');
      
      expect(result.contentMarginTop).toBe(64);
      expect(result.contentMarginLeft).toBe(240);
    });
  });

  describe('Top 布局 (header全宽 + footer全宽 + 无sidebar)', () => {
    // headerFullWidth: true, footerFullWidth: true, sidebar: 0
    const topConfig: LayoutConfig = { 
      sizes: { header: 64, footer: 48, sidebar: 0 },
      headerFullWidth: true,
      footerFullWidth: true,
    };

    it('应正确计算尺寸', () => {
      const result = createLayout(topConfig, defaultState);

      expect(result.sidebarWidth).toBe(0);
      expect(result.headerWidth).toBe('100%');
      expect(result.footerWidth).toBe('100%');
      expect(result.sidebarTop).toBe(64);
      expect(result.sidebarHeight).toContain('calc(100% - 64px - 48px)');
    });
  });

  describe('Blank 布局 (全屏)', () => {
    const blankConfig: LayoutConfig = { 
      sizes: { header: 0, footer: 0, sidebar: 0 },
    };

    it('所有区域尺寸应为 0', () => {
      const result = createLayout(blankConfig, defaultState);

      expect(result.headerHeight).toBe(0);
      expect(result.sidebarWidth).toBe(0);
      expect(result.footerHeight).toBe(0);
    });
  });

  describe('工字型布局 (header全宽 + footer全宽 + sidebar居中)', () => {
    // headerFullWidth: true, footerFullWidth: true
    const customConfig: LayoutConfig = { 
      sizes: { header: 64, footer: 48, sidebar: 240 },
      headerFullWidth: true,
      footerFullWidth: true,
    };

    it('应正确计算工字型尺寸', () => {
      const result = createLayout(customConfig, defaultState);

      expect(result.headerWidth).toBe('100%');
      expect(result.footerWidth).toBe('100%');
      
      expect(result.sidebarWidth).toBe(240);
      expect(result.sidebarTop).toBe(64);
      expect(result.sidebarHeight).toContain('calc(100% - 64px - 48px)');
    });
  });

  describe('折叠状态', () => {
    const collapsedState: LayoutState = {
      collapsed: true,
      breakpoint: null,
    };

    it('折叠时 sidebar 宽度应为 0', () => {
      const config: LayoutConfig = {
        sizes: { header: 64, footer: 48, sidebar: 240 },
      };
      const result = createLayout(config, collapsedState);

      expect(result.sidebarWidth).toBe(0);
    });
  });
});
