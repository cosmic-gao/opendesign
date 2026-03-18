export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface Breakpoints {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  xxl?: number;
}

export type CSSProperties = Record<string, string | number>;

export interface VNode<Props = Record<string, unknown>> {
  type: string;
  props: Props;
  children?: VNode | VNode[];
}
