export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface Breakpoints {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  xxl?: number;
}

export interface CSSProperties {
  [key: string]: string | number;
}

export type ElementType = string;

export interface VNode<Props = unknown> {
  type: ElementType;
  props: Props;
  children?: VNode<Props> | VNode<Props>[];
}
