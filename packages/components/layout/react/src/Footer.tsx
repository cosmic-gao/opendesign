import React, { useMemo, type ReactNode } from 'react';
import { useLayoutContext } from './useLayout';
import { LAYOUT_DEFAULTS, type FooterProps } from '@openlayout/config';

type ExtendedFooterProps = FooterProps & { 
  as?: keyof JSX.IntrinsicElements;
  children?: ReactNode;
};

export function Footer({ 
  as: Component = 'footer', 
  className, 
  style, 
  children, 
  height,
  fixed, 
  fullWidth 
}: ExtendedFooterProps) {
  const { store } = useLayoutContext();

  const classNames = useMemo(() => {
    const classes = ['layout-footer'];

    if (fixed ?? store.footerFixed) {
      classes.push('layout-footer-fixed');
    }

    if (fullWidth) {
      classes.push('layout-footer-full-width');
    }

    if (className) {
      classes.push(className);
    }

    return classes.join(' ');
  }, [store.footerFixed, fullWidth, className]);

  const computedStyle = useMemo(() => {
    const s: React.CSSProperties = { 
      flexShrink: 0,
      minHeight: height ?? store.footerHeight ?? LAYOUT_DEFAULTS.FOOTER_HEIGHT,
    };

    if (height) {
      s.height = height;
    }

    if (fixed ?? store.footerFixed) {
      s.position = 'fixed';
      s.bottom = 0;
      s.left = 0;
      s.right = 0;
      s.zIndex = 100;
    }

    if (style) {
      Object.assign(s, style);
    }

    return s;
  }, [height, store.footerHeight, fixed, store.footerFixed, style]);

  return (
    <Component className={classNames} style={computedStyle}>
      {children}
    </Component>
  );
}
