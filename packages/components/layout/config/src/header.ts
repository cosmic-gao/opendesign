import type { ElementType, ReactNode } from './types';

export interface HeaderConfig {
  height?: number;
  fixed?: boolean;
  fullWidth?: boolean;
}

export interface HeaderProps extends HeaderConfig {
  as?: ElementType;
  className?: string;
  style?: Record<string, string | number>;
  children?: ReactNode;
}
