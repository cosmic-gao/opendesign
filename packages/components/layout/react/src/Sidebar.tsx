import React, { useMemo, type ReactNode, type CSSProperties } from 'react';
import { useLayout } from './Layout';
import type { SidebarProps } from '@openlayout/config';

export const Sidebar: React.FC<SidebarProps & { children?: ReactNode }> = (props) => {
  const { styles, state } = useLayout();

  const isCollapsed = props.collapsed ?? state.sidebar.collapsed;
  const cssVars = styles.cssVariables ?? {};
  
  const currentWidth = useMemo(() => 
    isCollapsed 
      ? (props.collapsedWidth ?? cssVars['--od-sidebar-collapsed-width']) 
      : (props.width ?? cssVars['--od-sidebar-width']),
    [isCollapsed, props.collapsedWidth, props.width, cssVars]
  );

  const mergedStyle = useMemo<CSSProperties>(() => ({
    ...styles.sidebar,
    width: `${currentWidth}px`,
    ...props.style,
  }), [styles.sidebar, currentWidth, props.style]);

  const classNames = useMemo(() => [
    'od-layout-sidebar',
    props.className,
    isCollapsed && 'od-layout-sidebar--collapsed',
    props.fullHeight && 'od-layout-sidebar--full-height',
    props.overlay && 'od-layout-sidebar--overlay',
  ].filter(Boolean).join(' '), [props.className, isCollapsed, props.fullHeight, props.overlay]);

  return (
    <aside className={classNames} style={mergedStyle}>
      {props.children}
    </aside>
  );
};
