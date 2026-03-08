import { LAYOUT_DEFAULTS } from './constants';
import type { HeaderStore } from './types';

export interface HeaderOptions {
  height?: number;
  fixed?: boolean;
}

export function createHeader(options: HeaderOptions = {}): HeaderStore {
  const height = options.height ?? LAYOUT_DEFAULTS.HEADER_HEIGHT;
  const defaultFixed = options.fixed ?? LAYOUT_DEFAULTS.DEFAULT_FIXED_HEADER;

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
