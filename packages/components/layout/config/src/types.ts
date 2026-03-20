export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export type ElementType = string;

export interface Breakpoints {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  xxl?: number;
}

export type CSSProperties = Record<string, string | number>;

export interface VNode<
  Type extends string = string,
  Props extends Record<string, unknown> = Record<string, unknown>
> {
  type: Type;
  props: Props;
  children?: VNode[];
}
