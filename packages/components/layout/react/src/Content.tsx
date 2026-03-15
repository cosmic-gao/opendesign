import React, { useMemo, type ReactNode, type CSSProperties } from 'react';
import { useLayout } from './Layout';
import type { ContentConfig } from '@openlayout/config';

export type ContentProps = ContentConfig & { children?: ReactNode; className?: string; style?: CSSProperties };

export const Content: React.FC<ContentProps> = (props) => {
  const { styles, state } = useLayout();

  if (state.content.visible === false) return null;

  const mergedStyle = useMemo<CSSProperties>(() => ({
    ...styles.content,
    ...(props.scrollable === false ? { overflow: 'hidden' as const } : 
        props.scrollable === true ? { overflow: 'auto' as const } : {}),
    ...props.style,
  }), [styles.content, props.scrollable, props.style]);

  const classNames = useMemo(() => [
    'od-layout-content',
    props.className,
  ].filter(Boolean).join(' '), [props.className]);

  return (
    <main className={classNames} style={mergedStyle}>
      {props.children}
    </main>
  );
};
