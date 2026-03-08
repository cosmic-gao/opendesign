import React, { useMemo, type ReactNode } from 'react';
import { useLayoutContext } from './useLayout';
import { LAYOUT_DEFAULTS, type HeaderProps } from '@openlayout/config';

type ExtendedHeaderProps = HeaderProps & { 
  as?: keyof JSX.IntrinsicElements;
  children?: ReactNode;
};

export function Header({ 
  as: Component = 'header', 
  className, 
  style, 
  children, 
  height,
  fixed, 
  fullWidth 
}: ExtendedHeaderProps) {
  const { store } = useLayoutContext();

  const classNames = useMemo(() => {
    const classes = ['layout-header'];

    if (fixed ?? store.headerFixed) {
      classes.push('layout-header-fixed');
    }

    if (fullWidth) {
      classes.push('layout-header-full-width');
    }

    if (className) {
      classes.push(className);
    }

    return classes.join(' ');
  }, [store.headerFixed, fullWidth, className]);

  const computedStyle = useMemo(() => {
    const s: React.CSSProperties = { 
      flexShrink: 0,
      minHeight: height ?? store.headerHeight ?? LAYOUT_DEFAULTS.HEADER_HEIGHT,
    };

    if (height) {
      s.height = height;
    }

    if (fixed ?? store.headerFixed) {
      s.position = 'fixed';
      s.top = 0;
      s.left = 0;
      s.right = 0;
      s.zIndex = 100;
    }

    if (style) {
      Object.assign(s, style);
    }

    return s;
  }, [height, store.headerHeight, fixed, store.headerFixed, style]);

  return (
    <Component className={classNames} style={computedStyle}>
      {children}
    </Component>
  );
}
