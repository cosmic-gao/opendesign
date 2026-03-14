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

describe('Vue Layout Module Exports', () => {
  it('should export Layout component', async () => {
    const { Layout } = await import('../Layout');
    expect(Layout).toBeDefined();
    expect(Layout.name).toBe('ODLayout');
  });

  it('should export Header component', async () => {
    const { Header } = await import('../Header');
    expect(Header).toBeDefined();
  });

  it('should export Footer component', async () => {
    const { Footer } = await import('../Footer');
    expect(Footer).toBeDefined();
  });

  it('should export Sidebar component', async () => {
    const { Sidebar } = await import('../Sidebar');
    expect(Sidebar).toBeDefined();
  });

  it('should export Content component', async () => {
    const { Content } = await import('../Content');
    expect(Content).toBeDefined();
  });

  it('should export useLayout composable', async () => {
    const { useLayout } = await import('../useLayout');
    expect(useLayout).toBeDefined();
    expect(typeof useLayout).toBe('function');
  });

  it('should export all components from index', async () => {
    const index = await import('../index');
    expect(index.Layout).toBeDefined();
    expect(index.Header).toBeDefined();
    expect(index.Footer).toBeDefined();
    expect(index.Sidebar).toBeDefined();
    expect(index.Content).toBeDefined();
    expect(index.useLayout).toBeDefined();
  });
});

describe('Vue Layout Component Structure', () => {
  it('should have Layout component with required props', async () => {
    const { Layout } = await import('../Layout');
    expect(Layout.props).toBeDefined();
    expect(Layout.props.header).toBeDefined();
    expect(Layout.props.footer).toBeDefined();
    expect(Layout.props.sidebar).toBeDefined();
    expect(Layout.props.content).toBeDefined();
    expect(Layout.props.breakpoints).toBeDefined();
    expect(Layout.props.mobileBreakpoint).toBeDefined();
    expect(Layout.props.animation).toBeDefined();
  });

  it('should have default prop values', async () => {
    const { Layout } = await import('../Layout');
    expect(Layout.props.mobileBreakpoint.default).toBe(768);
    expect(Layout.props.className.default).toBe('');
  });
});
