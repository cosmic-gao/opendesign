/**
 * OpenDesign Layout Design Tokens
 * 定义 DesignTokens 类型和默认值
 */

import type { DesignTokens } from '@openlayout/type';

/**
 * Light 主题的 DesignTokens
 */
export const lightTokens: DesignTokens = {
  colors: {
    primary: '#1890ff',
    background: '#ffffff',
    surface: '#fafafa',
    text: '#333333',
    border: '#e8e8e8',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
    fontSize: 14,
    lineHeight: 1.5,
  },
};

/**
 * Dark 主题的 DesignTokens
 */
export const darkTokens: DesignTokens = {
  colors: {
    primary: '#1890ff',
    background: '#141414',
    surface: '#1f1f1f',
    text: '#ffffff',
    border: '#303030',
  },
  spacing: lightTokens.spacing,
  typography: lightTokens.typography,
};
