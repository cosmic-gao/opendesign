import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createResponsive, createLayoutState, createStylesheet } from './index';

const mockWindow = (width: number) => {
  vi.stubGlobal('window', { innerWidth: width });
};

describe('createResponsive', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return correct breakpoint for different widths', () => {
    mockWindow(1400);
    const res = createResponsive();
    expect(res.breakpoint).toBe('xxl');
    expect(res.isMobile).toBe(false);
  });

  it('should detect mobile breakpoint', () => {
    mockWindow(500);
    const res = createResponsive();
    expect(res.breakpoint).toBe('sm');
    expect(res.isMobile).toBe(true);
  });

  it('should use custom breakpoints', () => {
    mockWindow(1000);
    const res = createResponsive({ breakpoints: { lg: 800, xl: 1200 } });
    expect(res.breakpoint).toBe('xl');
  });

  it('should use custom mobileBreakpoint', () => {
    mockWindow(900);
    const res = createResponsive({ mobileBreakpoint: 1000 });
    expect(res.isMobile).toBe(true);
  });

  it('should return correct isAbove and isBelow', () => {
    mockWindow(800);
    const res = createResponsive({ breakpoints: { md: 768, lg: 992 } });
    expect(res.isAbove('md')).toBe(true);
    expect(res.isBelow('lg')).toBe(true);
    expect(res.isAbove('lg')).toBe(false);
    expect(res.isBelow('md')).toBe(false);
  });

  it('should handle ssr environment', () => {
    vi.stubGlobal('window', undefined as any);
    const res = createResponsive();
    expect(res.breakpoint).toBe('xxl');
    expect(res.isMobile).toBe(false);
  });
});

describe('createLayoutState', () => {
  it('should return default values', () => {
    const state = createLayoutState();
    expect(state.header.visible).toBe(true);
    expect(state.header.height).toBe(64);
    expect(state.footer.visible).toBe(true);
    expect(state.sidebar.visible).toBe(true);
    expect(state.sidebar.width).toBe(200);
    expect(state.content.scrollable).toBe(true);
  });

  it('should use custom header config', () => {
    const state = createLayoutState({
      header: { enabled: false, height: 80, fixed: true, full: true },
    });
    expect(state.header.visible).toBe(false);
    expect(state.header.height).toBe(80);
    expect(state.header.fixed).toBe(true);
    expect(state.header.full).toBe(true);
  });

  it('should use custom footer config', () => {
    const state = createLayoutState({
      footer: { enabled: false, height: 60, fixed: true, full: true },
    });
    expect(state.footer.visible).toBe(false);
    expect(state.footer.height).toBe(60);
    expect(state.footer.fixed).toBe(true);
    expect(state.footer.full).toBe(true);
  });

  it('should use custom sidebar config', () => {
    const state = createLayoutState({
      sidebar: { enabled: false, width: 300, min: 100, collapsed: true, overlay: true, full: true },
    });
    expect(state.sidebar.visible).toBe(false);
    expect(state.sidebar.width).toBe(300);
    expect(state.sidebar.min).toBe(100);
    expect(state.sidebar.collapsed).toBe(true);
    expect(state.sidebar.overlay).toBe(true);
    expect(state.sidebar.full).toBe(true);
  });

  it('should use custom content config', () => {
    const state = createLayoutState({
      content: { enabled: false, scrollable: false },
    });
    expect(state.content.visible).toBe(false);
    expect(state.content.scrollable).toBe(false);
  });
});

describe('createStylesheet', () => {
  const mockState = {
    header: { visible: true, fixed: false, height: 64, full: false },
    footer: { visible: true, fixed: false, height: 48, full: false },
    sidebar: { visible: true, width: 200, min: 80, collapsed: false, overlay: false, full: true },
    content: { visible: true, scrollable: true },
  };

  const mockResponsive = {
    breakpoint: 'xxl' as const,
    breakpoints: {},
    width: 1400,
    isAbove: () => true,
    isBelow: () => false,
    isMobile: false,
  };

  it('should generate root styles', () => {
    const styles = createStylesheet({}, mockState, mockResponsive);
    expect(styles.root.display).toBe('flex');
    expect(styles.root.flexDirection).toBe('column');
    expect(styles.root.minHeight).toBe('100vh');
  });

  it('should generate css variables', () => {
    const styles = createStylesheet({}, mockState, mockResponsive);
    expect(styles.cssVariables['--od-header-height']).toBe('64px');
    expect(styles.cssVariables['--od-footer-height']).toBe('48px');
    expect(styles.cssVariables['--od-sidebar-width']).toBe('200px');
    expect(styles.cssVariables['--od-breakpoint']).toBe('xxl');
    expect(styles.cssVariables['--od-is-mobile']).toBe('0');
  });

  it('should handle collapsed sidebar', () => {
    const styles = createStylesheet({}, mockState, mockResponsive, true);
    expect(styles.cssVariables['--od-sidebar-width']).toBe('80px');
    expect(styles.sidebar.width).toBe('80px');
  });

  it('should add fixed header styles', () => {
    const state = {
      ...mockState,
      header: { ...mockState.header, fixed: true },
    };
    const styles = createStylesheet({}, state, mockResponsive);
    expect(styles.header.position).toBe('fixed');
    expect(styles.header.top).toBe('0');
    expect(styles.header.zIndex).toBe('1000');
  });

  it('should add full width header styles', () => {
    const state = {
      ...mockState,
      header: { ...mockState.header, full: true },
    };
    const styles = createStylesheet({}, state, mockResponsive);
    expect(styles.header.width).toBe('100%');
  });

  it('should add fixed footer styles', () => {
    const state = {
      ...mockState,
      footer: { ...mockState.footer, fixed: true },
    };
    const styles = createStylesheet({}, state, mockResponsive);
    expect(styles.footer.position).toBe('fixed');
    expect(styles.footer.bottom).toBe('0');
    expect(styles.footer.zIndex).toBe('1000');
  });

  it('should add overlay sidebar styles for mobile', () => {
    const responsive = { ...mockResponsive, isMobile: true };
    const styles = createStylesheet({}, mockState, responsive);
    expect(styles.sidebar.position).toBe('fixed');
    expect(styles.sidebar.zIndex).toBe('1001');
  });

  it('should add overlay sidebar styles when configured', () => {
    const state = {
      ...mockState,
      sidebar: { ...mockState.sidebar, overlay: true },
    };
    const styles = createStylesheet({}, state, mockResponsive);
    expect(styles.sidebar.position).toBe('fixed');
    expect(styles.sidebar.zIndex).toBe('1001');
  });

  it('should handle content scrollable', () => {
    const styles = createStylesheet({}, mockState, mockResponsive);
    expect(styles.content.overflow).toBe('auto');
  });

  it('should handle non-scrollable content', () => {
    const state = {
      ...mockState,
      content: { ...mockState.content, scrollable: false },
    };
    const styles = createStylesheet({}, state, mockResponsive);
    expect(styles.content.overflow).toBeUndefined();
  });

  it('should use custom animation config', () => {
    const styles = createStylesheet(
      { animation: { enabled: true, duration: 300, easing: 'linear' } },
      mockState,
      mockResponsive
    );
    expect(styles.cssVariables['--od-animation-duration']).toBe('300ms');
    expect(styles.cssVariables['--od-animation-easing']).toBe('linear');
  });

  it('should disable animation when configured', () => {
    const styles = createStylesheet(
      { animation: { enabled: false } },
      mockState,
      mockResponsive
    );
    expect(styles.cssVariables['--od-animation-enabled']).toBe('0');
  });
});
