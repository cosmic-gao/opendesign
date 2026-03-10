import React, { useMemo, type ReactNode, type CSSProperties } from 'react';
import { useLayout } from './Layout';
import type { HeaderProps } from '@openlayout/config';

export const Header: React.FC<HeaderProps & { children?: ReactNode }> = (props) => {
  const { styles, state } = useLayout();

  if (state.header.visible === false) return null;

  const mergedStyle = useMemo<CSSProperties>(() => ({
    ...styles.header,
    ...(props.height !== undefined ? { height: `${props.height}px` } : {}),
    ...(props.fixed !== undefined ? { position: props.fixed ? 'fixed' as const : 'relative' as const } : {}),
    ...props.style,
  }), [styles.header, props.height, props.fixed, props.style]);

  const classNames = useMemo(() => [
    'od-layout-header',
    props.className,
    props.fixed && 'od-layout-header--fixed',
    props.fullWidth && 'od-layout-header--full-width',
  ].filter(Boolean).join(' '), [props.className, props.fixed, props.fullWidth]);

  return (
    <header className={classNames} style={mergedStyle}>
      {props.children}
    </header>
  );
};
