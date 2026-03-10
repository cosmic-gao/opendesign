import type { ElementType, ReactNode } from './types';

export interface ContentConfig {
  scrollable?: boolean;
}

export interface ContentProps extends ContentConfig {
  as?: ElementType;
  className?: string;
  style?: Record<string, string | number>;
  children?: ReactNode;
}
