/**
 * OpenDesign Layout 布局计算
 * Core 层仅输出尺寸信息，不泄漏 UI 实现细节
 */

import { createSize } from './utils';
import type { LayoutConfig, LayoutState, LayoutSizeValue, LayoutDimensions } from '@openlayout/type';

/**
 * 计算布局尺寸
 * @param config - 布局配置
 * @param state - 布局状态
 * @returns 计算后的布局尺寸
 */
export function createLayout(
  config: LayoutConfig,
  state: LayoutState
): LayoutDimensions {
  // 1. 获取基础配置尺寸
  const header = createSize(config.sizes.header as LayoutSizeValue);
  const footer = createSize(config.sizes.footer as LayoutSizeValue);
  const sidebar = createSize(config.sizes.sidebar as LayoutSizeValue);

  // 2. 确定基础数值
  const headerH = header.auto ? 0 : (header.min ?? 0);
  const footerH = footer.auto ? 0 : (footer.min ?? 0);
  let sidebarW = sidebar.auto ? 0 : (sidebar.min ?? 0);

  // 3. 处理折叠状态
  if (state.collapsed) {
    sidebarW = 0; // 或者根据配置设置为 collapsedWidth，目前简化为 0
  }

  // 4. 根据模式计算最终尺寸
  switch (config.mode) {
    case 'sidebar':
      // Sidebar 优先：Sidebar 占满左侧全高
      // Header/Content/Footer 在右侧
      return {
        headerHeight: headerH,
        headerWidth: '100%', // 相对内容区域宽度，或者减去 sidebarW？
                             // 通常 Header 在 Sidebar 右侧时，Header 宽度应为 `calc(100% - ${sidebarW}px)`
                             // 但这里返回纯数值或 '100%' 给 UI 层处理比较好
                             // 如果是绝对定位布局，Header left = sidebarW, width = `calc(100% - ${sidebarW}px)`
                             // 如果是 Flex 布局，Header width = '100%' (在右侧容器内)
                             // 为了通用性，这里假设是 Flex 布局或者 Grid 布局
                             // contentMarginLeft 已经指示了布局结构
        sidebarWidth: sidebarW,
        sidebarHeight: '100%',
        
        footerHeight: footerH,
        footerWidth: '100%',

        contentMarginTop: headerH,
        contentMarginLeft: sidebarW,
      };

    case 'mixed':
      // 顶部优先：Header 占满顶部全宽
      // Sidebar 在 Header 下方
      return {
        headerHeight: headerH,
        headerWidth: '100%',

        sidebarWidth: sidebarW,
        sidebarHeight: '100%', // 实际高度应减去 headerHeight，但在 CSS 中通常处理为 `calc(100vh - ${headerH}px)` 或 Flex 自动填充

        footerHeight: footerH,
        footerWidth: '100%',

        contentMarginTop: headerH,
        contentMarginLeft: sidebarW,
      };

    case 'top':
      // 顶部导航：无 Sidebar
      return {
        headerHeight: headerH,
        headerWidth: '100%',

        sidebarWidth: 0,
        sidebarHeight: 0,

        footerHeight: footerH,
        footerWidth: '100%',

        contentMarginTop: headerH,
        contentMarginLeft: 0,
      };

    case 'blank':
      // 空白模式
      return {
        headerHeight: 0,
        headerWidth: 0,

        sidebarWidth: 0,
        sidebarHeight: 0,

        footerHeight: 0,
        footerWidth: 0,

        contentMarginTop: 0,
        contentMarginLeft: 0,
      };

    default:
      // 默认回退到 sidebar 模式
      return {
        headerHeight: headerH,
        headerWidth: '100%',
        sidebarWidth: sidebarW,
        sidebarHeight: '100%',
        footerHeight: footerH,
        footerWidth: '100%',
        contentMarginTop: headerH,
        contentMarginLeft: sidebarW,
      };
  }
}
