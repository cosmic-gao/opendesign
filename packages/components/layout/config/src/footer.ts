import type { ElementType } from './types';

export interface FooterConfig {
  enabled?: boolean;
  height?: number;
  fixed?: boolean;
  full?: boolean;
}

export interface FooterProps<VNode, CSSProperties> extends Partial<FooterConfig> {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
