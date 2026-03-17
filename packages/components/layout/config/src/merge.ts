import type { LayoutProps, MergedLayoutConfig } from './layout';
import {
  DEFAULT_BREAKPOINTS,
  DEFAULT_MOBILE_BREAKPOINT,
  DEFAULT_ANIMATION,
  DEFAULT_HEADER,
  DEFAULT_FOOTER,
  DEFAULT_SIDEBAR,
  DEFAULT_CONTENT,
} from './constants';

export function merge(props: LayoutProps): MergedLayoutConfig {
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
