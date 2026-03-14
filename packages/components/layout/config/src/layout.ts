import type { Breakpoint, Breakpoints } from './types';
import type { HeaderConfig } from './header';
import type { FooterConfig } from './footer';
import type { SidebarConfig } from './sidebar';
import type { ContentConfig } from './content';
import type { AnimationConfig } from './animation';

export interface LayoutConfig {
  header?: HeaderConfig;
  footer?: FooterConfig;
  sidebar?: SidebarConfig;
  content?: ContentConfig;
  breakpoints?: Breakpoints;
  mobileBreakpoint?: number;
  animation?: AnimationConfig;
  onBreakpointChange?: (breakpoint: Breakpoint, width: number) => void;
}
