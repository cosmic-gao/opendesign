export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface Breakpoints {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  xxl?: number;
}

export type ElementType = string | React.ComponentType<any>;

export type ReactNode = any;

export type CSSProperties = Record<string, string | number | undefined>;
