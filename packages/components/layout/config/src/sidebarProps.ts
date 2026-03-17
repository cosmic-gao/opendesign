import type { ElementType, CSSProperties, VNode } from './types';
import type { SidebarConfig } from './sidebar';

export interface SidebarProps extends Partial<SidebarConfig> {
  onCollapsedChange?: (collapsed: boolean) => void;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
