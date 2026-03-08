import React, { useMemo, type ReactNode } from 'react';
import { useLayoutContext } from './useLayout';
import type { ContentProps } from '@openlayout/config';

type ExtendedContentProps = ContentProps & {
  as?: keyof JSX.IntrinsicElements;
  children?: ReactNode;
};

export function Content({
  as: Component = 'main',
  className,
  style,
  children,
  scrollable = true,
}: ExtendedContentProps) {
  const { store } = useLayoutContext();

  const classNames = useMemo(() => {
    const classes = ['layout-content'];

    if (scrollable && store.contentScrollable) {
      classes.push('layout-content-scrollable');
    }

    if (className) {
      classes.push(className);
    }

    return classes.join(' ');
  }, [scrollable, store.contentScrollable, className]);

  const computedStyle = useMemo(() => {
    const s: React.CSSProperties = {
      flex: 1,
      minWidth: 0,
    };

    if (scrollable && store.contentScrollable) {
      s.overflow = 'auto';
    }

    if (style) {
      Object.assign(s, style);
    }

    return s;
  }, [scrollable, store.contentScrollable, style]);

  return (
    <Component className={classNames} style={computedStyle}>
      {children}
    </Component>
  );
}
