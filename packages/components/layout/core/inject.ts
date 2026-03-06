/**
 * OpenDesign Layout CSS 变量注入
 * 将布局配置注入到 CSS 变量中
 */

import { createSize } from './utils';
import type { LayoutSizes, LayoutSizeValue } from '@openlayout/type';

/**
 * 解析 Document 对象
 */
function root(doc?: Document): Document | null {
  if (doc) return doc;
  if (typeof document !== 'undefined') return document;
  return null;
}

/**
 * 确保 stylesheet 元素存在，不存在则创建
 */
function style(id: string, doc: Document): HTMLStyleElement {
  let el = doc.getElementById(id) as HTMLStyleElement;
  if (!el) {
    el = doc.createElement('style');
    el.id = id;
    doc.head.appendChild(el);
  }
  return el;
}

/**
 * 注入 CSS 变量
 * @param sizes - 布局尺寸配置
 * @param doc - Document 对象（可选，用于 SSR 或 iframe 环境）
 * @returns 无返回值，直接操作 DOM
 */
export function inject(sizes: LayoutSizes, doc?: Document): void {
  const d = root(doc);
  if (!d) return;

  const h = createSize(sizes.header as LayoutSizeValue);
  const f = createSize(sizes.footer as LayoutSizeValue);
  const s = createSize(sizes.sidebar as LayoutSizeValue);

  const css = `
    :root {
      --od-header-height: ${h.auto ? 'auto' : (h.min ?? 0) + 'px'};
      --od-footer-height: ${f.auto ? 'auto' : (f.min ?? 0) + 'px'};
      --od-sidebar-width: ${s.auto ? 'auto' : (s.min ?? 0) + 'px'};
    }
  `;

  const el = style('od-layout-variables', d);
  el.textContent = css;
}
