import type { ElementType, CSSProperties, VNode } from './types';

export interface ContentConfig {
  enabled?: boolean;
  scrollable?: boolean;
}

export interface ContentProps extends Partial<ContentConfig> {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
