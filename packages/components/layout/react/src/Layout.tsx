import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { createResponsive, createLayoutState, createStylesheet } from '@openlayout/core';
import type { LayoutConfig, LayoutProps, Breakpoint } from '@openlayout/config';
import type { LayoutState, LayoutStyles, LayoutActions, ResponsiveState } from '@openlayout/core';

interface LayoutContextValue {
  config: LayoutConfig;
  state: LayoutState;
  styles: LayoutStyles;
  responsive: ResponsiveState;
  actions: LayoutActions;
}

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

  const config = useMemo<LayoutConfig>(() => rest as LayoutConfig, [rest]);

  const [, setTick] = useState(0);

  useEffect(() => {
    const updateResponsive = () => {
      setTick(t => t + 1);
      const current = createResponsive({ breakpoints: props.breakpoints, mobileBreakpoint: props.mobileBreakpoint });
      props.onBreakpointChange?.(current.breakpoint, current.width);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateResponsive);
      updateResponsive();
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateResponsive);
      }
    };
  }, [props.breakpoints, props.mobileBreakpoint, props.onBreakpointChange]);

  const responsive = useMemo<ResponsiveState>(() => createResponsive({
    breakpoints: config.breakpoints,
    mobileBreakpoint: config.mobileBreakpoint,
  }), [config.breakpoints, config.mobileBreakpoint, setTick]);

  const layoutState = useMemo(() => createLayoutState(config), [config]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(layoutState.sidebar.collapsed);
  const [headerVisible, setHeaderVisible] = useState(layoutState.header.visible);
  const [headerFixed, setHeaderFixed] = useState(layoutState.header.fixed);
  const [footerVisible, setFooterVisible] = useState(layoutState.footer.visible);
  const [footerFixed, setFooterFixed] = useState(layoutState.footer.fixed);

  const state = useMemo(() => ({
    ...layoutState,
    sidebar: { ...layoutState.sidebar, collapsed: sidebarCollapsed },
    header: { ...layoutState.header, visible: headerVisible, fixed: headerFixed },
    footer: { ...layoutState.footer, visible: footerVisible, fixed: footerFixed },
  }), [layoutState, sidebarCollapsed, headerVisible, headerFixed, footerVisible, footerFixed]);

  const actions: LayoutActions = useMemo(() => ({
    toggleSidebar: () => setSidebarCollapsed(prev => !prev),
    setSidebarCollapsed,
    toggleHeader: () => setHeaderVisible(prev => !prev),
    setHeaderVisible,
    setHeaderFixed,
    toggleFooter: () => setFooterVisible(prev => !prev),
    setFooterVisible,
    setFooterFixed,
  }), []);

  const responsive = useMemo<ResponsiveState>(() => createResponsive({
    breakpoints: config.breakpoints,
    mobileBreakpoint: config.mobileBreakpoint,
  }), [config.breakpoints, config.mobileBreakpoint]);

  const styles = useMemo(() => createStylesheet(config, state, responsive, sidebarCollapsed), [config, state, responsive, sidebarCollapsed]);

  const contextValue = useMemo(() => ({
    config,
    state,
    styles,
    responsive,
    actions,
  }), [config, state, styles, responsive, actions]);

  return (
    <LayoutContext.Provider value={contextValue}>
      <div className={`od-layout ${className ?? ''}`} style={{ ...styles.root, ...style }}>
        {children}
      </div>
    </LayoutContext.Provider>
  );
};
