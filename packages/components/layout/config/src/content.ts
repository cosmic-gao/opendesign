import type { ElementType, ReactNode } from './types';

export interface ContentConfig {
  enabled?: boolean;
  scrollable?: boolean;
}

export interface ContentProps extends Partial<ContentConfig> {
  as?: ElementType;
  className?: string;
  style?: Record<string, string | number>;
  children?: ReactNode;
}
