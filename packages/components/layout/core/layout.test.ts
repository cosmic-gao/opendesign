import { describe, it, expect } from 'vitest';
import { createLayout } from './layout';
import type { LayoutConfig, LayoutState } from '@openlayout/type';

describe('createLayout', () => {
  const defaultConfig: LayoutConfig = {
    mode: 'sidebar',
    defaultCollapsed: false,
    breakpoints: { xs: 480, sm: 768, md: 1024 },
    sizes: { header: 64, footer: 48, sidebar: 240 },
  };

  const defaultState: LayoutState = {
    collapsed: false,
    breakpoint: null,
  };

  describe('Sidebar 模式 (sidebar)', () => {
    it('应正确计算尺寸', () => {
      const result = createLayout(defaultConfig, defaultState);

      expect(result.headerHeight).toBe(64);
      expect(result.headerWidth).toBe('100%');
      expect(result.sidebarWidth).toBe(240);
      expect(result.sidebarHeight).toBe('100%');
      expect(result.footerHeight).toBe(48);
      expect(result.footerWidth).toBe('100%');
      expect(result.contentMarginTop).toBe(64);
      expect(result.contentMarginLeft).toBe(240);
    });

    it('折叠状态下 sidebarWidth 应为 0', () => {
      const result = createLayout(defaultConfig, { ...defaultState, collapsed: true });

      expect(result.sidebarWidth).toBe(0);
      expect(result.contentMarginLeft).toBe(0);
    });
  });

  describe('Mixed 模式 (mixed)', () => {
    const mixedConfig: LayoutConfig = { ...defaultConfig, mode: 'mixed' };

    it('应正确计算尺寸', () => {
      const result = createLayout(mixedConfig, defaultState);

      expect(result.headerHeight).toBe(64);
      expect(result.headerWidth).toBe('100%');
      expect(result.sidebarWidth).toBe(240);
      expect(result.sidebarHeight).toBe('100%');
      expect(result.contentMarginTop).toBe(64);
      expect(result.contentMarginLeft).toBe(240);
    });
    
    // 注意：Mixed 模式的具体布局差异主要体现在 UI 层（Header z-index 或 DOM 结构），
    // Core 层输出的尺寸在当前模型下可能看起来与 Sidebar 模式相似，
    // 或者是通过 contentMarginTop/Left 隐含表达。
    // 在我们的实现中，Mixed 模式和 Sidebar 模式的 Core 输出目前是一样的，
    // 区别在于 UI 如何使用这些值（例如 Mixed 模式 Header 可能是 fixed top 0 left 0 width 100%）。
  });

  describe('Top 模式 (top)', () => {
    const topConfig: LayoutConfig = { ...defaultConfig, mode: 'top' };

    it('应无 Sidebar', () => {
      const result = createLayout(topConfig, defaultState);

      expect(result.sidebarWidth).toBe(0);
      expect(result.sidebarHeight).toBe(0);
      expect(result.contentMarginLeft).toBe(0);
      
      expect(result.headerHeight).toBe(64);
      expect(result.contentMarginTop).toBe(64);
    });
  });

  describe('Blank 模式 (blank)', () => {
    const blankConfig: LayoutConfig = { ...defaultConfig, mode: 'blank' };

    it('所有区域尺寸应为 0', () => {
      const result = createLayout(blankConfig, defaultState);

      expect(result.headerHeight).toBe(0);
      expect(result.sidebarWidth).toBe(0);
      expect(result.footerHeight).toBe(0);
      expect(result.contentMarginTop).toBe(0);
      expect(result.contentMarginLeft).toBe(0);
    });
  });

  describe('配置处理', () => {
    it('应正确处理 auto 尺寸', () => {
      const config: LayoutConfig = {
        ...defaultConfig,
        sizes: { header: 'auto', sidebar: 200 },
      };
      const result = createLayout(config, defaultState);

      expect(result.headerHeight).toBe(0); // auto 解析为 0
    });

    it('应正确处理对象配置', () => {
      const config: LayoutConfig = {
        ...defaultConfig,
        sizes: { header: { min: 80 }, sidebar: 200 },
      };
      const result = createLayout(config, defaultState);

      expect(result.headerHeight).toBe(80);
    });
  });
});
