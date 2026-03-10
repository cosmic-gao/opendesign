# OpenDesign Layout 演示方案设计文档

**版本**: 1.0.0
**状态**: 规划中

---

## 1. 背景与目标

### 1.1 背景

`@openlayout` 是一个跨框架（Vue 3 / React）的通用布局组件库，采用微内核架构设计：
- **core 层**：处理断点计算、样式生成、状态管理
- **config 层**：类型定义和配置
- **vue/react 层**：框架适配渲染组件

当前代码已完成基础实现，但缺乏直观的演示效果。作为通用组件库，需要一套完整的演示方案来展示组件能力、降低使用门槛、并验证框架适配的完整性。

### 1.2 目标

| 目标 | 描述 | 优先级 |
|------|------|--------|
| **G1** | 展示所有组件的核心功能（Header/Footer/Sidebar/Content） | P0 |
| **G2** | 演示响应式布局能力（断点切换、移动端适配） | P0 |
| **G3** | 展示受控/非受控模式的使用方式 | P0 |
| **G4** | 对比 Vue 与 React 两套实现的渲染一致性 | P1 |
| **G5** | 提供可交互的 Playground，支持实时调整配置 | P1 |
| **G6** | 验证组件的可访问性（a11y） | P2 |

### 1.3 成功指标

- 演示页面包含至少 5 个交互式用例
- 支持断点模拟切换（xs/sm/md/lg/xl/xxl）
- Vue/React 双版本渲染效果一致
- 首屏加载时间 < 1s（不含网络延迟）

---

## 2. 技术方案

### 2.1 演示架构

采用 **Monorepo + 双框架并行演示** 架构：

```
packages/
├── components/
│   └── layout/
│       ├── config/      # 类型定义
│       ├── core/        # 逻辑层
│       ├── vue/         # Vue 组件
│       ├── react/       # React 组件
│       └── demo/        # 演示应用
│           ├── vue/     # Vue 演示入口
│           └── react/   # React 演示入口
```

### 2.2 技术选型

| 层级 | 技术选型 | 理由 |
|------|----------|------|
| 构建工具 | Vite 5 | 快速冷启动、支持多入口 |
| Vue 演示 | Vue 3 + TSX | 展示 Vue 3 组合式 API 用法 |
| React 演示 | React 19 + TSX | 展示最新 React 特性 |
| UI 框架 | 自研组件（演示自身） | 避免第三方依赖干扰 |
| 路由 | Vue Router / React Router | 演示多页面场景 |
| 断点模拟 | 手动注入 viewport meta | 精确控制演示视口 |

### 2.3 演示页面结构

#### 2.3.1 首页（Overview）

展示组件库的概览信息：
- 版本信息
- 核心特性列表
- 框架支持徽章
- 快速开始代码片段

#### 2.3.2 组件演示页（Components）

按组件分类的独立演示页面：

| 页面 | 演示内容 |
|------|----------|
| `/components/layout` | 基础布局、自动计算高度 |
| `/components/header` | 固定定位、fullWidth、动态高度 |
| `/components/footer` | 固定定位、fullWidth、动态高度 |
| `/components/sidebar` | 折叠/展开、overlay 模式、宽度控制 |
| `/components/content` | scrollable 控制、溢出处理 |

每个页面包含：
1. **实时预览区**：可交互的组件实例
2. **代码展示区**：当前配置的源码
3. **配置面板**：实时调整 Props
4. **参数说明**：Props 表格

#### 2.3.3 响应式演示页（Responsive）

- 视口模拟器（iframe + device frame）
- 断点切换按钮（xs/sm/md/lg/xl/xxl）
- 实时显示当前 breakpoint、width、isMobile

#### 2.3.4 对比演示页（Framework Comparison）

- Vue/React 并排展示
- 同一配置的渲染结果对比
- 代码差异高亮

### 2.4 关键实现细节

#### 2.4.1 视口模拟

使用 `iframe` + `postMessage` 实现安全的视口隔离：

```typescript
// 演示应用监听来自 iframe 的消息
window.addEventListener('message', (event) => {
  if (event.data.type === 'viewport-change') {
    setCurrentViewport(event.data);
  }
});

// iframe 内部注入 viewport meta 并通知父窗口
const viewport = `width=${width}, initial-scale=1`;
document.querySelector('meta[name="viewport"]').content = viewport;
parent.postMessage({ type: 'viewport-change', width, breakpoint }, '*');
```

#### 2.4.2 配置面板状态管理

```typescript
// 使用演示应用自身的 layout 状态管理
const [config, setConfig] = useState({
  header: { fixed: false, height: 64 },
  sidebar: { collapsible: true, collapsed: false },
  // ...
});

// 透传给演示组件
<Layout {...config}>
  <Header>...</Header>
</Layout>
```

#### 2.4.3 代码生成

根据当前配置动态生成示例代码：

```typescript
function generateCode(config: DemoConfig, framework: 'vue' | 'react'): string {
  if (framework === 'vue') {
    return `<Layout v-bind="${toVBind(config)}">
  <Header>Header</Header>
  <Sidebar>Sidebar</Sidebar>
  <Content>Content</Content>
  <Footer>Footer</Footer>
</Layout>`;
  }
  return `<Layout {...${JSON.stringify(config)}}>
  <Header>Header</Header>
  <Sidebar>Sidebar</Sidebar>
  <Content>Content</Content>
  <Footer>Footer</Footer>
</Layout>`;
}
```

---

## 3. 接口与数据结构设计

### 3.1 演示配置类型

```typescript
interface DemoConfig {
  // Layout 全局配置
  layout: {
    animated: boolean;
    animationDuration: number;
    mobileBreakpoint: number;
    breakpoints: Breakpoints;
  };
  // 组件配置
  header: HeaderProps;
  footer: FooterProps;
  sidebar: SidebarProps;
  content: ContentProps;
  // 演示特定配置
  viewport: {
    width: number;
    height: number;
    breakpoint: Breakpoint;
  };
  framework: 'vue' | 'react';
}
```

### 3.2 演示组件 Props

```typescript
interface DemoViewerProps {
  config: DemoConfig;
  framework: 'vue' | 'react';
  onConfigChange: (config: DemoConfig) => void;
}

interface ConfigPanelProps {
  config: DemoConfig;
  onChange: (config: DemoConfig) => void;
}
```

### 3.3 演示路由结构

```typescript
const routes = [
  { path: '/', name: 'Home', component: HomePage },
  { path: '/components/layout', name: 'LayoutDemo', component: LayoutDemo },
  { path: '/components/header', name: 'HeaderDemo', component: HeaderDemo },
  { path: '/components/footer', name: 'FooterDemo', component: FooterDemo },
  { path: '/components/sidebar', name: 'SidebarDemo', component: SidebarDemo },
  { path: '/components/content', name: 'ContentDemo', component: ContentDemo },
  { path: '/responsive', name: 'ResponsiveDemo', component: ResponsiveDemo },
  { path: '/comparison', name: 'ComparisonDemo', component: ComparisonDemo },
];
```

---

## 4. 潜在风险与应对措施

### 4.1 风险清单

| ID | 风险描述 | 影响 | 概率 | 严重性 |
|----|----------|------|------|--------|
| R1 | Vue/React 渲染不一致 | 功能正确性 | 中 | 高 |
| R2 | iframe 视口模拟在移动端失效 | 演示可用性 | 高 | 中 |
| R3 | 演示依赖与生产代码版本同步困难 | 维护成本 | 中 | 中 |
| R4 | 复杂配置导致演示页面加载缓慢 | 用户体验 | 低 | 低 |
| R5 | 跨域 iframe 通信受限 | 功能完整性 | 低 | 中 |

### 4.2 应对措施

#### R1 - Vue/React 渲染不一致

- **预防**：使用统一的 `@openlayout/core` 逻辑层，确保样式计算一致
- **检测**：编写自动化截图对比测试
- **修复**：在 Design Doc 中明确约定 CSS 变量命名规范

#### R2 - iframe 视口模拟在移动端失效

- **方案 A**：使用 CSS `@container` 查询替代 viewport 模拟
- **方案 B**：提供物理设备扫码预览
- **降级**：移动端直接显示 "请在桌面设备查看" 提示

#### R3 - 演示依赖与生产代码版本同步

- **方案**：使用 pnpm workspace，确保 `@openlayout/*` 指向本地源码
- **脚本**：添加 `dev:demo` 命令，一键启动演示

#### R4 - 演示页面加载缓慢

- **优化**：演示页面按需加载（lazy load）
- **监控**：使用 Vite bundle analyzer 分析产物大小

#### R5 - 跨域 iframe 通信受限

- **方案**：演示应用与组件库同源部署，使用 `postMessage` 通信
- **备选**：使用 Server-Sent Events 或 WebSocket

---

## 5. 备选方案与权衡

### 5.1 视口模拟方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **iframe + postMessage** | 隔离性好、无副作用 | 移动端受限、通信开销 | 桌面端演示 |
| **CSS @container** | 原生支持、无需 iframe | 兼容性要求高（2024+） | 现代浏览器 |
| **Puppeteer 截图** | 精确控制 | 无法交互、只能静态 | CI 自动化测试 |
| **物理设备扫码** | 最真实 | 需额外设备、维护成本高 | 移动端真机演示 |

**推荐**：采用 **方案 A（iframe）为主 + 方案 B（扫码）为辅** 的混合策略。

### 5.2 演示框架选择

| 方案 | 优点 | 缺点 |
|------|------|------|
| **独立演示 App** | 灵活、可展示完整功能 | 维护成本高 |
| **Storybook** | 社区成熟、集成方便 | 样式隔离困难、配置复杂 |
| **Docz** | 轻量、快速 | 维护停滞 |
| **dumi** | Ant Design 官方、专为中国开发者 | 绑定 React、定制门槛高 |

**推荐**：采用 **独立演示 App** 方案，便于展示框架对比能力，且能精确控制演示逻辑。

### 5.3 状态管理权衡

演示应用的状态管理需要平衡 **简洁性** 与 **可维护性**：

| 方案 | 优点 | 缺点 |
|------|------|------|
| **localStorage** | 无需状态管理库 | 无法跨标签页同步 |
| **URL Query** | 状态可分享、书签支持 | URL 长度限制 |
| **Zustand** | 轻量、TypeScript 友好 | 引入额外依赖 |
| **Vuex/Pinia** | 与 Vue 演示天然契合 | React 演示不适用 |

**推荐**：使用 **URL Query + 演示应用自身 layout** 组合，演示配置通过 URL 参数持久化。

---

## 6. 实施计划

### 6.1 里程碑

| 阶段 | 任务 | 预估工期 |
|------|------|----------|
| M1 | 搭建演示项目基础结构（Vite + Vue/React 双入口） | 2d |
| M2 | 实现演示布局（Sidebar + Header + Content） | 1d |
| M3 | 实现配置面板与代码生成 | 2d |
| M4 | 实现响应式视口模拟器 | 2d |
| M5 | 实现 Vue/React 对比页面 | 1d |
| M5 | 补充各组件演示页面内容 | 2d |
| M6 | 视觉优化与动画打磨 | 1d |
| **总计** | | **11d** |

### 6.2 优先级排序

1. **P0**：M1 → M2 → M3（核心演示流程）
2. **P1**：M4 → M5（响应式 + 对比）
3. **P2**：M6（打磨）

---

## 7. 附录

### 7.1 相关文档

- [Layout 组件设计方案](./design_20250308_layout.md)
- [@openlayout/config 类型定义](../config/src/types.ts)
- [@openlayout/core API 参考](../core/README.md)

### 7.2 参考项目

- [Ant Design Components](https://ant.design/components/layout)
- [Element Plus Layout](https://element-plus.org/en-US/component/layout.html)
- [Storybook](https://storybook.js.org/)
- [Radix UI Primitives](https://www.radix-ui.com/)

---

*本文档由 AI 生成，最后更新于 2026-03-10*
