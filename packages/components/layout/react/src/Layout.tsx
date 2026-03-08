import { useMemo, type ReactNode } from 'react';
import { LayoutProvider, useLayoutContext } from './useLayout';
import type { LayoutConfig, LayoutProps } from '@openlayout/config';

interface ExtendedLayoutProps extends LayoutProps {
  as?: keyof JSX.IntrinsicElements;
  children?: ReactNode;
}

function LayoutInner({ children, className, style, as: Component = 'div' }: ExtendedLayoutProps) {
  const { store, isMobile } = useLayoutContext();

  const classNames = useMemo(() => {
    const classes = ['layout'];

    if (store.direction) {
      classes.push(`layout-${store.direction}`);
    }

    if (isMobile) {
      classes.push('layout-mobile');
    }

    if (store.sidebarCollapsed) {
      classes.push('layout-sidebar-collapsed');
    }

    if (className) {
      classes.push(className);
    }

    return classes.join(' ');
  }, [store.direction, store.sidebarCollapsed, isMobile, className]);

  return (
    <Component className={classNames} style={style}>
      {children}
    </Component>
  );
}

export function Layout({ children, ...config }: ExtendedLayoutProps) {
  return (
    <LayoutProvider config={config as LayoutConfig}>
      <LayoutInner className={config.className} style={config.style}>
        {children}
      </LayoutInner>
    </LayoutProvider>
  );
}
