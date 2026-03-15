import React, { useMemo, type ReactNode, type CSSProperties } from 'react';
import { useLayout } from './Layout';
import type { FooterConfig } from '@openlayout/config';

export type FooterProps = FooterConfig & { children?: ReactNode; className?: string; style?: CSSProperties };

export const Footer: React.FC<FooterProps> = (props) => {
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
    props.full && 'od-layout-footer--full',
  ].filter(Boolean).join(' '), [props.className, props.fixed, props.full]);

  return (
    <footer className={classNames} style={mergedStyle}>
      {props.children}
    </footer>
  );
};
