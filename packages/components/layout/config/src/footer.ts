import type { ElementType, ReactNode } from './types';

export interface FooterConfig {
  enabled?: boolean;
  height?: number;
  fixed?: boolean;
  full?: boolean;
}

export interface FooterProps extends Partial<FooterConfig> {
  as?: ElementType;
  className?: string;
  style?: Record<string, string | number>;
  children?: ReactNode;
}
