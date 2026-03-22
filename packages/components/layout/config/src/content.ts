export interface ContentConfig {
  enabled?: boolean;
  scrollable?: boolean;
}

export interface ContentProps<VNode, CSSProperties, Element> extends Partial<ContentConfig> {
  as?: Element;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
