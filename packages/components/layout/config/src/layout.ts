import type { Breakpoint, Breakpoints } from './types';
import type { AnimationConfig } from './animation';
import type { HeaderConfig } from './header';
import type { FooterConfig } from './footer';
import type { SidebarConfig } from './sidebar';
import type { ContentConfig } from './content';

export interface LayoutConfig {
  header: HeaderConfig;
  footer: FooterConfig;
  sidebar: SidebarConfig;
  content: ContentConfig;
  breakpoints: Breakpoints;
  mobileBreakpoint: number;
  animation: AnimationConfig;
}

export interface LayoutProps<VNode, CSSProperties> extends Partial<LayoutConfig> {
  onBreakpointChange?: (breakpoint: Breakpoint, width: number) => void;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
