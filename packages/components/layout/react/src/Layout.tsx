import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode, type CSSProperties } from 'react';
import { createResponsive, createStore, createStylesheet } from '@openlayout/core';
import type { LayoutProps, LayoutConfig, Breakpoint } from '@openlayout/config';
import { resolveConfig } from '@openlayout/config';

interface LayoutContextValue {
  config: LayoutConfig;
  state: ReturnType<typeof createStore>['state'];
  actions: ReturnType<typeof createStore>['actions'];
  styles: ReturnType<typeof createStylesheet>;
  responsive: {
    breakpoint: Breakpoint;
    width: number;
    isMobile: boolean;
  };
}

export type { LayoutContextValue };

const LayoutContext = createContext<LayoutContextValue | null>(null);

export { LayoutContext };

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within LayoutProvider');
  }
  return context;
};

interface LayoutComponentProps extends LayoutProps {
  children?: ReactNode;
}

export const Layout: React.FC<LayoutComponentProps> = (props) => {
  const { children, className, style, ...rest } = props;

  const config = useMemo<LayoutConfig>(() => resolveConfig(rest), [rest]);

  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');
  const [width, setWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 0);
  const isMobile = useMemo(() => width < (props.mobileBreakpoint ?? 768), [width, props.mobileBreakpoint]);

  useEffect(() => {
    const updateResponsive = () => {
      const current = createResponsive({ breakpoints: props.breakpoints });
      if (current.breakpoint !== breakpoint) {
        setBreakpoint(current.breakpoint);
        props.onBreakpointChange?.(current.breakpoint, window.innerWidth);
      }
      setWidth(window.innerWidth);
    };

    window.addEventListener('resize', updateResponsive);
    updateResponsive();

    return () => window.removeEventListener('resize', updateResponsive);
  }, [props.breakpoints, breakpoint, props.onBreakpointChange]);

  const store = useMemo(() => createStore(config), [config]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(store.state.sidebar.collapsed);
  const [headerVisible, setHeaderVisible] = useState(store.state.header.visible);
  const [headerFixed, setHeaderFixed] = useState(store.state.header.fixed);
  const [footerVisible, setFooterVisible] = useState(store.state.footer.visible);
  const [footerFixed, setFooterFixed] = useState(store.state.footer.fixed);

  const layoutState = useMemo(() => ({
    ...store.state,
    sidebar: { ...store.state.sidebar, collapsed: sidebarCollapsed },
    header: { ...store.state.header, visible: headerVisible, fixed: headerFixed },
    footer: { ...store.state.footer, visible: footerVisible, fixed: footerFixed },
  }), [store.state, sidebarCollapsed, headerVisible, headerFixed, footerVisible, footerFixed]);

  const actions = useMemo(() => ({
    toggleSidebar: () => setSidebarCollapsed(prev => !prev),
    setSidebarCollapsed,
    toggleHeader: () => setHeaderVisible(prev => !prev),
    setHeaderVisible,
    setHeaderFixed,
    toggleFooter: () => setFooterVisible(prev => !prev),
    setFooterVisible,
    setFooterFixed,
  }), [setSidebarCollapsed, setHeaderVisible, setHeaderFixed, setFooterVisible, setFooterFixed]);

  const styles = useMemo(() => createStylesheet({
    config,
    breakpoint,
    isMobile,
    collapsed: sidebarCollapsed,
  }), [config, breakpoint, isMobile, sidebarCollapsed]);

  const contextValue = useMemo(() => ({
    config,
    state: layoutState,
    actions,
    styles,
    responsive: { breakpoint, width, isMobile },
  }), [config, layoutState, actions, styles, breakpoint, width, isMobile]);

  return (
    <LayoutContext.Provider value={contextValue}>
      <div className={`od-layout ${className ?? ''}`} style={{ ...styles.root, ...style } as CSSProperties}>
        {children}
      </div>
    </LayoutContext.Provider>
  );
};
