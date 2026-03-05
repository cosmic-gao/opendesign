import { describe, it, expect } from 'vitest';
import { createLayout } from './layout';
import type { LayoutConfig, LayoutState } from '@openlayout/type';

describe('createLayout', () => {
  const defaultConfig: LayoutConfig = {
    mode: 'sidebar',
    defaultCollapsed: false,
    breakpoints: { xs: 480, sm: 768, md: 1024 },
    sizes: {
      header: 64,
      footer: 48,
      sidebar: 240,
    },
  };

  const defaultState: LayoutState = {
    collapsed: false,
    breakpoint: 'md',
  };

  describe('固定值处理', () => {
    it('应正确处理数值形式的固定值', () => {
      const result = createLayout(defaultConfig, defaultState);
      
      expect(result.header.min).toBe(64);
      expect(result.header.max).toBe(64);
      expect(result.footer.min).toBe(48);
      expect(result.footer.max).toBe(48);
      expect(result.sidebar.min).toBe(240);
      expect(result.sidebar.max).toBe(240);
    });

    it('应正确处理对象形式的固定值', () => {
      const config: LayoutConfig = {
        ...defaultConfig,
        sizes: {
          header: { min: 100, max: 100 },
          footer: { min: 50, max: 50 },
          sidebar: { min: 200, max: 200 },
        },
      };
      
      const result = createLayout(config, defaultState);
      
      expect(result.header.min).toBe(100);
      expect(result.footer.min).toBe(50);
      expect(result.sidebar.min).toBe(200);
    });
  });

  describe('范围限制', () => {
    it('应正确处理 min/max 范围', () => {
      const config: LayoutConfig = {
        ...defaultConfig,
        sizes: {
          header: { min: 48, max: 120 },
          footer: { min: 32, max: 64 },
          sidebar: { min: 200, max: 400 },
        },
      };
      
      const result = createLayout(config, defaultState);
      
      expect(result.header.min).toBe(48);
      expect(result.header.max).toBe(120);
      expect(result.footer.min).toBe(32);
      expect(result.footer.max).toBe(64);
      expect(result.sidebar.min).toBe(200);
      expect(result.sidebar.max).toBe(400);
    });
  });

  describe('auto 处理', () => {
    it('应正确处理 auto 字符串', () => {
      const config: LayoutConfig = {
        ...defaultConfig,
        sizes: {
          header: 'auto',
          footer: 'auto',
          sidebar: 'auto',
        },
      };
      
      const result = createLayout(config, defaultState);
      
      expect(result.header.auto).toBe(true);
      expect(result.header.min).toBeUndefined();
      expect(result.footer.auto).toBe(true);
      expect(result.sidebar.auto).toBe(true);
    });

    it('应正确处理 auto: true 对象', () => {
      const config = {
        ...defaultConfig,
        sizes: {
          header: { auto: true },
          footer: { auto: true },
          sidebar: { auto: true },
        },
      };
      
      const result = createLayout(config, defaultState);
      
      expect(result.header.auto).toBe(true);
      expect(result.footer.auto).toBe(true);
      expect(result.sidebar.auto).toBe(true);
    });
  });

  describe('折叠状态', () => {
    it('collapsed 为 true 时，sidebar min 应为 0', () => {
      const state: LayoutState = {
        ...defaultState,
        collapsed: true,
      };
      
      const result = createLayout(defaultConfig, state);
      
      expect(result.sidebar.min).toBe(0);
      expect(result.sidebar.max).toBe(240);
    });

    it('collapsed 为 false 时，sidebar min 应为配置值', () => {
      const result = createLayout(defaultConfig, defaultState);
      
      expect(result.sidebar.min).toBe(240);
    });
  });

  describe('负值保护', () => {
    it('应将负值修正为 0', () => {
      const config = {
        ...defaultConfig,
        sizes: {
          header: -10,
          footer: -20,
          sidebar: -30,
        },
      };
      
      const result = createLayout(config, defaultState);
      
      expect(result.header.min).toBe(0);
      expect(result.footer.min).toBe(0);
      expect(result.sidebar.min).toBe(0);
    });
  });

  describe('min > max 修正', () => {
    it('应修正 min > max 的情况', () => {
      const config = {
        ...defaultConfig,
        sizes: {
          header: { min: 100, max: 50 },
          footer: { min: 80, max: 30 },
          sidebar: { min: 300, max: 200 },
        },
      };
      
      const result = createLayout(config, defaultState);
      
      expect(result.header.min).toBe(50);
      expect(result.header.max).toBe(100);
      expect(result.footer.min).toBe(30);
      expect(result.footer.max).toBe(80);
      expect(result.sidebar.min).toBe(200);
      expect(result.sidebar.max).toBe(300);
    });
  });

  describe('未配置尺寸', () => {
    it('未配置时应返回默认值', () => {
      const config: LayoutConfig = {
        mode: 'sidebar',
        defaultCollapsed: false,
        breakpoints: {},
        sizes: {},
      };
      
      const result = createLayout(config, defaultState);
      
      expect(result.header.min).toBe(0);
      expect(result.header.max).toBe(0);
      expect(result.footer.min).toBe(0);
      expect(result.footer.max).toBe(0);
      expect(result.sidebar.min).toBe(0);
      expect(result.sidebar.max).toBe(0);
    });
  });
});
