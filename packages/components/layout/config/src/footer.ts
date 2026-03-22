export interface FooterConfig {
  enabled?: boolean;
  height?: number;
  fixed?: boolean;
  full?: boolean;
}

export interface FooterProps<VNode, CSSProperties, Element> extends Partial<FooterConfig> {
  as?: Element;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
