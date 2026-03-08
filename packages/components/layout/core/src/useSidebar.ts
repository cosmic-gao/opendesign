import { LAYOUT_DEFAULTS } from './constants';
import type { SidebarStore } from './types';

export interface SidebarOptions {
  width?: number;
  collapsedWidth?: number;
  defaultCollapsed?: boolean;
}

export function createSidebar(options: SidebarOptions = {}): SidebarStore {
  const width = options.width ?? LAYOUT_DEFAULTS.SIDEBAR_WIDTH;
  const collapsedWidth = options.collapsedWidth ?? LAYOUT_DEFAULTS.COLLAPSED_WIDTH;
  const defaultCollapsed = options.defaultCollapsed ?? LAYOUT_DEFAULTS.DEFAULT_COLLAPSED;

  let _collapsed = defaultCollapsed;
  let _visible = true;

  return {
    get collapsed() {
      return _collapsed;
    },
    get visible() {
      return _visible;
    },
    get width() {
      return _collapsed ? collapsedWidth : width;
    },
    get expandedWidth() {
      return width;
    },
    get collapsedWidth() {
      return collapsedWidth;
    },

    toggle: () => {
      _collapsed = !_collapsed;
    },
    collapse: () => {
      _collapsed = true;
    },
    expand: () => {
      _collapsed = false;
    },
    show: () => {
      _visible = true;
    },
    hide: () => {
      _visible = false;
    },
    setCollapsed: (value: boolean) => {
      _collapsed = value;
    },
  };
}
