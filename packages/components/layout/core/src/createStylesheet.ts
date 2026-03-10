import type { LayoutConfig } from '@openlayout/config';

export interface LayoutStyles {
  root: Record<string, string | number>;
  header: Record<string, string | number>;
  footer: Record<string, string | number>;
  sidebar: Record<string, string | number>;
  content: Record<string, string | number>;
  cssVariables: Record<string, string | number>;
}

export interface StyleOptions {
  config: LayoutConfig;
  breakpoint: string;
  isMobile: boolean;
  collapsed?: boolean;
}

/**
 * 生成布局样式
 * 
 * @description
 * 根据配置和当前状态生成内联样式对象和 CSS 变量。
 * 包含 Z-Index 层级管理逻辑。
 * 
 * @param {StyleOptions} options - 样式生成选项
 * @returns {LayoutStyles} 包含各部分样式的对象
 */
export function createStylesheet(options: StyleOptions): LayoutStyles {
  const { config, isMobile, collapsed = false } = options;

  const headerConfig = config.header ?? {};
  const footerConfig = config.footer ?? {};
  const sidebarConfig = config.sidebar ?? {};
  const contentConfig = config.content ?? {};

  // Z-Index 层级管理
  // Sidebar (Overlay) 必须高于 Header (Fixed)
  const Z_INDEX = {
    HEADER_FIXED: 1000,
    FOOTER_FIXED: 1000,
    SIDEBAR_OVERLAY: 1001,
  };

  // CSS 变量 - 存储动态值，便于主题切换和响应式调整
  const cssVariables: Record<string, string | number> = {
    '--od-header-height': headerConfig.height ?? 64,
    '--od-footer-height': footerConfig.height ?? 48,
    '--od-sidebar-width': collapsed
      ? sidebarConfig.collapsedWidth ?? 80
      : sidebarConfig.width ?? 200,
    '--od-sidebar-collapsed-width': sidebarConfig.collapsedWidth ?? 80,
    '--od-animated': config.animated !== false ? 1 : 0,
    '--od-animation-duration': config.animationDuration ?? 200,
    '--od-breakpoint': options.breakpoint,
    '--od-is-mobile': isMobile ? 1 : 0,
  };

  const root: Record<string, string | number> = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    ...cssVariables,
  };

  const header: Record<string, string | number> = {
    flexShrink: 0,
    height: `${headerConfig.height ?? 64}px`,
    ...(headerConfig.fixed ? { position: 'fixed', top: 0, left: 0, right: 0, zIndex: Z_INDEX.HEADER_FIXED } : {}),
    ...(headerConfig.fullWidth ? { width: '100%' } : {}),
  };

  const footer: Record<string, string | number> = {
    flexShrink: 0,
    height: `${footerConfig.height ?? 48}px`,
    ...(footerConfig.fixed ? { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: Z_INDEX.FOOTER_FIXED } : {}),
    ...(footerConfig.fullWidth ? { width: '100%' } : {}),
  };

  const sidebarWidth = collapsed
    ? (sidebarConfig.collapsedWidth ?? 80)
    : (sidebarConfig.width ?? 200);

  const sidebar: Record<string, string | number> = {
    flexShrink: 0,
    width: `${sidebarWidth}px`,
    transition: `width ${config.animationDuration ?? 200}ms ease`,
    ...(sidebarConfig.fullHeight !== false ? { height: '100%' } : {}),
    ...(sidebarConfig.overlay || isMobile ? { position: 'fixed', zIndex: Z_INDEX.SIDEBAR_OVERLAY } : {}),
  };

  const content: Record<string, string | number> = {
    flex: 1,
    minWidth: 0,
    ...(contentConfig.scrollable !== false ? { overflow: 'auto' } : {}),
  };

  return { root, header, footer, sidebar, content, cssVariables };
}
