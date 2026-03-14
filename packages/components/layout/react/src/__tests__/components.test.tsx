import { describe, it, expect, vi } from 'vitest';

vi.mock('@openlayout/core', () => ({
  createResponsive: vi.fn(() => ({
    breakpoint: 'lg',
    breakpoints: { xs: 480, sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1400 },
    isAbove: (_bp: string) => true,
    isBelow: (_bp: string) => false,
    isMobile: false,
  })),
  createStore: vi.fn(() => ({
    state: {
      header: { visible: true, fixed: false, height: 60 },
      footer: { visible: true, fixed: false, height: 60 },
      sidebar: { visible: true, collapsed: false, width: 250, min: 60 },
    },
    actions: {
      toggleSidebar: vi.fn(),
      setSidebarCollapsed: vi.fn(),
      toggleHeader: vi.fn(),
      setHeaderVisible: vi.fn(),
      setHeaderFixed: vi.fn(),
      toggleFooter: vi.fn(),
      setFooterVisible: vi.fn(),
      setFooterFixed: vi.fn(),
    },
  })),
  createStylesheet: vi.fn(() => ({
    root: { display: 'flex', flexDirection: 'column', minHeight: '100vh' },
    header: { height: '60px' },
    footer: { height: '60px' },
    sidebar: { width: '250px' },
    content: { flex: 1 },
    cssVariables: {},
  })),
}));

vi.mock('@openlayout/config', () => ({
  resolveConfig: vi.fn(() => ({
    header: { enabled: true, height: 60, fixed: false, visible: true },
    footer: { enabled: true, height: 60, fixed: false, visible: true },
    sidebar: { enabled: true, width: 250, min: 60, visible: true, collapsed: false, collapsible: false, overlay: false },
    content: { enabled: true, scrollable: false },
    animation: { enabled: false },
  })),
}));

describe('React Layout Module Exports', () => {
  it('should export Layout from index', async () => {
    const { Layout } = await import('../index');
    expect(Layout).toBeDefined();
    expect(typeof Layout).toBe('function');
  });

  it('should export Header from index', async () => {
    const { Header } = await import('../index');
    expect(Header).toBeDefined();
    expect(typeof Header).toBe('function');
  });

  it('should export Footer from index', async () => {
    const { Footer } = await import('../index');
    expect(Footer).toBeDefined();
    expect(typeof Footer).toBe('function');
  });

  it('should export Sidebar from index', async () => {
    const { Sidebar } = await import('../index');
    expect(Sidebar).toBeDefined();
    expect(typeof Sidebar).toBe('function');
  });

  it('should export Content from index', async () => {
    const { Content } = await import('../index');
    expect(Content).toBeDefined();
    expect(typeof Content).toBe('function');
  });

  it('should export useLayout from index', async () => {
    const { useLayout } = await import('../index');
    expect(useLayout).toBeDefined();
    expect(typeof useLayout).toBe('function');
  });

  it('should export useSidebar from index', async () => {
    const { useSidebar } = await import('../index');
    expect(useSidebar).toBeDefined();
    expect(typeof useSidebar).toBe('function');
  });

  it('should export useHeader from index', async () => {
    const { useHeader } = await import('../index');
    expect(useHeader).toBeDefined();
    expect(typeof useHeader).toBe('function');
  });

  it('should export useFooter from index', async () => {
    const { useFooter } = await import('../index');
    expect(useFooter).toBeDefined();
    expect(typeof useFooter).toBe('function');
  });

  it('should export useContent from index', async () => {
    const { useContent } = await import('../index');
    expect(useContent).toBeDefined();
    expect(typeof useContent).toBe('function');
  });

  it('should export types from index', async () => {
    const index = await import('../index');
    expect(index).toBeDefined();
  });
});
