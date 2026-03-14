import type { LayoutConfig, CSSProperties } from '@openlayout/config';

export interface LayoutStyles {
  root: Partial<CSSProperties>;
  header: Partial<CSSProperties>;
  footer: Partial<CSSProperties>;
  sidebar: Partial<CSSProperties>;
  content: Partial<CSSProperties>;
  cssVariables: Partial<CSSProperties>;
}

export interface StyleOptions {
  config: LayoutConfig;
  breakpoint: string;
  isMobile: boolean;
  collapsed?: boolean;
}

export function createStylesheet(options: StyleOptions): LayoutStyles {
  const { config, isMobile, collapsed = false } = options;

  const headerConfig = config.header ?? {};
  const footerConfig = config.footer ?? {};
  const sidebarConfig = config.sidebar ?? {};
  const contentConfig = config.content ?? {};

  const Z_INDEX = {
    HEADER_FIXED: 1000,
    FOOTER_FIXED: 1000,
    SIDEBAR_OVERLAY: 1001,
  };

  const animationEnabled = config.animation?.enabled !== false;
  const animationDuration = config.animation?.duration ?? 200;

  const cssVariables: Partial<CSSProperties> = {
    '--od-header-height': `${headerConfig.height ?? 64}px`,
    '--od-footer-height': `${footerConfig.height ?? 48}px`,
    '--od-sidebar-width': collapsed
      ? `${sidebarConfig.min ?? 80}px`
      : `${sidebarConfig.width ?? 200}px`,
    '--od-sidebar-min-width': `${sidebarConfig.min ?? 80}px`,
    '--od-animation-enabled': animationEnabled ? 1 : 0,
    '--od-animation-duration': `${animationDuration}ms`,
    '--od-animation-easing': config.animation?.easing ?? 'ease',
    '--od-breakpoint': options.breakpoint,
    '--od-is-mobile': isMobile ? 1 : 0,
  };

  const root: Partial<CSSProperties> = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    ...cssVariables,
  };

  const header: Partial<CSSProperties> = {
    flexShrink: 0,
    height: `${headerConfig.height ?? 64}px`,
    ...(headerConfig.fixed ? { position: 'fixed', top: 0, left: 0, right: 0, zIndex: Z_INDEX.HEADER_FIXED } : {}),
    ...(headerConfig.full ? { width: '100%' } : {}),
  };

  const footer: Partial<CSSProperties> = {
    flexShrink: 0,
    height: `${footerConfig.height ?? 48}px`,
    ...(footerConfig.fixed ? { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: Z_INDEX.FOOTER_FIXED } : {}),
    ...(footerConfig.full ? { width: '100%' } : {}),
  };

  const sidebarWidth = collapsed
    ? (sidebarConfig.min ?? 80)
    : (sidebarConfig.width ?? 200);

  const sidebar: Partial<CSSProperties> = {
    flexShrink: 0,
    width: `${sidebarWidth}px`,
    transition: `width var(--od-animation-duration, 200ms) ease`,
    ...(sidebarConfig.full !== false ? { height: '100%' } : {}),
    ...(sidebarConfig.overlay || isMobile ? { position: 'fixed', zIndex: Z_INDEX.SIDEBAR_OVERLAY } : {}),
  };

  const content: Partial<CSSProperties> = {
    flex: 1,
    minWidth: 0,
    ...(contentConfig.scrollable !== false ? { overflow: 'auto' } : {}),
  };

  return { root, header, footer, sidebar, content, cssVariables };
}
