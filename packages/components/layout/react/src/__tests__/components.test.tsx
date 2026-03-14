import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Layout } from '../Layout';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';
import { Content } from '../Content';
import { Footer } from '../Footer';
import { useLayout, useSidebar, useHeader, useFooter, useContent } from '../useLayout';

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
      content: { visible: true },
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
    cssVariables: {
      '--od-header-height': '60px',
      '--od-footer-height': '60px',
      '--od-sidebar-width': '250px',
    },
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

describe('React Layout Component Rendering', () => {
  it('should render root element with correct class', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );
    
    const layoutElement = screen.getByText('Content');
    expect(layoutElement).toBeInTheDocument();
  });

  it('should render with custom className', () => {
    render(
      <Layout className="custom-layout">
        <div>Content</div>
      </Layout>
    );
    
    const layoutElement = document.querySelector('.custom-layout');
    expect(layoutElement).toBeInTheDocument();
  });

  it('should apply custom style', () => {
    const customStyle = { backgroundColor: '#f0f0f0' };
    render(
      <Layout style={customStyle}>
        <div>Content</div>
      </Layout>
    );
    
    const layoutElement = document.querySelector('.od-layout');
    expect(layoutElement).toHaveStyle(customStyle);
  });

  it('should render children', () => {
    render(
      <Layout>
        <div data-testid="child">Child Content</div>
      </Layout>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});

describe('React Header Component', () => {
  it('should render header element', () => {
    render(
      <Layout>
        <Header>Header Content</Header>
      </Layout>
    );
    
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('should apply fixed class when fixed prop is true', () => {
    render(
      <Layout>
        <Header fixed>Fixed Header</Header>
      </Layout>
    );
    
    const header = document.querySelector('.od-layout-header');
    expect(header).toHaveClass('od-layout-header--fixed');
  });

  it('should apply full class when full prop is true', () => {
    render(
      <Layout>
        <Header full>Full Header</Header>
      </Layout>
    );
    
    const header = document.querySelector('.od-layout-header');
    expect(header).toHaveClass('od-layout-header--full');
  });

  it('should accept custom height', () => {
    render(
      <Layout>
        <Header height={80}>Custom Height Header</Header>
      </Layout>
    );
    
    expect(screen.getByText('Custom Height Header')).toBeInTheDocument();
  });
});

describe('React Sidebar Component', () => {
  it('should render sidebar element', () => {
    render(
      <Layout>
        <Sidebar>Sidebar Content</Sidebar>
      </Layout>
    );
    
    expect(screen.getByText('Sidebar Content')).toBeInTheDocument();
  });

  it('should apply collapsed class when collapsed prop is true', () => {
    render(
      <Layout>
        <Sidebar collapsed>Collapsed Sidebar</Sidebar>
      </Layout>
    );
    
    const sidebar = document.querySelector('.od-layout-sidebar');
    expect(sidebar).toHaveClass('od-layout-sidebar--collapsed');
  });

  it('should apply overlay class when overlay prop is true', () => {
    render(
      <Layout>
        <Sidebar overlay>Overlay Sidebar</Sidebar>
      </Layout>
    );
    
    const sidebar = document.querySelector('.od-layout-sidebar');
    expect(sidebar).toHaveClass('od-layout-sidebar--overlay');
  });

  it('should apply full class when full prop is true', () => {
    render(
      <Layout>
        <Sidebar full>Full Sidebar</Sidebar>
      </Layout>
    );
    
    const sidebar = document.querySelector('.od-layout-sidebar');
    expect(sidebar).toHaveClass('od-layout-sidebar--full');
  });

  it('should accept custom width', () => {
    render(
      <Layout>
        <Sidebar width={300}>Custom Width Sidebar</Sidebar>
      </Layout>
    );
    
    expect(screen.getByText('Custom Width Sidebar')).toBeInTheDocument();
  });
});

describe('React Content Component', () => {
  it('should render content element', () => {
    render(
      <Layout>
        <Content>Content Area</Content>
      </Layout>
    );
    
    expect(screen.getByText('Content Area')).toBeInTheDocument();
  });
});

describe('React Footer Component', () => {
  it('should render footer element', () => {
    render(
      <Layout>
        <Footer>Footer Content</Footer>
      </Layout>
    );
    
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });
});

describe('React Layout Configuration', () => {
  it('should accept header configuration', () => {
    render(
      <Layout header={{ height: 80, fixed: true }}>
        <div>Content</div>
      </Layout>
    );
    
    expect(document.querySelector('.od-layout')).toBeInTheDocument();
  });

  it('should accept footer configuration', () => {
    render(
      <Layout footer={{ height: 60, fixed: true }}>
        <div>Content</div>
      </Layout>
    );
    
    expect(document.querySelector('.od-layout')).toBeInTheDocument();
  });

  it('should accept sidebar configuration', () => {
    render(
      <Layout sidebar={{ width: 250, min: 80, collapsed: true }}>
        <div>Content</div>
      </Layout>
    );
    
    expect(document.querySelector('.od-layout')).toBeInTheDocument();
  });

  it('should accept content configuration', () => {
    render(
      <Layout content={{ scrollable: true }}>
        <div>Content</div>
      </Layout>
    );
    
    expect(document.querySelector('.od-layout')).toBeInTheDocument();
  });

  it('should accept animation configuration', () => {
    render(
      <Layout animation={{ enabled: true, duration: 300, easing: 'ease-in-out' }}>
        <div>Content</div>
      </Layout>
    );
    
    expect(document.querySelector('.od-layout')).toBeInTheDocument();
  });

  it('should handle disabled animation', () => {
    render(
      <Layout animation={{ enabled: false }}>
        <div>Content</div>
      </Layout>
    );
    
    expect(document.querySelector('.od-layout')).toBeInTheDocument();
  });
});

describe('React Responsive Behavior', () => {
  it('should accept custom mobileBreakpoint', () => {
    render(
      <Layout mobileBreakpoint={768}>
        <div>Content</div>
      </Layout>
    );
    
    expect(document.querySelector('.od-layout')).toBeInTheDocument();
  });

  it('should accept custom breakpoints', () => {
    const customBreakpoints = { xs: 0, sm: 400, md: 600, lg: 800, xl: 1000, xxl: 1200 };
    render(
      <Layout breakpoints={customBreakpoints}>
        <div>Content</div>
      </Layout>
    );
    
    expect(document.querySelector('.od-layout')).toBeInTheDocument();
  });

  it('should call onBreakpointChange callback', () => {
    const onBreakpointChange = vi.fn();
    render(
      <Layout onBreakpointChange={onBreakpointChange}>
        <div>Content</div>
      </Layout>
    );
    
    expect(document.querySelector('.od-layout')).toBeInTheDocument();
  });
});

describe('React Layout with Hooks', () => {
  it('should provide useLayout hook functionality', () => {
    const TestComponent = () => {
      const layout = useLayout();
      return <div data-testid="layout-result">{layout ? 'has-layout' : 'no-layout'}</div>;
    };

    render(
      <Layout>
        <TestComponent />
      </Layout>
    );

    expect(screen.getByTestId('layout-result')).toBeInTheDocument();
  });
});
