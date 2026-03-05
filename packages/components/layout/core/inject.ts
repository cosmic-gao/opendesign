/**
 * OpenDesign Layout CSS 变量注入
 * 将布局配置注入到 CSS 变量中
 */

import type { LayoutSizes, LayoutSizeValue, LayoutSize } from '@openlayout/type';

function createSize(v?: LayoutSizeValue): LayoutSize {
  if (!v) return { min: 0, max: 0 };
  return typeof v === 'number' ? { min: v, max: v } : v;
}

/**
 * 注入 CSS 变量
 * @param sizes - 布局尺寸配置
 */
export function inject(sizes: LayoutSizes): void {
  const h = createSize(sizes.header);
  const f = createSize(sizes.footer);
  const s = createSize(sizes.sidebar);

  const css = `
    :root {
      --od-header-height: ${h.min}px;
      --od-footer-height: ${f.min}px;
      --od-sidebar-width: ${s.min}px;
    }
  `;

  if (typeof document !== 'undefined') {
    const id = 'od-layout-variables';
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      document.head.appendChild(style);
    }
    style.textContent = css;
  }
}
