/**
 * OpenDesign Layout 运行时样式工具
 * 基于 goober 处理 CSS 变量注入
 */

import { glob } from 'goober';
import type { DesignTokens } from '@openlayout/type';

/**
 * 将嵌套对象扁平化为 CSS 变量字符串
 * @param obj - 要扁平化的对象
 * @param prefix - 变量名前缀
 * @returns 扁平化后的 CSS 变量字符串
 */
function flattenTokens(obj: Record<string, unknown>, prefix = ''): string {
  return Object.entries(obj)
    .map(([key, value]) => {
      const name = prefix ? `${prefix}-${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return flattenTokens(value as Record<string, unknown>, name);
      }
      return `--od-${name}: ${value}`;
    })
    .join('; ');
}

/**
 * 注入 DesignTokens 到 CSS 变量
 * @param tokens - 要注入的设计令牌
 */
export function injectTokens(tokens: DesignTokens): void {
  const cssString = flattenTokens(tokens);
  glob`:root { ${cssString}; }`;
}

/**
 * 设置主题属性
 * @param theme - 主题名称
 */
export function setThemeAttribute(theme: 'light' | 'dark'): void {
  document.documentElement.setAttribute('data-theme', theme);
}

/**
 * 获取 CSS 变量的值
 * @param name - 变量名
 * @returns 变量值，如果不存在返回 null
 */
export function getCssVariable(name: string): string | null {
  return document.documentElement.style.getPropertyValue(name) || null;
}

/**
 * 移除 CSS 变量
 * @param name - 变量名
 */
export function removeCssVariable(name: string): void {
  document.documentElement.style.removeProperty(name);
}
