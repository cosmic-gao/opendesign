import type { ElementType, CSSProperties, VNode } from './types';
import type { ContentConfig } from './content';

export interface ContentProps extends Partial<ContentConfig> {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}
