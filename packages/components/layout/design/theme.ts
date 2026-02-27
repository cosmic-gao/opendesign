/**
 * OpenDesign Layout 主题管理器
 * 管理主题注册和切换
 */

import { injectTokens, setThemeAttribute } from './style';
import type { Theme as ThemeLiteral } from '@openlayout/type';
import type { DesignTokens } from '@openlayout/type';
import { lightTokens, darkTokens } from './tokens';

/**
 * 主题名称类型
 */
export type ThemeName = ThemeLiteral;

/**
 * 主题接口
 */
export interface Theme {
  name: ThemeName;
  tokens: DesignTokens;
}

/**
 * 主题管理器类
 * 用于注册和切换主题
 */
export class ThemeManager {
  private currentTheme: ThemeName = 'light';
  private themes: Map<ThemeName, Theme> = new Map();

  /**
   * 注册主题
   * @param theme - 要注册的主题
   */
  registerTheme(theme: Theme): void {
    this.themes.set(theme.name, theme);
  }

  /**
   * 注册默认主题（light 和 dark）
   */
  registerDefaultThemes(): void {
    this.registerTheme({ name: 'light', tokens: lightTokens });
    this.registerTheme({ name: 'dark', tokens: darkTokens });
  }

  /**
   * 应用指定主题
   * @param name - 主题名称
   */
  applyTheme(name: ThemeName): void {
    const theme = this.themes.get(name);
    if (!theme) {
      console.warn(`Theme "${name}" not found`);
      return;
    }

    setThemeAttribute(name);
    injectTokens(theme.tokens);
    this.currentTheme = name;
  }

  /**
   * 获取当前主题名称
   * @returns 当前主题名称
   */
  getCurrentTheme(): ThemeName {
    return this.currentTheme;
  }

  /**
   * 切换主题（light <-> dark）
   * @returns 切换后的主题名称
   */
  toggleTheme(): ThemeName {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
    return newTheme;
  }
}

/**
 * 默认主题管理器实例
 */
export const themeManager = new ThemeManager();
