import type { ElementType, ReactNode } from './types';

export interface FooterConfig {
  height?: number;
  fixed?: boolean;
  fullWidth?: boolean;
}

export interface FooterProps extends FooterConfig {
  as?: ElementType;
  className?: string;
  style?: Record<string, string | number>;
  children?: ReactNode;
}
