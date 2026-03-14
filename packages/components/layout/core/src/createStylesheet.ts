import type { LayoutConfig } from '@openlayout/config';

export interface LayoutStyles {
  root: Partial<CSSStyleDeclaration>;
  header: Partial<CSSStyleDeclaration>;
  footer: Partial<CSSStyleDeclaration>;
  sidebar: Partial<CSSStyleDeclaration>;
  content: Partial<CSSStyleDeclaration>;
  cssVariables: Partial<CSSStyleDeclaration>;
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

  const cssVariables: Partial<CSSStyleDeclaration> = {
    '--od-header-height': `${headerConfig.height ?? 64}px`,
    '--od-footer-height': `${footerConfig.height ?? 48}px`,
    '--od-sidebar-width': collapsed
      ? `${sidebarConfig.min ?? 80}px`
      : `${sidebarConfig.width ?? 200}px`,
    '--od-sidebar-min-width': `${sidebarConfig.min ?? 80}px`,
    '--od-animation-enabled': animationEnabled ? '1' : '0',
    '--od-animation-duration': `${animationDuration}ms`,
    '--od-animation-easing': config.animation?.easing ?? 'ease',
    '--od-breakpoint': options.breakpoint,
    '--od-is-mobile': isMobile ? '1' : '0',
  };

  const root: Partial<CSSStyleDeclaration> = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  };
  Object.assign(root, cssVariables);

  const header: Partial<CSSStyleDeclaration> = {
    flexShrink: '0',
    height: `${headerConfig.height ?? 64}px`,
  };
  if (headerConfig.fixed) {
    header.position = 'fixed';
    header.top = '0';
    header.left = '0';
    header.right = '0';
    header.zIndex = String(Z_INDEX.HEADER_FIXED);
  }
  if (headerConfig.full) {
    header.width = '100%';
  }

  const footer: Partial<CSSStyleDeclaration> = {
    flexShrink: '0',
    height: `${footerConfig.height ?? 48}px`,
  };
  if (footerConfig.fixed) {
    footer.position = 'fixed';
    footer.bottom = '0';
    footer.left = '0';
    footer.right = '0';
    footer.zIndex = String(Z_INDEX.FOOTER_FIXED);
  }
  if (footerConfig.full) {
    footer.width = '100%';
  }

  const sidebarWidth = collapsed
    ? (sidebarConfig.min ?? 80)
    : (sidebarConfig.width ?? 200);

  const sidebar: Partial<CSSStyleDeclaration> = {
    flexShrink: '0',
    width: `${sidebarWidth}px`,
    transition: `width var(--od-animation-duration, 200ms) ease`,
  };
  if (sidebarConfig.full !== false) {
    sidebar.height = '100%';
  }
  if (sidebarConfig.overlay || isMobile) {
    sidebar.position = 'fixed';
    sidebar.zIndex = String(Z_INDEX.SIDEBAR_OVERLAY);
  }

  const content: Partial<CSSStyleDeclaration> = {
    flex: '1',
    minWidth: '0',
  };
  if (contentConfig.scrollable !== false) {
    content.overflow = 'auto';
  }

  return { root, header, footer, sidebar, content, cssVariables };
}
