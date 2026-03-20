import type { LayoutProps, LayoutConfig } from './layout';
import {
  DEFAULT_BREAKPOINTS,
  DEFAULT_MOBILE_BREAKPOINT,
  DEFAULT_ANIMATION,
  DEFAULT_HEADER,
  DEFAULT_FOOTER,
  DEFAULT_SIDEBAR,
  DEFAULT_CONTENT,
} from './constants';

export interface MergeOptions {
  deep?: boolean;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target } as T;
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];
    if (isObject(sourceValue) && isObject(targetValue)) {
      (result as Record<string, unknown>)[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      );
    } else if (sourceValue !== undefined) {
      (result as Record<string, unknown>)[key] = sourceValue;
    }
  }
  return result;
}

export function merge<VNode, CSSProperties>(props: LayoutProps<VNode, CSSProperties>, options?: MergeOptions): LayoutConfig {
  const { deep = false } = options ?? {};

  if (deep) {
    const headerSource = props.header ? props.header as Record<string, unknown> : {};
    const footerSource = props.footer ? props.footer as Record<string, unknown> : {};
    const sidebarSource = props.sidebar ? props.sidebar as Record<string, unknown> : {};
    const contentSource = props.content ? props.content as Record<string, unknown> : {};
    const animationSource = props.animation ? props.animation as Record<string, unknown> : {};
    const breakpointsSource = props.breakpoints ? props.breakpoints as Record<string, unknown> : {};

    const mergedHeader = deepMerge(DEFAULT_HEADER as Record<string, unknown>, headerSource);
    const mergedFooter = deepMerge(DEFAULT_FOOTER as Record<string, unknown>, footerSource);
    const mergedSidebar = deepMerge(DEFAULT_SIDEBAR as Record<string, unknown>, sidebarSource);
    const mergedContent = deepMerge(DEFAULT_CONTENT as Record<string, unknown>, contentSource);
    const mergedAnimation = deepMerge(DEFAULT_ANIMATION as Record<string, unknown>, animationSource);
    const mergedBreakpoints = deepMerge(DEFAULT_BREAKPOINTS as Record<string, unknown>, breakpointsSource);

    return {
      header: mergedHeader as LayoutConfig['header'],
      footer: mergedFooter as LayoutConfig['footer'],
      sidebar: mergedSidebar as LayoutConfig['sidebar'],
      content: mergedContent as LayoutConfig['content'],
      animation: mergedAnimation as LayoutConfig['animation'],
      breakpoints: mergedBreakpoints as LayoutConfig['breakpoints'],
      mobileBreakpoint: props.mobileBreakpoint ?? DEFAULT_MOBILE_BREAKPOINT,
    };
  }

  return {
    header: { ...DEFAULT_HEADER, ...props.header },
    footer: { ...DEFAULT_FOOTER, ...props.footer },
    sidebar: { ...DEFAULT_SIDEBAR, ...props.sidebar },
    content: { ...DEFAULT_CONTENT, ...props.content },
    animation: { ...DEFAULT_ANIMATION, ...props.animation },
    breakpoints: { ...DEFAULT_BREAKPOINTS, ...props.breakpoints },
    mobileBreakpoint: props.mobileBreakpoint ?? DEFAULT_MOBILE_BREAKPOINT,
  };
}
