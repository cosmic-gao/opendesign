import type { ElementType } from './types';

export interface SidebarConfig {
  enabled?: boolean;
  width?: number;
  min?: number;
  collapsible?: boolean;
  collapsed?: boolean;
  full?: boolean;
  overlay?: boolean;
}

export interface SidebarProps<VNode, CSSProperties> extends Partial<SidebarConfig> {
  onCollapsedChange?: (collapsed: boolean) => void;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
