# OpenDesign 组件库 Storybook 统一管理方案

**版本**: 1.1.0
**状态**: 规划中
**日期**: 2026-03-10

---

## 修改记录 (Changelog)

| 版本 | 日期 | 修改内容 |
|------|------|----------|
| 1.1.0 | 2026-03-10 | 优化：采用单一 Storybook 实例方案，通过 Glob 自动发现 Stories；Stories 放在各组件 src 目录下 |
| 1.0.0 | 2026-03-10 | 初始版本：多实例 Storybook Composition 方案 |

---

## 1. 背景与目标

### 1.1 背景

当前 `@openlayout` 组件库采用 Monorepo 架构，每个组件包含多框架适配（Vue/React）。随着组件库规模扩展（Button、Form、Modal 等组件即将加入），需要统一的文档与演示平台。

现有问题：
- 每个组件缺乏直观的交互式演示
- Vue/React 双版本需要对比展示
- 组件文档分散，缺乏统一入口
- 新组件接入文档流程繁琐

### 1.2 目标

| 目标 | 描述 | 优先级 |
|------|------|--------|
| G1 | 单一 Storybook 实例管理所有组件 | P0 |
| G2 | 支持 Vue/React 双框架并行展示 | P0 |
| G3 | 组件代码即文档，降低维护成本 | P0 |
| G4 | 支持主题定制和响应式预览 | P1 |
| G5 | 一键生成静态文档站点 | P1 |

### 1.3 成功指标

- 单一 Storybook 实例管理所有组件
- 每个组件包含至少 3 个交互式 Stories
- Vue/React 切换延迟 < 200ms
- 静态站点构建时间 < 30s

---

## 2. 技术方案

### 2.1 方案选型：单一实例

采用 **单一 Storybook 实例** 方案，通过 Glob 模式自动发现所有组件的 Stories：

```
仓库根目录
├── .storybook/                 # 单一实例配置
│   ├── main.ts
│   ├── preview.ts
│   └── theme.ts
├── packages/
│   └── components/
│       ├── layout/
│       │   ├── vue/
│       │   │   └── src/
│       │   │       ├── Layout.tsx
│       │   │       └── Layout.stories.tsx    # 自动发现
│       │   └── react/
│       │       └── src/
│       │           ├── Layout.tsx
│       │           └── Layout.stories.tsx    # 自动发现
│       └── button/                  # 未来组件
│           └── ...
```

**优势**：
- 配置集中，只需维护一份 `.storybook/`
- 跨包组合展示更方便
- Vite HMR 跨包热更新，启动快
- 无需 Nx/Turborepo 依赖

---

### 2.2 Storybook 配置

#### 2.2.1 主配置

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  // 自动发现所有组件的 Stories
  stories: [
    '../packages/components/**/*.stories.tsx',
    '../packages/components/**/*.stories.mdx',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // Vite 配置：支持多框架
  viteFinal: async (config) => {
    return mergeConfig(config, {
      plugins: [
        // 根据路径自动识别 Vue/React 组件
        {
          name: 'framework-detector',
          enforce: 'pre',
          transform(code, id) {
            if (id.includes('/vue/') && !id.includes('node_modules')) {
              // Vue 组件处理
            }
            if (id.includes('/react/') && !id.includes('node_modules')) {
              // React 组件处理
            }
          },
        },
      ],
    });
  },
};

export default config;
```

#### 2.2.2 全局预览配置

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/vue3';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
  },
  decorators: [
    (story) => ({
      template: '<div style="padding: 20px;"><story /></div>',
    }),
  ],
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: ['light', 'dark'],
        showName: true,
      },
    },
  },
};

export default preview;
```

### 2.3 Stories 文件位置

Stories 直接放在各框架的 `src` 目录下：

```
packages/components/
└── layout/
    ├── vue/
    │   └── src/
    │       ├── Layout.tsx
    │       ├── Layout.stories.tsx        # Vue Stories
    │       ├── Header.tsx
    │       ├── Header.stories.tsx
    │       └── ...
    └── react/
        └── src/
            ├── Layout.tsx
            ├── Layout.stories.tsx        # React Stories
            ├── Header.tsx
            ├── Header.stories.tsx
            └── ...
```

### 2.4 Story 模板

```typescript
// packages/components/layout/vue/src/Layout.stories.tsx
import type { Meta, StoryObj } from '@storybook/vue3';
import { Layout, Header, Sidebar, Content, Footer } from '@openlayout/vue';

const meta: Meta<typeof Layout> = {
  title: 'Components/Layout',
  component: Layout,
  tags: ['autodocs'],
  argTypes: {
    header: { control: 'object' },
    sidebar: { control: 'object' },
  },
};

export default meta;
type Story = StoryObj<typeof Layout>;

export const Basic: Story = {
  render: (args) => ({
    components: { Layout, Header, Sidebar, Content, Footer },
    template: `
      <Layout v-bind="args">
        <Header>Header</Header>
        <Sidebar>Sidebar</Sidebar>
        <Content>Content</Content>
        <Footer>Footer</Footer>
      </Layout>
    `,
  }),
  args: {
    header: { height: 64 },
    sidebar: { width: 220, collapsible: true },
  },
};

export const WithFixedHeader: Story = {
  render: (args) => ({
    components: { Layout, Header, Sidebar, Content, Footer },
    template: `
      <Layout v-bind="args">
        <Header :fixed="true">Fixed Header</Header>
        <Sidebar>Sidebar</Sidebar>
        <Content>Content</Content>
        <Footer>Footer</Footer>
      </Layout>
    `,
  }),
  args: {
    header: { fixed: true, height: 64 },
  },
};
```

### 2.5 双框架 Story 设计

#### 2.5.1 并排对比模式

```typescript
// packages/components/layout/vue/src/FrameworkComparison.stories.tsx
import { VueLayout } from './variants/VueLayout';
import { ReactLayout } from './variants/ReactLayout';

export const Comparison = {
  parameters: {
    layout: 'centered',
  },
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
          <h3>Vue</h3>
          <VueLayout />
        </div>
        <div>
          <h3>React</h3>
          <ReactLayout />
        </div>
      </div>
    `,
  }),
};
```

#### 2.5.2 Tab 切换模式

```typescript
export const VueOnly = {
  parameters: {
    framework: 'vue',
  },
};

export const ReactOnly = {
  parameters: {
    framework: 'react',
  },
};
```

### 2.6 组件配置面板

利用 Storybook Controls 自动化 Props 编辑：

```typescript
const meta: Meta<typeof Layout> = {
  argTypes: {
    header: { control: 'object' },
    sidebar: { control: 'object' },
    mobileBreakpoint: { control: { type: 'number', min: 320, max: 1920, step: 1 } },
    animated: { control: 'boolean' },
    theme: {
      control: 'select',
      options: ['light', 'dark', 'system'],
    },
    onBreakpointChange: { action: 'breakpoint-changed' },
  },
};
```

---

## 3. 接口与数据结构设计

### 3.1 组件元数据

```typescript
interface ComponentMeta {
  name: string;
  description: string;
  frameworks: ('vue' | 'react')[];
  status: 'stable' | 'beta' | 'deprecated';
  version: string;
}
```

### 3.2 Story 配置文件

```typescript
interface StorybookConfig {
  components: {
    [key: string]: {
      title: string;
      component: any;
      vuePackage: string;
      reactPackage: string;
    };
  };
}
```

---

## 4. 实施步骤

### 4.1 阶段划分

| 阶段 | 任务 | 工期 |
|------|------|------|
| Phase 1 | 搭建 Storybook 基础环境 | 2d |
| Phase 2 | 迁移 Layout 组件 Stories | 1d |
| Phase 3 | 实现 Vue/React 双框架展示 | 2d |
| Phase 4 | 添加主题和 Controls | 1d |
| Phase 5 | 自动化配置生成脚本 | 1d |
| Phase 6 | 新组件接入规范文档 | 1d |
| **总计** | | **8d** |

### 4.2 新组件接入流程

```
新组件（如 button）接入流程：

1. 创建组件目录结构
   button/
   ├── vue/
   │   └── src/
   │       ├── Button.tsx
   │       └── Button.stories.tsx    # Stories 在 src 内
   ├── react/
   │   └── src/
   │       ├── Button.tsx
   │       └── Button.stories.tsx    # Stories 在 src 内

2. 编写 Stories
   button/vue/src/Button.stories.tsx

3. 自动发现
   → Storybook 自动通过 glob 发现

4. 访问演示
   http://localhost:6006/?path=/docs/components-button--docs
```

---

## 5. 风险与应对

| 风险 | 描述 | 应对措施 |
|------|------|----------|
| R1 | Vue/React 样式不一致 | 使用统一的 CSS 变量系统 |
| R2 | Storybook 构建体积过大 | 按需加载、代码分割 |
| R3 | 多框架配置复杂 | 封装配置生成脚本 |
| R4 | Controls 类型推断失败 | 显式声明 argTypes |

---

## 6. 附录

### 6.1 参考资料

- [Storybook Vue3 Vite](https://storybook.js.org/docs/vue3/get-started/install)
- [Storybook in Monorepo - kamranicus](https://kamranicus.com/using-storybook-in-a-monorepo/)
- [Turborepo Discussion #6879](https://github.com/vercel/turborepo/discussions/6879)

### 6.2 依赖清单

```json
{
  "devDependencies": {
    "@storybook/vue3": "^8.0.0",
    "@storybook/vue3-vite": "^8.0.0",
    "@storybook/react": "^8.0.0",
    "@storybook/react-vite": "^8.0.0",
    "@storybook/addon-essentials": "^8.0.0",
    "@storybook/addon-interactions": "^8.0.0",
    "@storybook/addon-a11y": "^8.0.0",
    "@storybook/theming": "^8.0.0"
  }
}
```

---

*本文档由 AI 生成*
