import type { ElementType, ReactNode } from './types';

export interface SidebarConfig {
  width?: number;
  collapsedWidth?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  fullHeight?: boolean;
  overlay?: boolean;
}

export interface SidebarProps extends SidebarConfig {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  as?: ElementType;
  className?: string;
  style?: Record<string, string | number>;
  children?: ReactNode;
}
