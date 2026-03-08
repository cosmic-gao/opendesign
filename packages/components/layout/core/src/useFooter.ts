import { LAYOUT_DEFAULTS } from './constants';
import type { FooterStore } from './types';

export interface FooterOptions {
  height?: number;
  fixed?: boolean;
}

export function createFooter(options: FooterOptions = {}): FooterStore {
  const height = options.height ?? LAYOUT_DEFAULTS.FOOTER_HEIGHT;
  const defaultFixed = options.fixed ?? LAYOUT_DEFAULTS.DEFAULT_FIXED_FOOTER;

  let _fixed = defaultFixed;
  let _visible = true;

  return {
    get visible() {
      return _visible;
    },
    get fixed() {
      return _fixed;
    },
    get height() {
      return height;
    },

    show: () => {
      _visible = true;
    },
    hide: () => {
      _visible = false;
    },
    setFixed: (value: boolean) => {
      _fixed = value;
    },
    setHeight: () => {},
  };
}
