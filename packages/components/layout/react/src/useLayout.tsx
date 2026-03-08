import { createContext, useContext, useState, useEffect, useMemo, type ReactNode, useCallback } from 'react';
import { createLayout, type LayoutStore } from '@openlayout/core';
import { LAYOUT_DEFAULTS } from '@openlayout/config';

interface LayoutContextValue {
  store: LayoutStore;
  isMobile: boolean;
  theme: 'light' | 'dark';
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function useLayoutContext() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a Layout component');
  }
  return context;
}

export function useLayout() {
  const { store, isMobile, theme } = useLayoutContext();

  return {
    direction: store.direction,
    headerHeight: store.headerHeight,
    footerHeight: store.footerHeight,
    sidebarWidth: store.sidebarWidth,
    collapsedWidth: store.collapsedWidth,
    headerFixed: store.headerFixed,
    footerFixed: store.footerFixed,
    sidebarFullHeight: store.sidebarFullHeight,
    sidebarCollapsed: store.sidebarCollapsed,
    sidebarVisible: store.sidebarVisible,
    headerVisible: store.headerVisible,
    footerVisible: store.footerVisible,
    contentScrollable: store.contentScrollable,
    breakpoint: store.breakpoint,
    breakpoints: store.breakpoints,
    currentWidth: store.currentWidth,
    isMobile,
    theme,
    animated: store.animated,
    animationDuration: store.animationDuration,

    setDirection: store.setDirection,
    setHeaderHeight: store.setHeaderHeight,
    setFooterHeight: store.setFooterHeight,
    setSidebarWidth: store.setSidebarWidth,
    setCollapsedWidth: store.setCollapsedWidth,
    setHeaderFixed: store.setHeaderFixed,
    setFooterFixed: store.setFooterFixed,
    setSidebarFullHeight: store.setSidebarFullHeight,
    setSidebarCollapsed: store.setSidebarCollapsed,
    setSidebarVisible: store.setSidebarVisible,
    setHeaderVisible: store.setHeaderVisible,
    setFooterVisible: store.setFooterVisible,
    setContentScrollable: store.setContentScrollable,
  };
}

export function useSidebar() {
  const { store } = useLayoutContext();

  const toggle = useCallback(() => {
    store.setSidebarCollapsed(!store.sidebarCollapsed);
  }, [store]);

  const collapse = useCallback(() => {
    store.setSidebarCollapsed(true);
  }, [store]);

  const expand = useCallback(() => {
    store.setSidebarCollapsed(false);
  }, [store]);

  const show = useCallback(() => {
    store.setSidebarVisible(true);
  }, [store]);

  const hide = useCallback(() => {
    store.setSidebarVisible(false);
  }, [store]);

  return {
    collapsed: store.sidebarCollapsed,
    visible: store.sidebarVisible,
    width: store.sidebarCollapsed ? store.collapsedWidth : store.sidebarWidth,
    collapsible: true,
    toggle,
    collapse,
    expand,
    show,
    hide,
  };
}

export function useHeader() {
  const { store } = useLayoutContext();

  const show = useCallback(() => {
    store.setHeaderVisible(true);
  }, [store]);

  const hide = useCallback(() => {
    store.setHeaderVisible(false);
  }, [store]);

  return {
    visible: store.headerVisible,
    fixed: store.headerFixed,
    height: store.headerHeight,
    show,
    hide,
  };
}

export function useFooter() {
  const { store } = useLayoutContext();

  const show = useCallback(() => {
    store.setFooterVisible(true);
  }, [store]);

  const hide = useCallback(() => {
    store.setFooterVisible(false);
  }, [store]);

  return {
    visible: store.footerVisible,
    fixed: store.footerFixed,
    height: store.footerHeight,
    show,
    hide,
  };
}

interface LayoutConfig {
  direction?: 'horizontal' | 'vertical';
  header?: { height?: number; fixed?: boolean; fullWidth?: boolean };
  footer?: { height?: number; fixed?: boolean; fullWidth?: boolean };
  sidebar?: { width?: number; collapsedWidth?: number; collapsible?: boolean; defaultCollapsed?: boolean; fullHeight?: boolean; overlay?: boolean };
  content?: { scrollable?: boolean };
  breakpoints?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number; xxl?: number };
  mobileBreakpoint?: number;
  onBreakpointChange?: (breakpoint: string) => void;
  animated?: boolean;
  animationDuration?: number;
  theme?: 'light' | 'dark' | 'system';
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

export function LayoutProvider({ children, config = {} }: { children: ReactNode; config?: LayoutConfig }) {
  const store = useMemo(() => createLayout(config), [config]);
  const [isMobile, setIsMobile] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(config.theme === 'system' ? 'light' : (config.theme ?? 'light'));

  useEffect(() => {
    const updateResponsive = () => {
      const width = window.innerWidth;
      store.setWidth(width);

      const mobileBreakpoint = config.mobileBreakpoint ?? LAYOUT_DEFAULTS.MOBILE_BREAKPOINT;
      const mobile = width < mobileBreakpoint;
      setIsMobile(mobile);

      config.onBreakpointChange?.(store.breakpoint);
    };

    const updateTheme = () => {
      if (config.theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const newTheme = prefersDark ? 'dark' : 'light';
        setTheme(newTheme);
        config.onThemeChange?.(newTheme);
      }
    };

    updateResponsive();
    window.addEventListener('resize', updateResponsive);

    updateTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);

    return () => {
      window.removeEventListener('resize', updateResponsive);
      mediaQuery.removeEventListener('change', updateTheme);
    };
  }, [config.mobileBreakpoint, config.onBreakpointChange, config.theme, config.onThemeChange, store]);

  const value = useMemo(() => ({
    store,
    isMobile,
    theme,
  }), [store, isMobile, theme]);

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}
