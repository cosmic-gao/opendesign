# OpenDesign Layout 组件设计 (React/Vue)

> 版本：1.1.0  
> 日期：2026-03-06  
> 状态：**设计重构**  
> 变更：定义四种标准布局模式 (Sidebar/Mixed/Top/Blank)

---

## 1. 布局模式定义 (Layout Modes)

根据最新的设计规范，Layout 组件支持以下四种标准布局模式：

### 1.1 Sidebar Mode (侧边优先)
- **特点**：Sidebar 占据左侧全高（通顶通底）。
- **结构**：左侧是 Sidebar，右侧垂直排列 Header -> Content -> Footer。
- **适用**：管理后台、SaaS 应用等侧边导航为主的场景。

### 1.2 Mixed Mode (顶部优先)
- **特点**：Header 占据顶部全宽（通左通右）。
- **结构**：顶部是 Header，下方左侧是 Sidebar，右侧是 Content -> Footer。
- **适用**：需要全局顶部导航 + 侧边二级导航的复杂应用。

### 1.3 Top Mode (顶部导航)
- **特点**：无 Sidebar，Header 占据顶部全宽。
- **结构**：顶部是 Header，下方是 Content -> Footer。
- **适用**：文档站、门户网站、简单的工具应用。

### 1.4 Blank Mode (空白模式)
- **特点**：无 Header、Sidebar、Footer。
- **结构**：仅 Content 区域。
- **适用**：登录页、全屏展示页、移动端独立页面。

---

## 2. 核心类型定义 (Core Types)

```typescript
export type LayoutMode = 'sidebar' | 'mixed' | 'top' | 'blank';

export interface LayoutDimensions {
  // 区域尺寸（计算后的像素值）
  headerHeight: number;
  headerWidth: number | '100%';
  sidebarWidth: number;
  sidebarHeight: number | '100%';
  footerHeight: number;
  footerWidth: number | '100%';
  
  // 内容区域偏移量
  contentMarginTop: number;
  contentMarginLeft: number;
}
```

## 3. 适配器接口变更

### CreateLayoutOptions
- `mode` 字段类型更新为 `LayoutMode`。
- `sizes` 字段移除 `topbar`。

### UseLayoutReturn
- `dimensions` 返回新的结构。
- `topbarHeight` 移除。
- 新增 `layoutMode` 当前生效的模式。

---

## 4. 迁移指南

- `mode: 'top'` -> `mode: 'top'` (无变化，但 Sidebar 强制为 0)
- `mode: 'mixed'` -> `mode: 'mixed'` (行为变化：Header 变为通栏)
- `mode: 'sidebar'` -> `mode: 'sidebar'` (行为变化：Sidebar 变为通栏)
