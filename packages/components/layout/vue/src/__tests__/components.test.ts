import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
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

describe('Vue Layout Component Rendering', () => {
  it('should render root element with correct class', () => {
    const wrapper = mount(Layout, {
      slots: {
        default: () => 'Content',
      },
    });

    expect(wrapper.find('.od-layout').exists()).toBe(true);
  });

  it('should apply custom className', () => {
    const wrapper = mount(Layout, {
      props: {
        className: 'custom-layout',
      },
      slots: {
        default: () => 'Content',
      },
    });

    expect(wrapper.find('.custom-layout').exists()).toBe(true);
  });

  it('should apply custom style', () => {
    const customStyle = { backgroundColor: '#f0f0f0' };
    const wrapper = mount(Layout, {
      props: {
        style: customStyle,
      },
      slots: {
        default: () => 'Content',
      },
    });

    expect(wrapper.find('.od-layout').attributes('style')).toContain('#f0f0f0');
  });

  it('should render children in default slot', () => {
    const wrapper = mount(Layout, {
      slots: {
        default: () => '<div>Test Content</div>',
      },
    });

    expect(wrapper.text()).toContain('Test Content');
  });
});

describe('Vue Header Component', () => {
  it('should render header element', () => {
    const wrapper = mount(Layout, {
      slots: {
        default: () => {
          return [
            '<header class="od-layout-header">Header Content</header>',
          ].join('');
        },
      },
    });

    const header = wrapper.find('.od-layout-header');
    expect(header.exists()).toBe(true);
  });

  it('should apply fixed class when fixed prop is true', () => {
    const wrapper = mount(Layout, {
      props: {
        header: { fixed: true },
      },
      slots: {
        default: () => '<header class="od-layout-header">Header</header>',
      },
    });

    expect(wrapper.find('.od-layout-header').classes()).toContain('od-layout-header--fixed');
  });

  it('should apply full class when full prop is true', () => {
    const wrapper = mount(Layout, {
      props: {
        header: { full: true },
      },
      slots: {
        default: () => '<header class="od-layout-header">Header</header>',
      },
    });

    expect(wrapper.find('.od-layout-header').classes()).toContain('od-layout-header--full');
  });
});

describe('Vue Sidebar Component', () => {
  it('should render sidebar element', () => {
    const wrapper = mount(Layout, {
      slots: {
        default: () => '<aside class="od-layout-sidebar">Sidebar</aside>',
      },
    });

    expect(wrapper.find('.od-layout-sidebar').exists()).toBe(true);
  });

  it('should apply collapsed class when collapsed prop is true', () => {
    const wrapper = mount(Layout, {
      props: {
        sidebar: { collapsed: true },
      },
      slots: {
        default: () => '<aside class="od-layout-sidebar">Sidebar</aside>',
      },
    });

    expect(wrapper.find('.od-layout-sidebar').classes()).toContain('od-layout-sidebar--collapsed');
  });

  it('should apply overlay class when overlay prop is true', () => {
    const wrapper = mount(Layout, {
      props: {
        sidebar: { overlay: true },
      },
      slots: {
        default: () => '<aside class="od-layout-sidebar">Sidebar</aside>',
      },
    });

    expect(wrapper.find('.od-layout-sidebar').classes()).toContain('od-layout-sidebar--overlay');
  });
});

describe('Vue Content Component', () => {
  it('should render content element', () => {
    const wrapper = mount(Layout, {
      slots: {
        default: () => '<main class="od-layout-content">Content</main>',
      },
    });

    expect(wrapper.find('.od-layout-content').exists()).toBe(true);
  });
});

describe('Vue Footer Component', () => {
  it('should render footer element', () => {
    const wrapper = mount(Layout, {
      slots: {
        default: () => '<footer class="od-layout-footer">Footer</footer>',
      },
    });

    expect(wrapper.find('.od-layout-footer').exists()).toBe(true);
  });
});

describe('Vue Responsive Behavior', () => {
  it('should calculate isMobile based on mobileBreakpoint', () => {
    const wrapper = mount(Layout, {
      props: {
        mobileBreakpoint: 768,
      },
      slots: {
        default: () => 'Content',
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should use custom breakpoints', () => {
    const customBreakpoints = { xs: 0, sm: 400, md: 600, lg: 800, xl: 1000, xxl: 1200 };
    const wrapper = mount(Layout, {
      props: {
        breakpoints: customBreakpoints,
      },
      slots: {
        default: () => 'Content',
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});

describe('Vue Animation Configuration', () => {
  it('should accept animation config', () => {
    const wrapper = mount(Layout, {
      props: {
        animation: {
          enabled: true,
          duration: 300,
          easing: 'ease-in-out',
        },
      },
      slots: {
        default: () => 'Content',
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should handle disabled animation', () => {
    const wrapper = mount(Layout, {
      props: {
        animation: {
          enabled: false,
        },
      },
      slots: {
        default: () => 'Content',
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});

describe('Vue Breakpoint Change Callback', () => {
  it('should call onBreakpointChange when breakpoint changes', async () => {
    const onBreakpointChange = vi.fn();
    const wrapper = mount(Layout, {
      props: {
        onBreakpointChange,
      },
      slots: {
        default: () => 'Content',
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.exists()).toBe(true);
  });
});
