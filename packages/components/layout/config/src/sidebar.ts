import type { ElementType, ReactNode } from './types';

export interface SidebarConfig {
  enabled?: boolean;
  width?: number;
  min?: number;
  collapsible?: boolean;
  collapsed?: boolean;
  full?: boolean;
  overlay?: boolean;
}

export interface SidebarProps extends Partial<SidebarConfig> {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  as?: ElementType;
  className?: string;
  style?: Record<string, string | number>;
  children?: ReactNode;
}
