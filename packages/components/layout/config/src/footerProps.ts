import type { ElementType, CSSProperties, VNode } from './types';
import type { FooterConfig } from './footer';

export interface FooterProps extends Partial<FooterConfig> {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
