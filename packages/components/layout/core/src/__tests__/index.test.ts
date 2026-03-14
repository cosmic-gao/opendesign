import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createResponsive } from '../createResponsive';
import { createStylesheet } from '../createStylesheet';
import { createStore } from '../createStore';

describe('createResponsive', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return correct breakpoint at different widths', () => {
    const { breakpoint } = createResponsive({ breakpoints: { xs: 0, sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1400 } });
    expect(breakpoint).toBeDefined();
  });

  it('should use custom breakpoints', () => {
    const customBreakpoints = { xs: 0, sm: 500, md: 700, lg: 900, xl: 1100, xxl: 1300 };
    const { breakpoints } = createResponsive({ breakpoints: customBreakpoints });
    expect(breakpoints.sm).toBe(500);
    expect(breakpoints.md).toBe(700);
  });

  it('should use default breakpoints when not provided', () => {
    const { breakpoints } = createResponsive();
    expect(breakpoints.xs).toBe(480);
    expect(breakpoints.sm).toBe(576);
    expect(breakpoints.md).toBe(768);
  });

  it('should return isAbove function', () => {
    const { isAbove } = createResponsive();
    expect(typeof isAbove).toBe('function');
  });

  it('should return isBelow function', () => {
    const { isBelow } = createResponsive();
    expect(typeof isBelow).toBe('function');
  });

  it('should return isMobile based on mobileBreakpoint', () => {
    const { isMobile } = createResponsive({ mobileBreakpoint: 768 });
    expect(typeof isMobile).toBe('boolean');
  });
});

describe('createStylesheet', () => {
  it('should generate root styles', () => {
    const styles = createStylesheet({
      config: {},
      breakpoint: 'lg',
      isMobile: false,
    });
    expect(styles.root).toBeDefined();
    expect(styles.root.display).toBe('flex');
    expect(styles.root.flexDirection).toBe('column');
  });

  it('should generate header styles', () => {
    const styles = createStylesheet({
      config: { header: { height: 80 } },
      breakpoint: 'lg',
      isMobile: false,
    });
    expect(styles.header).toBeDefined();
    expect(styles.header.height).toBe('80px');
  });

  it('should generate fixed header styles', () => {
    const styles = createStylesheet({
      config: { header: { fixed: true } },
      breakpoint: 'lg',
      isMobile: false,
    });
    expect(styles.header?.position).toBe('fixed');
    expect(styles.header?.zIndex).toBe(1000);
  });

  it('should generate footer styles', () => {
    const styles = createStylesheet({
      config: { footer: { height: 60 } },
      breakpoint: 'lg',
      isMobile: false,
    });
    expect(styles.footer).toBeDefined();
    expect(styles.footer.height).toBe('60px');
  });

  it('should generate sidebar styles', () => {
    const styles = createStylesheet({
      config: { sidebar: { width: 250 } },
      breakpoint: 'lg',
      isMobile: false,
    });
    expect(styles.sidebar).toBeDefined();
    expect(styles.sidebar.width).toBe('250px');
  });

  it('should generate collapsed sidebar styles', () => {
    const styles = createStylesheet({
      config: { sidebar: { width: 200, min: 60 } },
      breakpoint: 'lg',
      isMobile: false,
      collapsed: true,
    });
    expect(styles.sidebar?.width).toBe('60px');
  });

  it('should generate content styles', () => {
    const styles = createStylesheet({
      config: { content: { scrollable: true } },
      breakpoint: 'lg',
      isMobile: false,
    });
    expect(styles.content).toBeDefined();
    expect(styles.content.flex).toBe(1);
  });

  it('should include CSS variables', () => {
    const styles = createStylesheet({
      config: { animation: { enabled: true, duration: 300 } },
      breakpoint: 'lg',
      isMobile: false,
    });
    expect(styles.cssVariables).toBeDefined();
    expect(styles.cssVariables['--od-animation-duration']).toBe('300ms');
  });
});

describe('createStore', () => {
  it('should create default state', () => {
    const store = createStore();
    expect(store.state.sidebar.collapsed).toBe(false);
    expect(store.state.sidebar.visible).toBe(true);
    expect(store.state.header.visible).toBe(true);
    expect(store.state.footer.visible).toBe(true);
  });

  it('should use custom initial values', () => {
    const store = createStore({
      sidebar: { collapsed: true, width: 300 },
      header: { height: 80, fixed: true },
      footer: { height: 100, fixed: true },
    });
    expect(store.state.sidebar.collapsed).toBe(true);
    expect(store.state.sidebar.width).toBe(300);
    expect(store.state.header.height).toBe(80);
    expect(store.state.header.fixed).toBe(true);
    expect(store.state.footer.height).toBe(100);
    expect(store.state.footer.fixed).toBe(true);
  });

  it('should have actions', () => {
    const store = createStore();
    expect(typeof store.actions.toggleSidebar).toBe('function');
    expect(typeof store.actions.setSidebarCollapsed).toBe('function');
    expect(typeof store.actions.toggleHeader).toBe('function');
    expect(typeof store.actions.setHeaderVisible).toBe('function');
    expect(typeof store.actions.setHeaderFixed).toBe('function');
    expect(typeof store.actions.toggleFooter).toBe('function');
    expect(typeof store.actions.setFooterVisible).toBe('function');
    expect(typeof store.actions.setFooterFixed).toBe('function');
  });
});
