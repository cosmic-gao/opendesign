import React, { useMemo, type ReactNode, type CSSProperties } from 'react';
import { useLayout } from './Layout';
import type { FooterProps } from '@openlayout/config';

export const Footer: React.FC<FooterProps & { children?: ReactNode }> = (props) => {
  const { styles, state } = useLayout();

  if (state.footer.visible === false) return null;

  const mergedStyle = useMemo<CSSProperties>(() => ({
    ...styles.footer,
    ...(props.height !== undefined ? { height: `${props.height}px` } : {}),
    ...(props.fixed !== undefined ? { position: props.fixed ? 'fixed' as const : 'relative' as const } : {}),
    ...props.style,
  }), [styles.footer, props.height, props.fixed, props.style]);

  const classNames = useMemo(() => [
    'od-layout-footer',
    props.className,
    props.fixed && 'od-layout-footer--fixed',
    props.fullWidth && 'od-layout-footer--full-width',
  ].filter(Boolean).join(' '), [props.className, props.fixed, props.fullWidth]);

  return (
    <footer className={classNames} style={mergedStyle}>
      {props.children}
    </footer>
  );
};
