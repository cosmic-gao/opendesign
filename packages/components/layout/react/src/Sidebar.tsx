import React, { useMemo, useState, useEffect, type ReactNode } from 'react';
import { useLayoutContext } from './useLayout';
import type { SidebarProps } from '@openlayout/config';

type ExtendedSidebarProps = SidebarProps & { 
  as?: keyof JSX.IntrinsicElements;
  children?: ReactNode;
};

export function Sidebar({
  as: Component = 'aside',
  className,
  style,
  children,
  collapsible,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  fullHeight = true,
  overlay,
  width,
  collapsedWidth,
  visible = true,
}: ExtendedSidebarProps) {
  const { store, isMobile } = useLayoutContext();

  const isControlled = collapsed !== undefined;
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    setInternalCollapsed(defaultCollapsed);
  }, [defaultCollapsed]);

  const isCollapsed = isControlled ? collapsed : internalCollapsed;

  useEffect(() => {
    onCollapsedChange?.(isCollapsed);
  }, [isCollapsed, onCollapsedChange]);

  const computedWidth = useMemo(() => {
    return isCollapsed
      ? (collapsedWidth ?? store.collapsedWidth)
      : (width ?? store.sidebarWidth);
  }, [isCollapsed, collapsedWidth, store.collapsedWidth, width, store.sidebarWidth]);

  const classNames = useMemo(() => {
    const classes = ['layout-sidebar'];

    if (fullHeight) {
      classes.push('layout-sidebar-full-height');
    }

    if (isCollapsed) {
      classes.push('layout-sidebar-collapsed');
    }

    if (collapsible) {
      classes.push('layout-sidebar-collapsible');
    }

    if (isMobile && overlay) {
      classes.push('layout-sidebar-overlay');
    }

    if (!visible) {
      classes.push('layout-sidebar-hidden');
    }

    if (className) {
      classes.push(className);
    }

    return classes.join(' ');
  }, [fullHeight, isCollapsed, collapsible, isMobile, overlay, visible, className]);

  const computedStyle = useMemo(() => {
    const s: React.CSSProperties = {
      flexShrink: 0,
      width: visible ? computedWidth : 0,
      transition: 'width 0.2s ease',
    };

    if (isMobile && overlay) {
      s.position = 'fixed';
      s.top = 0;
      s.left = 0;
      s.bottom = 0;
      s.zIndex = 99;
    }

    if (fullHeight && !isMobile) {
      s.height = '100%';
    }

    if (!visible) {
      s.overflow = 'hidden';
    }

    if (style) {
      Object.assign(s, style);
    }

    return s;
  }, [computedWidth, isMobile, overlay, fullHeight, visible, style]);

  const handleToggle = () => {
    if (collapsible) {
      if (isControlled) {
        onCollapsedChange?.(!collapsed);
      } else {
        setInternalCollapsed(!internalCollapsed);
        onCollapsedChange?.(!internalCollapsed);
      }
    }
  };

  return (
    <Component 
      className={classNames} 
      style={computedStyle}
      onClick={collapsible ? handleToggle : undefined}
    >
      {children}
    </Component>
  );
}
