import type { ElementType } from './types';

export interface ContentConfig {
  enabled?: boolean;
  scrollable?: boolean;
}

export interface ContentProps<VNode, CSSProperties> extends Partial<ContentConfig> {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
