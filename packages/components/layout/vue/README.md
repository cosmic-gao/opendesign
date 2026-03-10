# @openlayout/vue

> Vue 3 布局组件库

## 安装

```bash
pnpm add @openlayout/vue
```

## 组件

### Layout

根容器组件。

```vue
<template>
  <Layout :header="{ height: 64, fixed: true }" :sidebar="{ width: 220, collapsible: true }">
    <Header>Header</Header>
    <Sidebar>Sidebar</Sidebar>
    <Content>Content</Content>
    <Footer>Footer</Footer>
  </Layout>
</template>

<script setup lang="ts">
import { Layout, Header, Sidebar, Content, Footer } from '@openlayout/vue';
</script>
```

**Props:**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| header | `HeaderConfig` | - | 头部配置 |
| footer | `FooterConfig` | - | 底部配置 |
| sidebar | `SidebarConfig` | - | 侧边栏配置 |
| content | `ContentConfig` | - | 内容配置 |
| breakpoints | `Breakpoints` | DEFAULT_BREAKPOINTS | 断点配置 |
| mobileBreakpoint | `number` | 768 | 移动端断点 |
| animated | `boolean` | true | 启用动画 |
| animationDuration | `number` | 200 | 动画时长(ms) |
| className | `string` | - | 根元素类名 |
| style | `object` | - | 根元素样式 |

### Header

头部组件。

```vue
<template>
  <Header fixed height="64">
    Logo
  </Header>
</template>
```

**Props:**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fixed | `boolean` | false | 固定定位 |
| fullWidth | `boolean` | false | 撑满左右 |
| height | `number` | 64 | 高度 |
| className | `string` | - | 类名 |
| style | `object` | - | 样式 |

### Footer

底部组件。

```vue
<template>
  <Footer fixed height="48">
    Copyright © 2026
  </Footer>
</template>
```

**Props:**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fixed | `boolean` | false | 固定定位 |
| fullWidth | `boolean` | false | 撑满左右 |
| height | `number` | 48 | 高度 |
| className | `string` | - | 类名 |
| style | `object` | - | 样式 |

### Sidebar

侧边栏组件。

```vue
<template>
  <Sidebar collapsible :collapsed="isCollapsed" @update:collapsed="isCollapsed = $event">
    <nav>导航菜单</nav>
  </Sidebar>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Sidebar } from '@openlayout/vue';

const isCollapsed = ref(false);
</script>
```

**Props:**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| collapsible | `boolean` | false | 是否可折叠 |
| collapsed | `boolean` | - | 折叠状态（受控） |
| defaultCollapsed | `boolean` | false | 默认折叠（非受控） |
| fullHeight | `boolean` | true | 撑满上下 |
| overlay | `boolean` | false | 遮罩层模式 |
| width | `number` | 200 | 宽度 |
| collapsedWidth | `number` | 80 | 折叠后宽度 |
| className | `string` | - | 类名 |
| style | `object` | - | 样式 |

**Events:**

| 事件 | 参数 | 说明 |
|------|------|------|
| update:collapsed | `(collapsed: boolean)` | 折叠状态变化 |
| collapsedChange | `(collapsed: boolean)` | 折叠状态变化（兼容） |

### Content

内容区域组件。

```vue
<template>
  <Content scrollable>
    内容区域
  </Content>
</template>
```

**Props:**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| scrollable | `boolean` | true | 是否可滚动 |
| className | `string` | - | 类名 |
| style | `object` | - | 样式 |

## Hooks

### useLayout

获取布局上下文信息。

```vue
<script setup lang="ts">
import { useLayout } from '@openlayout/vue';

const { isMobile, breakpoint, breakpoints, currentWidth, headerHeight, footerHeight, sidebarWidth, collapsedWidth } = useLayout();
</script>
```

### useSidebar

获取侧边栏状态和操作。

```vue
<script setup lang="ts">
import { useSidebar } from '@openlayout/vue';

const { collapsed, visible, width, toggle, collapse, expand, show, hide, setCollapsed } = useSidebar();
</script>
```

### useHeader

获取头部状态和操作。

```vue
<script setup lang="ts">
import { useHeader } from '@openlayout/vue';

const { visible, fixed, height, show, hide, setFixed } = useHeader();
</script>
```

### useFooter

获取底部状态和操作。

```vue
<script setup lang="ts">
import { useFooter } from '@openlayout/vue';

const { visible, fixed, height, show, hide, setFixed } = useFooter();
</script>
```

## 使用示例

### 基础用法

```vue
<template>
  <Layout>
    <Header>顶部导航</Header>
    <Sidebar>侧边栏</Sidebar>
    <Content>主内容</Content>
    <Footer>底部</Footer>
  </Layout>
</template>
```

### 带配置

```vue
<template>
  <Layout
    :header="{ height: 64, fixed: true }"
    :footer="{ height: 48 }"
    :sidebar="{ width: 220, collapsible: true, collapsedWidth: 80 }"
    :content="{ scrollable: true }"
    animated
  >
    <Header>顶部导航</Header>
    <Sidebar>侧边栏</Sidebar>
    <Content>主内容</Content>
    <Footer>底部</Footer>
  </Layout>
</template>
```

### 受控折叠

```vue
<template>
  <Layout>
    <Header>
      <button @click="collapsed = !collapsed">
        {{ collapsed ? '展开' : '折叠' }}
      </button>
    </Header>
    <Sidebar :collapsed="collapsed" @update:collapsed="collapsed = $event">
      侧边栏内容
    </Sidebar>
    <Content>主内容</Content>
  </Layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Layout, Header, Sidebar, Content } from '@openlayout/vue';

const collapsed = ref(false);
</script>
```

## License

MIT
