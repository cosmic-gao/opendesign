export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface Breakpoints {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  xxl?: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type ElementType = string | any;

export type ReactNode = any; // Placeholder for ReactNode type if needed, or just rely on framework specific types later. But config is framework agnostic.
// Since LayoutProps uses ReactNode (from design doc: children?: import('@openlayout/config').ReactNode;), we need to define it.
// In a real scenario, this might come from React types or Vue VNode types.
// Given this is a shared config, 'any' or a generic type is safer to avoid framework dependencies here.
