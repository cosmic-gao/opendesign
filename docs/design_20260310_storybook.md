# OpenDesign 组件库 Storybook 统一管理方案

**版本**: 2.0.0
**状态**: 规划中
**日期**: 2026-03-10

---

## 修改记录 (Changelog)

| 版本 | 日期 | 修改内容 |
|------|------|----------|
| 2.0.0 | 2026-03-10 | 重构：采用 Storybook Composition 方案，Vue/React 分离实例 + 统一入口 |
| 1.1.0 | 2026-03-10 | 优化：采用单一 Storybook 实例方案，通过 Glob 自动发现 Stories；Stories 放在各组件 src 目录下 |
| 1.0.0 | 2026-03-10 | 初始版本：多实例 Storybook Composition 方案 |

---

## 1. 背景与目标

### 1.1 背景

当前 `@openlayout` 组件库采用 Monorepo 架构，每个组件包含多框架适配（Vue/React）。随着组件库规模扩展（Button、Form、Modal 等组件即将加入），需要统一的文档与演示平台。

**重要说明**：Storybook 官方不支持在同一实例中混用 Vue 和 React 框架，因此需要采用 Storybook Composition 方案。

现有问题：
- 每个组件缺乏直观的交互式演示
- Vue/React 双版本需要对比展示
- 组件文档分散，缺乏统一入口
- 新组件接入文档流程繁琐

### 1.2 目标

| 目标 | 描述 | 优先级 |
|------|------|--------|
| G1 | Vue/React 双框架 Storybook 独立运行 | P0 |
| G2 | 通过 Composition 实现统一入口 | P0 |
| G3 | 组件代码即文档，降低维护成本 | P0 |
| G4 | 支持主题定制和响应式预览 | P1 |
| G5 | 一键生成静态文档站点 | P1 |

### 1.3 成功指标

- Vue Storybook 和 React Storybook 独立运行
- 主入口 Composition 整合两个 Storybook
- 每个组件包含至少 3 个交互式 Stories
- Composition 切换延迟 < 500ms
- 静态站点构建时间 < 60s

---

## 2. 技术方案

### 2.1 方案选型：Storybook Composition

采用 **多 Storybook 实例 + Composition** 方案：
- 创建独立的 Vue Storybook 和 React Storybook 实例
- 通过 Composition 在主入口整合
- 每个实例使用对应框架的官方插件

```
┌─────────────────────────────────────────────────────────────────┐
│                    OpenDesign 组件库                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────────┐   ┌──────────────────┐                 │
│   │   Storybook     │   │   Storybook     │                 │
│   │   Vue 实例      │   │   React 实例    │                 │
│   │   (端口 6007)   │   │   (端口 6008)   │                 │
│   └────────┬─────────┘   └────────┬─────────┘                 │
│            │                       │                            │
│            └───────────┬───────────┘                            │
│                        ▼                                        │
│            ┌─────────────────────┐                              │
│            │  Storybook          │                              │
│            │  Composition        │                              │
│            │  (主入口 - 端口 6006)│                              │
│            └─────────────────────┘                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**方案优势**：
- 框架原生支持，无兼容问题
- 开发体验最佳（Vue 用 Vue 的，React 用 React 的）
- Composition 提供统一入口
- 不需要 Web Components 额外封装

---

### 2.2 项目结构

```
opendesign/
├── apps/
├── storybooks/
│   ├── vue/                      # Vue 组件 Storybook
│   │   ├── .storybook/
│   │   │   ├── main.ts
│   │   │   └── preview.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── react/                    # React 组件 Storybook
│   │   ├── .storybook/
│   │   │   ├── main.ts
│   │   │   └── preview.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── host/                    # 主入口（Composition）
│       ├── .storybook/
│       │   ├── main.ts          # 引用 Vue/React 实例
│       │   └── preview.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── components/
│       ├── layout/
│       │   ├── vue/
│       │   │   └── src/
│       │   │       ├── Layout.tsx
│       │   │       ├── Layout.stories.tsx   # Vue Stories
│       │   │       └── index.ts
│       │   ├── react/
│       │   │   └── src/
│       │   │       ├── Layout.tsx
│       │   │       ├── Layout.stories.tsx   # React Stories
│       │   │       └── index.ts
│       │   └── config/
│       │       └── ...
│       └── button/
│           ├── vue/src/...
│           └── react/src/...
│
├── pnpm-workspace.yaml
└── package.json
```

---

### 2.3 配置文件

#### 2.3.1 pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'storybooks/*'
  - 'packages/*'
```

#### 2.3.2 根 package.json

```json
{
  "name": "opendesign",
  "private": true,
  "scripts": {
    "dev": "pnpm -r --parallel run dev",
    "storybook": "pnpm -r --filter './storybooks/*' storybook",
    "storybook:vue": "pnpm --filter '@opendesign/storybooks-vue' storybook",
    "storybook:react": "pnpm --filter '@opendesign/storybooks-react' storybook",
    "storybook:host": "pnpm --filter '@opendesign/storybooks-host' storybook",
    "build-storybook": "pnpm --filter '@opendesign/storybooks-host' build-storybook"
  },
  "devDependencies": {}
}
```

#### 2.3.3 Vue Storybook 配置

```typescript
// storybooks/vue/.storybook/main.ts
import type { StorybookConfig } from "@storybook/vue3-vite";
import { mergeConfig } from "vite";
import path from "path";

const config: StorybookConfig = {
  stories: [
    "../packages/components/**/vue/**/*.stories.ts",
    "../packages/components/**/vue/**/*.stories.mdx",
  ],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/vue3-vite",
    options: {},
  },
  viteFinal: async (config) => {
    return mergeConfig(config, {
      resolve: {
        alias: {
          "@openlayout/vue": path.resolve(
            __dirname,
            "../packages/components/layout/vue/src"
          ),
          "@openlayout/button": path.resolve(
            __dirname,
            "../packages/components/button/vue/src"
          ),
        },
      },
    });
  },
};

export default config;
```

```typescript
// storybooks/vue/.storybook/preview.ts
import type { Preview } from "@storybook/vue3";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
  },
};

export default preview;
```

```json
// storybooks/vue/package.json
{
  "name": "@opendesign/storybooks-vue",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "storybook": "storybook dev -p 6007",
    "build-storybook": "storybook build"
  },
  "devDependencies": {
    "vue": "workspace:*",
    "@openlayout/vue": "workspace:*",
    "@storybook/vue3-vite": "workspace:*",
    "@storybook/addon-essentials": "workspace:*",
    "@storybook/addon-interactions": "workspace:*",
    "@storybook/addon-a11y": "workspace:*"
  }
}
```

#### 2.3.4 React Storybook 配置

```typescript
// storybooks/react/.storybook/main.ts
import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import path from "path";

const config: StorybookConfig = {
  stories: [
    "../packages/components/**/react/**/*.stories.tsx",
    "../packages/components/**/react/**/*.stories.mdx",
  ],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (config) => {
    return mergeConfig(config, {
      resolve: {
        alias: {
          "@openlayout/react": path.resolve(
            __dirname,
            "../packages/components/layout/react/src"
          ),
          "@openlayout/button": path.resolve(
            __dirname,
            "../packages/components/button/react/src"
          ),
        },
      },
    });
  },
};

export default config;
```

#### 2.3.5 主入口 Storybook（Composition）

```typescript
// storybooks/host/.storybook/main.ts
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [],
  refs: {
    "@opendesign/vue": {
      title: "Vue Components",
      url: "http://localhost:6007",
    },
    "@opendesign/react": {
      title: "React Components",
      url: "http://localhost:6008",
    },
  },
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-links",
  ],
  framework: {
    name: "@storybook/react-vite",
  },
};

export default config;
```

```json
// storybooks/host/package.json
{
  "name": "@opendesign/storybooks-host",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "devDependencies": {
    "@storybook/react-vite": "workspace:*",
    "@storybook/addon-essentials": "workspace:*",
    "@storybook/addon-links": "workspace:*"
  }
}
```

---

### 2.4 Stories 文件位置

Stories 放在各框架组件的 `src` 目录下：

```
packages/components/
└── layout/
    ├── vue/
    │   └── src/
    │       ├── Layout.tsx
    │       ├── Layout.stories.ts        # Vue Stories (.stories.ts)
    │       ├── Header.tsx
    │       ├── Header.stories.ts
    │       └── ...
    └── react/
        └── src/
            ├── Layout.tsx
            ├── Layout.stories.tsx        # React Stories (.stories.tsx)
            ├── Header.tsx
            ├── Header.stories.tsx
            └── ...
```

---

### 2.5 Story 模板

#### 2.5.1 Vue Story

```typescript
// packages/components/layout/vue/src/Layout.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3';
import { Layout } from '@openlayout/vue';

const meta: Meta<typeof Layout> = {
  title: 'Components/Layout',
  component: Layout,
  tags: ['autodocs'],
  argTypes: {
    headerHeight: { control: 'number' },
    sidebarWidth: { control: 'number' },
    collapsible: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Layout>;

export const Basic: Story = {
  render: (args) => ({
    components: { Layout },
    template: `
      <Layout v-bind="args">
        <template #header>Header</template>
        <template #sidebar>Sidebar</template>
        <template #default>Content</template>
      </Layout>
    `,
  }),
  args: {
    headerHeight: 64,
    sidebarWidth: 220,
  },
};

export const WithFixedHeader: Story = {
  render: (args) => ({
    components: { Layout },
    template: `
      <Layout v-bind="args">
        <template #header>
          <Layout.Header :fixed="true">Fixed Header</Layout.Header>
        </template>
        <template #sidebar>Sidebar</template>
        <template #default>Content</template>
      </Layout>
    `,
  }),
  args: {
    headerHeight: 64,
  },
};
```

#### 2.5.2 React Story

```typescript
// packages/components/layout/react/src/Layout.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Layout } from '@openlayout/react';

const meta: Meta<typeof Layout> = {
  title: 'Components/Layout',
  component: Layout,
  tags: ['autodocs'],
  argTypes: {
    headerHeight: { control: 'number' },
    sidebarWidth: { control: 'number' },
    collapsible: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Layout>;

export const Basic: Story = {
  render: (args) => (
    <Layout {...args}>
      <Layout.Header>Header</Layout.Header>
      <Layout.Sidebar>Sidebar</Layout.Sidebar>
      <Layout.Content>Content</Layout.Content>
    </Layout>
  ),
  args: {
    headerHeight: 64,
    sidebarWidth: 220,
  },
};

export const WithFixedHeader: Story = {
  render: (args) => (
    <Layout {...args}>
      <Layout.Header fixed>Fixed Header</Layout.Header>
      <Layout.Sidebar>Sidebar</Layout.Sidebar>
      <Layout.Content>Content</Layout.Content>
    </Layout>
  ),
  args: {
    headerHeight: 64,
  },
};
```

---

## 3. 启动与使用

### 3.1 开发模式

```bash
# 启动所有 Storybook（推荐）
pnpm storybook

# 或分别启动
pnpm storybook:vue   # http://localhost:6007
pnpm storybook:react # http://localhost:6008
pnpm storybook:host  # http://localhost:6006
```

### 3.2 访问地址

| 实例 | 地址 | 说明 |
|------|------|------|
| 主入口 | http://localhost:6006 | Composition 整合入口 |
| Vue | http://localhost:6007 | Vue 组件 Storybook |
| React | http://localhost:6008 | React 组件 Storybook |

### 3.3 构建静态站点

```bash
# 构建主入口 Storybook（包含 Composition）
pnpm build-storybook

# 输出目录: apps/storybook-host/storybook-static
```

---

## 4. 实施步骤

### 4.1 阶段划分

| 阶段 | 任务 | 工期 |
|------|------|------|
| Phase 1 | 创建 apps/storybook-vue 并配置 | 1d |
| Phase 2 | 创建 apps/storybook-react 并配置 | 1d |
| Phase 3 | 迁移 Layout 组件 Stories | 0.5d |
| Phase 4 | 创建 apps/storybook-host 配置 Composition | 0.5d |
| Phase 5 | 添加启动脚本与验证 | 0.5d |
| Phase 6 | 新组件接入规范文档 | 0.5d |
| **总计** | | **4d** |

### 4.2 新组件接入流程

```
新组件（如 button）接入流程：

1. 创建组件目录结构
   button/
   ├── vue/
   │   └── src/
   │       ├── Button.tsx
   │       └── Button.stories.ts     # Vue Stories
   ├── react/
   │   └── src/
   │       ├── Button.tsx
   │       └── Button.stories.tsx    # React Stories

2. 编写 Stories
   - Vue: button/vue/src/Button.stories.ts
   - React: button/react/src/Button.stories.tsx

3. 自动发现
   → 各 Storybook 实例自动通过 glob 发现

4. 访问演示
   - Vue: http://localhost:6007/?path=/docs/components-button--docs
   - React: http://localhost:6008/?path=/docs/components-button--docs
   - 主入口: http://localhost:6006
```

---

## 5. 风险与应对

| 风险 | 描述 | 应对措施 |
|------|------|----------|
| R1 | 启动 3 个进程占用资源 | 使用 `--parallel` 并行，可按需启动单个实例 |
| R2 | Composition 需要网络联通 | 本地 localhost 即可，CI 环境需配置端口映射 |
| R3 | 维护 3 份配置 | 将公共配置提取到共享模块 |
| R4 | Vue/React 样式不一致 | 使用统一的 CSS 变量系统 |

---

## 6. 方案对比

| 特性 | 本方案（Composition） | 单一实例 + Glob | Web Components |
|------|---------------------|-----------------|----------------|
| 框架支持 | ✅ 原生 Vue/React | ❌ 不支持混用 | ✅ 需包装 |
| 开发体验 | ✅ 最佳 | ✅ 一般 | ⚠️ 一般 |
| 维护成本 | ⭐ 中 | ⭐ 低 | ⭐ 高 |
| 构建时间 | 3 个实例 | 1 个实例 | 1 个实例 |
| 组件复用 | ❌ 需写两份 | ❌ 需写两份 | ✅ 一次编写 |

---

## 7. 附录

### 7.1 参考资料

- [Storybook Composition](https://storybook.js.org/docs/react/sharing/storybook-composition)
- [Storybook Vue3 Vite](https://storybook.js.org/docs/vue3/get-started/install)
- [Storybook in Monorepo - kamranicus](https://kamranicus.com/using-storybook-in-a-monorepo/)
- [Turborepo Discussion #6879](https://github.com/vercel/turborepo/discussions/6879)
- [Storybook Monorepo Discussion #11351](https://github.com/storybookjs/storybook/discussions/11351)

### 7.2 依赖清单

```json
{
  "devDependencies": {
    "vue": "workspace:*",
    "react": "workspace:*",
    "react-dom": "workspace:*",
    "@storybook/vue3": "workspace:*",
    "@storybook/vue3-vite": "workspace:*",
    "@storybook/react": "workspace:*",
    "@storybook/react-vite": "workspace:*",
    "@storybook/addon-essentials": "workspace:*",
    "@storybook/addon-interactions": "workspace:*",
    "@storybook/addon-a11y": "workspace:*",
    "@storybook/addon-links": "workspace:*",
    "concurrently": "^8.0.0"
  }
}
```

---

*本文档由 AI 生成*
