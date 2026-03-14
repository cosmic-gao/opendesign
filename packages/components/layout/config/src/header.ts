import type { ElementType, ReactNode } from './types';

export interface HeaderConfig {
  enabled?: boolean;
  height?: number;
  fixed?: boolean;
  full?: boolean;
}

export interface HeaderProps extends Partial<HeaderConfig> {
  as?: ElementType;
  className?: string;
  style?: Record<string, string | number>;
  children?: ReactNode;
}
