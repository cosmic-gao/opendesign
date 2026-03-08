import type { Breakpoint, Breakpoints } from '@openlayout/config';

export { Breakpoint, Breakpoints };

export interface LayoutState {
  direction: 'horizontal' | 'vertical';
  headerHeight: number;
  footerHeight: number;
  sidebarWidth: number;
  collapsedWidth: number;
  headerFixed: boolean;
  footerFixed: boolean;
  sidebarFullHeight: boolean;
  sidebarCollapsed: boolean;
  sidebarVisible: boolean;
  headerVisible: boolean;
  footerVisible: boolean;
  contentScrollable: boolean;
  animated: boolean;
  animationDuration: number;
  theme: 'light' | 'dark' | 'system';
  breakpoints: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number; xxl?: number };
  breakpoint: Breakpoint;
  currentWidth: number;
}

export interface LayoutActions {
  setDirection: (direction: 'horizontal' | 'vertical') => void;
  setHeaderHeight: (height: number) => void;
  setFooterHeight: (height: number) => void;
  setSidebarWidth: (width: number) => void;
  setCollapsedWidth: (width: number) => void;
  setHeaderFixed: (fixed: boolean) => void;
  setFooterFixed: (fixed: boolean) => void;
  setSidebarFullHeight: (fullHeight: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarVisible: (visible: boolean) => void;
  setHeaderVisible: (visible: boolean) => void;
  setFooterVisible: (visible: boolean) => void;
  setContentScrollable: (scrollable: boolean) => void;
  setWidth: (width: number) => void;
}

export type LayoutStore = LayoutState & LayoutActions;

export interface SidebarState {
  collapsed: boolean;
  visible: boolean;
  width: number;
  expandedWidth: number;
  collapsedWidth: number;
}

export interface SidebarActions {
  toggle: () => void;
  collapse: () => void;
  expand: () => void;
  show: () => void;
  hide: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export type SidebarStore = SidebarState & SidebarActions;

export interface HeaderState {
  visible: boolean;
  fixed: boolean;
  height: number;
}

export interface HeaderActions {
  show: () => void;
  hide: () => void;
  setFixed: (fixed: boolean) => void;
  setHeight: (height: number) => void;
}

export type HeaderStore = HeaderState & HeaderActions;

export interface FooterState {
  visible: boolean;
  fixed: boolean;
  height: number;
}

export interface FooterActions {
  show: () => void;
  hide: () => void;
  setFixed: (fixed: boolean) => void;
  setHeight: (height: number) => void;
}

export type FooterStore = FooterState & FooterActions;
