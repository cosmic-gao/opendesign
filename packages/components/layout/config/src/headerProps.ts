import type { ElementType, CSSProperties, VNode } from './types';
import type { HeaderConfig } from './header';

export interface HeaderProps extends Partial<HeaderConfig> {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
