export interface SidebarConfig {
  enabled?: boolean;
  width?: number;
  min?: number;
  collapsible?: boolean;
  collapsed?: boolean;
  full?: boolean;
  overlay?: boolean;
}

export interface SidebarProps<VNode, CSSProperties, Element> extends Partial<SidebarConfig> {
  onCollapsedChange?: (collapsed: boolean) => void;
  as?: Element;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
