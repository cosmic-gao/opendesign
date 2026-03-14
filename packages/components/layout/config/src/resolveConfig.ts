import type { LayoutConfig, LayoutProps } from './layout';

export function resolveConfig(props: LayoutProps): LayoutConfig {
  const {
    header,
    footer,
    sidebar,
    content,
    breakpoints,
    mobileBreakpoint,
    animation,
  } = props;

  return {
    header,
    footer,
    sidebar,
    content,
    breakpoints,
    mobileBreakpoint,
    animation,
  };
}
