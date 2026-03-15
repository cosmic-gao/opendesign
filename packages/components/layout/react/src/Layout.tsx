import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { createResponsive, createStore, createStylesheet } from '@openlayout/core';
import type { LayoutConfig } from '@openlayout/config';
import type { LayoutState, LayoutStyles, ResponsiveState } from '@openlayout/core';

interface LayoutActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (value: boolean) => void;
  toggleHeader: () => void;
  setHeaderVisible: (value: boolean) => void;
  setHeaderFixed: (value: boolean) => void;
  toggleFooter: () => void;
  setFooterVisible: (value: boolean) => void;
  setFooterFixed: (value: boolean) => void;
}

export interface LayoutContextValue {
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

interface LayoutComponentProps extends LayoutConfig {
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Layout: React.FC<LayoutComponentProps> = (props) => {
  const { children, className, style, ...rest } = props;

  const config = useMemo<LayoutConfig>(() => rest as LayoutConfig, [rest]);
  const [tick, setTick] = useState(0);

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

  const baseState = useMemo(() => createStore(config), [config]);

  useMemo(() => {
    createResponsive({
      breakpoints: config.breakpoints,
      mobileBreakpoint: config.mobileBreakpoint,
    });
  }, [config.breakpoints, config.mobileBreakpoint, tick]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(baseState.sidebar.collapsed);
  const [headerVisible, setHeaderVisible] = useState(baseState.header.visible);
  const [headerFixed, setHeaderFixed] = useState(baseState.header.fixed);
  const [footerVisible, setFooterVisible] = useState(baseState.footer.visible);
  const [footerFixed, setFooterFixed] = useState(baseState.footer.fixed);

  const state = useMemo<LayoutState>(() => ({
    ...baseState,
    sidebar: { ...baseState.sidebar, collapsed: sidebarCollapsed },
    header: { ...baseState.header, visible: headerVisible, fixed: headerFixed },
    footer: { ...baseState.footer, visible: footerVisible, fixed: footerFixed },
  }), [baseState, sidebarCollapsed, headerVisible, headerFixed, footerVisible, footerFixed]);

  const responsive = useMemo<ResponsiveState>(() => createResponsive({
    breakpoints: config.breakpoints,
    mobileBreakpoint: config.mobileBreakpoint,
  }), [config.breakpoints, config.mobileBreakpoint]);

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
