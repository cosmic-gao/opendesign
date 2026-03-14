import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createResponsive } from '../createResponsive';
import { createStylesheet } from '../createStylesheet';
import { createStore } from '../createStore';

describe('createResponsive', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('断点检测', () => {
    it('应该在不同屏幕宽度下返回正确的断点', () => {
      const { breakpoint } = createResponsive({
        breakpoints: { xs: 0, sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1400 }
      });
      expect(breakpoint).toBeDefined();
    });

    it('应该使用自定义断点配置', () => {
      const customBreakpoints = { xs: 0, sm: 500, md: 700, lg: 900, xl: 1100, xxl: 1300 };
      const { breakpoints } = createResponsive({ breakpoints: customBreakpoints });
      expect(breakpoints.sm).toBe(500);
      expect(breakpoints.md).toBe(700);
    });

    it('应该在未提供断点时使用默认值', () => {
      const { breakpoints } = createResponsive();
      expect(breakpoints.xs).toBe(480);
      expect(breakpoints.sm).toBe(576);
      expect(breakpoints.md).toBe(768);
      expect(breakpoints.lg).toBe(992);
      expect(breakpoints.xl).toBe(1200);
      expect(breakpoints.xxl).toBe(1400);
    });

    it('应该提供 isAbove 函数', () => {
      const { isAbove } = createResponsive();
      expect(typeof isAbove).toBe('function');
    });

    it('应该提供 isBelow 函数', () => {
      const { isBelow } = createResponsive();
      expect(typeof isBelow).toBe('function');
    });

    it('应该基于 mobileBreakpoint 返回 isMobile', () => {
      const { isMobile } = createResponsive({ mobileBreakpoint: 768 });
      expect(typeof isMobile).toBe('boolean');
    });
  });

  describe('SSR 场景支持', () => {
    it('在服务端渲染时应该返回 xxl 作为默认断点', () => {
      const { breakpoint } = createResponsive();
      expect(breakpoint).toBeDefined();
    });

    it('在服务端渲染时 isAbove 应返回 true', () => {
      const { isAbove } = createResponsive();
      const result = isAbove('md');
      expect(typeof result).toBe('boolean');
    });

    it('在服务端渲染时 isBelow 应返回 false', () => {
      const { isBelow } = createResponsive();
      const result = isBelow('md');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('边界情况处理', () => {
    it('应该处理极端小的屏幕宽度', () => {
      const { breakpoints } = createResponsive({ breakpoints: { xs: 0, sm: 320, md: 480 } });
      expect(breakpoints.xs).toBe(0);
      expect(breakpoints.sm).toBe(320);
    });

    it('应该处理未定义的断点值', () => {
      const { breakpoints } = createResponsive({ breakpoints: { xs: 0, sm: undefined, md: 768 } });
      expect(breakpoints.xs).toBe(0);
    });

    it('应该合并默认断点与自定义断点', () => {
      const { breakpoints } = createResponsive({ breakpoints: { md: 800 } });
      expect(breakpoints.xs).toBe(480);
      expect(breakpoints.md).toBe(800);
    });
  });
});

describe('createStylesheet', () => {
  describe('根容器样式生成', () => {
    it('应该生成根样式包含 display: flex', () => {
      const styles = createStylesheet({
        config: {},
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.root).toBeDefined();
      expect(styles.root.display).toBe('flex');
      expect(styles.root.flexDirection).toBe('column');
      expect(styles.root.minHeight).toBe('100vh');
    });

    it('应该包含 CSS 变量', () => {
      const styles = createStylesheet({
        config: {},
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.cssVariables).toBeDefined();
      expect(styles.cssVariables['--od-header-height']).toBeDefined();
    });
  });

  describe('Header 样式生成', () => {
    it('应该生成默认 Header 样式', () => {
      const styles = createStylesheet({
        config: {},
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.header).toBeDefined();
      expect(styles.header.height).toBe('64px');
    });

    it('应该使用自定义 Header 高度', () => {
      const styles = createStylesheet({
        config: { header: { height: 80 } },
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.header.height).toBe('80px');
    });

    it('应该生成固定定位 Header 样式', () => {
      const styles = createStylesheet({
        config: { header: { fixed: true } },
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.header.position).toBe('fixed');
      expect(styles.header.top).toBe(0);
      expect(styles.header.left).toBe(0);
      expect(styles.header.right).toBe(0);
      expect(styles.header.zIndex).toBe(1000);
    });

    it('应该生成全宽 Header 样式', () => {
      const styles = createStylesheet({
        config: { header: { full: true } },
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.header.width).toBe('100%');
    });

    it('应该同时支持 fixed 和 full', () => {
      const styles = createStylesheet({
        config: { header: { fixed: true, full: true } },
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.header.position).toBe('fixed');
      expect(styles.header.width).toBe('100%');
    });
  });

  describe('Footer 样式生成', () => {
    it('应该生成默认 Footer 样式', () => {
      const styles = createStylesheet({
        config: {},
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.footer).toBeDefined();
      expect(styles.footer.height).toBe('48px');
    });

    it('应该使用自定义 Footer 高度', () => {
      const styles = createStylesheet({
        config: { footer: { height: 60 } },
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.footer.height).toBe('60px');
    });

    it('应该生成固定定位 Footer 样式', () => {
      const styles = createStylesheet({
        config: { footer: { fixed: true } },
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.footer.position).toBe('fixed');
      expect(styles.footer.bottom).toBe(0);
      expect(styles.footer.zIndex).toBe(1000);
    });

    it('应该生成全宽 Footer 样式', () => {
      const styles = createStylesheet({
        config: { footer: { full: true } },
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.footer.width).toBe('100%');
    });
  });

  describe('Sidebar 样式生成', () => {
    it('应该生成默认 Sidebar 样式', () => {
      const styles = createStylesheet({
        config: {},
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.sidebar).toBeDefined();
      expect(styles.sidebar.width).toBe('200px');
    });

    it('应该使用自定义 Sidebar 宽度', () => {
      const styles = createStylesheet({
        config: { sidebar: { width: 250 } },
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.sidebar.width).toBe('250px');
    });

    it('应该生成折叠 Sidebar 样式', () => {
      const styles = createStylesheet({
        config: { sidebar: { width: 200, min: 60 } },
        breakpoint: 'lg',
        isMobile: false,
        collapsed: true,
      });
      expect(styles.sidebar.width).toBe('60px');
    });

    it('应该生成全高 Sidebar 样式', () => {
      const styles = createStylesheet({
        config: { sidebar: { full: true } },
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.sidebar.height).toBe('100%');
    });

    it('应该在移动端生成 overlay 样式', () => {
      const styles = createStylesheet({
        config: { sidebar: { overlay: true } },
        breakpoint: 'md',
        isMobile: true,
      });
      expect(styles.sidebar.position).toBe('fixed');
      expect(styles.sidebar.zIndex).toBe(1001);
    });

    it('应该在移动端自动添加 overlay 样式', () => {
      const styles = createStylesheet({
        config: {},
        breakpoint: 'md',
        isMobile: true,
      });
      expect(styles.sidebar.position).toBe('fixed');
    });

    it('应该包含 transition 动画', () => {
      const styles = createStylesheet({
        config: {},
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.sidebar.transition).toContain('width');
    });
  });

  describe('Content 样式生成', () => {
    it('应该生成默认 Content 样式', () => {
      const styles = createStylesheet({
        config: {},
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.content).toBeDefined();
      expect(styles.content.flex).toBe(1);
      expect(styles.content.minWidth).toBe(0);
    });

    it('应该生成可滚动 Content 样式', () => {
      const styles = createStylesheet({
        config: { content: { scrollable: true } },
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.content.overflow).toBe('auto');
    });

    it('应该生成不可滚动 Content 样式', () => {
      const styles = createStylesheet({
        config: { content: { scrollable: false } },
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.content.overflow).toBeUndefined();
    });
  });

  describe('CSS 变量生成', () => {
    it('应该生成 Header 高度变量', () => {
      const styles = createStylesheet({
        config: { header: { height: 80 } },
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.cssVariables['--od-header-height']).toBe('80px');
    });

    it('应该生成 Footer 高度变量', () => {
      const styles = createStylesheet({
        config: { footer: { height: 60 } },
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.cssVariables['--od-footer-height']).toBe('60px');
    });

    it('应该生成 Sidebar 宽度变量', () => {
      const styles = createStylesheet({
        config: { sidebar: { width: 250, min: 80 } },
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.cssVariables['--od-sidebar-width']).toBe('250px');
    });

    it('应该生成折叠时的最小宽度变量', () => {
      const styles = createStylesheet({
        config: { sidebar: { width: 250, min: 80 } },
        breakpoint: 'lg',
        isMobile: false,
        collapsed: true,
      });
      expect(styles.cssVariables['--od-sidebar-width']).toBe('80px');
      expect(styles.cssVariables['--od-sidebar-min-width']).toBe('80px');
    });

    it('应该生成动画配置变量', () => {
      const styles = createStylesheet({
        config: { animation: { enabled: true, duration: 300, easing: 'ease-in-out' } },
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.cssVariables['--od-animation-enabled']).toBe(1);
      expect(styles.cssVariables['--od-animation-duration']).toBe('300ms');
      expect(styles.cssVariables['--od-animation-easing']).toBe('ease-in-out');
    });

    it('应该在动画禁用时设置 enabled 为 0', () => {
      const styles = createStylesheet({
        config: { animation: { enabled: false } },
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.cssVariables['--od-animation-enabled']).toBe(0);
    });

    it('应该生成响应式变量', () => {
      const styles = createStylesheet({
        config: {},
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.cssVariables['--od-breakpoint']).toBe('lg');
      expect(styles.cssVariables['--od-is-mobile']).toBe(0);
    });

    it('应该在移动端设置 isMobile 为 1', () => {
      const styles = createStylesheet({
        config: {},
        breakpoint: 'md',
        isMobile: true,
      });
      expect(styles.cssVariables['--od-is-mobile']).toBe(1);
    });
  });

  describe('动画配置', () => {
    it('应该使用默认动画时长', () => {
      const styles = createStylesheet({
        config: {},
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.cssVariables['--od-animation-duration']).toBe('200ms');
    });

    it('应该使用自定义动画时长', () => {
      const styles = createStylesheet({
        config: { animation: { duration: 500 } },
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.cssVariables['--od-animation-duration']).toBe('500ms');
    });

    it('应该使用默认缓动函数', () => {
      const styles = createStylesheet({
        config: {},
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.cssVariables['--od-animation-easing']).toBe('ease');
    });
  });

  describe('Z-Index 管理', () => {
    it('固定 Header 应该具有正确的 z-index', () => {
      const styles = createStylesheet({
        config: { header: { fixed: true } },
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.header.zIndex).toBe(1000);
    });

    it('固定 Footer 应该具有正确的 z-index', () => {
      const styles = createStylesheet({
        config: { footer: { fixed: true } },
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.footer.zIndex).toBe(1000);
    });

    it('Overlay Sidebar 应该具有更高的 z-index', () => {
      const styles = createStylesheet({
        config: { sidebar: { overlay: true } },
        breakpoint: 'lg',
        isMobile: false,
      });
      expect(styles.sidebar.zIndex).toBe(1001);
    });
  });
});

describe('createStore', () => {
  describe('默认状态', () => {
    it('应该创建默认 Sidebar 状态', () => {
      const store = createStore();
      expect(store.state.sidebar.collapsed).toBe(false);
      expect(store.state.sidebar.visible).toBe(true);
      expect(store.state.sidebar.width).toBe(200);
    });

    it('应该创建默认 Header 状态', () => {
      const store = createStore();
      expect(store.state.header.visible).toBe(true);
      expect(store.state.header.fixed).toBe(false);
      expect(store.state.header.height).toBe(64);
    });

    it('应该创建默认 Footer 状态', () => {
      const store = createStore();
      expect(store.state.footer.visible).toBe(true);
      expect(store.state.footer.fixed).toBe(false);
      expect(store.state.footer.height).toBe(48);
    });
  });

  describe('自定义初始值', () => {
    it('应该使用自定义 Sidebar 配置', () => {
      const store = createStore({
        sidebar: { collapsed: true, width: 300, min: 60 },
      });
      expect(store.state.sidebar.collapsed).toBe(true);
      expect(store.state.sidebar.width).toBe(300);
      expect(store.state.sidebar.min).toBe(60);
    });

    it('应该使用自定义 Header 配置', () => {
      const store = createStore({
        header: { height: 80, fixed: true },
      });
      expect(store.state.header.height).toBe(80);
      expect(store.state.header.fixed).toBe(true);
    });

    it('应该使用自定义 Footer 配置', () => {
      const store = createStore({
        footer: { height: 100, fixed: true },
      });
      expect(store.state.footer.height).toBe(100);
      expect(store.state.footer.fixed).toBe(true);
    });

    it('应该合并部分配置与其他默认值', () => {
      const store = createStore({
        sidebar: { collapsed: true },
      });
      expect(store.state.sidebar.collapsed).toBe(true);
      expect(store.state.sidebar.visible).toBe(true);
    });
  });

  describe('Sidebar min 宽度', () => {
    it('应该设置默认 min 宽度', () => {
      const store = createStore();
      expect(store.state.sidebar.min).toBe(80);
    });

    it('应该使用自定义 min 宽度', () => {
      const store = createStore({
        sidebar: { min: 60 },
      });
      expect(store.state.sidebar.min).toBe(60);
    });
  });
});
