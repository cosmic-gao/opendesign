import type { Breakpoint, Breakpoints, ThemeMode, ReactNode } from './types';
import type { HeaderConfig } from './header';
import type { FooterConfig } from './footer';
import type { SidebarConfig } from './sidebar';
import type { ContentConfig } from './content';

export interface LayoutConfig {
  header?: HeaderConfig;
  footer?: FooterConfig;
  sidebar?: SidebarConfig;
  content?: ContentConfig;
  breakpoints?: Breakpoints;
  mobileBreakpoint?: number;
  animated?: boolean;
  animationDuration?: number;
  theme?: ThemeMode;
}

export interface LayoutProps extends Partial<LayoutConfig> {
  onBreakpointChange?: (breakpoint: Breakpoint, width: number) => void;
  onThemeChange?: (theme: Exclude<ThemeMode, 'system'>) => void;
  className?: string;
  style?: Record<string, string | number>;
  children?: ReactNode;
}
