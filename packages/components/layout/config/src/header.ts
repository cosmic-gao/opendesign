import type { ElementType } from './types';

export interface HeaderConfig {
  enabled?: boolean;
  height?: number;
  fixed?: boolean;
  full?: boolean;
}

export interface HeaderProps<VNode, CSSProperties> extends Partial<HeaderConfig> {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
