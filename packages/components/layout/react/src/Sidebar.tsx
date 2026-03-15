import React, { useMemo, type ReactNode, type CSSProperties } from 'react';
import { useLayout } from './Layout';
import type { SidebarConfig } from '@openlayout/config';

export type SidebarProps = SidebarConfig & { children?: ReactNode; className?: string; style?: CSSProperties };

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const { styles, state } = useLayout();

  const isCollapsed = props.collapsed ?? state.sidebar.collapsed;
  const cssVars = styles.cssVariables ?? {};
  
  const currentWidth = useMemo(() => 
    isCollapsed 
      ? (props.min ?? cssVars['--od-sidebar-min-width']) 
      : (props.width ?? cssVars['--od-sidebar-width']),
    [isCollapsed, props.min, props.width, cssVars]
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
    props.full && 'od-layout-sidebar--full',
    props.overlay && 'od-layout-sidebar--overlay',
  ].filter(Boolean).join(' '), [props.className, isCollapsed, props.full, props.overlay]);

  return (
    <aside className={classNames} style={mergedStyle}>
      {props.children}
    </aside>
  );
};
