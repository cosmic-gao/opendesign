export interface HeaderConfig {
  enabled?: boolean;
  height?: number;
  fixed?: boolean;
  full?: boolean;
}

export interface HeaderProps<VNode, CSSProperties, Element> extends Partial<HeaderConfig> {
  as?: Element;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
