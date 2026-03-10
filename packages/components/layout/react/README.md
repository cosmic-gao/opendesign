# @openlayout/react

> React 布局组件库

## 安装

```bash
pnpm add @openlayout/react
```

## 组件

### Layout

根容器组件。

```tsx
import { Layout, Header, Sidebar, Content, Footer } from '@openlayout/react';

function App() {
  return (
    <Layout header={{ height: 64, fixed: true }} sidebar={{ width: 220, collapsible: true }}>
      <Header>Header</Header>
      <Sidebar>Sidebar</Sidebar>
      <Content>Content</Content>
      <Footer>Footer</Footer>
    </Layout>
  );
}
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

```tsx
<Header fixed height={64}>
  Logo
</Header>
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

```tsx
<Footer fixed height={48}>
  Copyright © 2026
</Footer>
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

```tsx
const [collapsed, setCollapsed] = useState(false);

<Sidebar 
  collapsible 
  collapsed={collapsed} 
  onCollapsedChange={setCollapsed}
>
  <nav>导航菜单</nav>
</Sidebar>
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
| onCollapsedChange | `(collapsed: boolean) => void` | 折叠状态变化回调 |

### Content

内容区域组件。

```tsx
<Content scrollable>
  内容区域
</Content>
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

```tsx
import { useLayout } from '@openlayout/react';

function MyComponent() {
  const { responsive, config, styles, state, actions } = useLayout();
  
  const { breakpoint, width, isMobile } = responsive;
  
  return (
    <div>
      <p>当前断点: {breakpoint}</p>
      <p>宽度: {width}</p>
      <p>移动端: {isMobile ? '是' : '否'}</p>
    </div>
  );
}
```

### useSidebar

获取侧边栏状态和操作。

```tsx
import { useSidebar } from '@openlayout/react';

function SidebarControl() {
  const { collapsed, visible, width, toggle, collapse, expand, show, hide, setCollapsed } = useSidebar();
  
  return (
    <button onClick={toggle}>
      {collapsed ? '展开' : '折叠'}
    </button>
  );
}
```

### useHeader

获取头部状态和操作。

```tsx
import { useHeader } from '@openlayout/react';

function HeaderControl() {
  const { visible, fixed, height, show, hide, setFixed } = useHeader();
  
  return null;
}
```

### useFooter

获取底部状态和操作。

```tsx
import { useFooter } from '@openlayout/react';

function FooterControl() {
  const { visible, fixed, height, show, hide, setFixed } = useFooter();
  
  return null;
}
```

## 使用示例

### 基础用法

```tsx
import { Layout, Header, Sidebar, Content, Footer } from '@openlayout/react';

function App() {
  return (
    <Layout>
      <Header>顶部导航</Header>
      <Sidebar>侧边栏</Sidebar>
      <Content>主内容</Content>
      <Footer>底部</Footer>
    </Layout>
  );
}
```

### 带配置

```tsx
<Layout
  header={{ height: 64, fixed: true }}
  footer={{ height: 48 }}
  sidebar={{ width: 220, collapsible: true, collapsedWidth: 80 }}
  content={{ scrollable: true }}
  animated
>
  <Header>顶部导航</Header>
  <Sidebar>侧边栏</Sidebar>
  <Content>主内容</Content>
  <Footer>底部</Footer>
</Layout>
```

### 受控折叠

```tsx
import { useState } from 'react';
import { Layout, Header, Sidebar, Content } from '@openlayout/react';

function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout>
      <Header>
        <button onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '展开' : '折叠'}
        </button>
      </Header>
      <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed}>
        侧边栏内容
      </Sidebar>
      <Content>主内容</Content>
    </Layout>
  );
}
```

### 移动端适配

```tsx
<Layout mobileBreakpoint={768}>
  <Header fixed>顶部导航</Header>
  <Sidebar overlay>侧边栏</Sidebar>
  <Content scrollable>主内容</Content>
</Layout>
```

## License

MIT
