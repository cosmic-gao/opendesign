import { expect, test, describe } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { Layout } from '../Layout';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';
import { Content } from '../Content';
import { Footer } from '../Footer';

const meta: Meta<typeof Layout> = {
  title: 'React/Layout',
  component: Layout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Layout>;

export const Default: Story = {
  render: (args) => (
    <Layout {...args}>
      <Header style={{ height: 60 }}>Header Content</Header>
      <div style={{ display: 'flex', flex: 1, paddingTop: 60 }}>
        <Sidebar>
          <div style={{ padding: 16 }}>Sidebar Content</div>
        </Sidebar>
        <Content>
          <div style={{ padding: 24 }}>
            <h1>Main Content</h1>
            <p>This is the main content area.</p>
          </div>
        </Content>
      </div>
      <Footer>Footer Content</Footer>
    </Layout>
  ),
  args: {
    header: { fixed: true },
    sidebar: { width: 240, min: 64 },
  },
};

export const WithCollapsedSidebar: Story = {
  render: (args) => (
    <Layout {...args}>
      <Header style={{ height: 60 }}>Header Content</Header>
      <div style={{ display: 'flex', flex: 1, paddingTop: 60 }}>
        <Sidebar>
          <div style={{ padding: 16 }}>Sidebar Content</div>
        </Sidebar>
        <Content>
          <div style={{ padding: 24 }}>
            <h1>Main Content</h1>
            <p>Sidebar is collapsed by default.</p>
          </div>
        </Content>
      </div>
    </Layout>
  ),
  args: {
    header: { fixed: true },
    sidebar: { width: 240, min: 64, collapsed: true },
  },
};

export const WithoutHeader: Story = {
  render: (args) => (
    <Layout {...args}>
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar>
          <div style={{ padding: 16 }}>Sidebar Content</div>
        </Sidebar>
        <Content>
          <div style={{ padding: 24 }}>
            <h1>No Header</h1>
            <p>This layout has no header.</p>
          </div>
        </Content>
      </div>
    </Layout>
  ),
  args: {
    sidebar: { width: 240 },
  },
};

export const WithoutSidebar: Story = {
  render: (args) => (
    <Layout {...args}>
      <Header style={{ height: 60 }}>Header Only</Header>
      <div style={{ paddingTop: 60 }}>
        <Content>
          <div style={{ padding: 24 }}>
            <h1>No Sidebar</h1>
            <p>This layout has no sidebar.</p>
          </div>
        </Content>
      </div>
    </Layout>
  ),
  args: {
    header: { fixed: true },
  },
};

export const FullLayout: Story = {
  render: (args) => (
    <Layout {...args}>
      <Header style={{ height: 60 }}>Fixed Header</Header>
      <div style={{ display: 'flex', flex: 1, paddingTop: 60, paddingBottom: 48 }}>
        <Sidebar>
          <div style={{ padding: 16 }}>Sidebar</div>
        </Sidebar>
        <Content>
          <div style={{ padding: 24 }}>
            <h1>Full Layout</h1>
            <p>Header, Sidebar, Content, and Footer.</p>
          </div>
        </Content>
      </div>
      <Footer>Fixed Footer</Footer>
    </Layout>
  ),
  args: {
    header: { fixed: true },
    sidebar: { width: 240 },
    footer: { fixed: false },
  },
};

describe('React Layout Storybook Interaction Tests', () => {
  test('Default story renders correctly', async ({ canvasElement }) => {
    const layout = canvasElement.querySelector('.od-layout');
    expect(layout).toBeTruthy();
  });

  test('Header is visible in Default story', async ({ canvasElement }) => {
    const header = canvasElement.querySelector('.od-layout-header');
    expect(header).toBeTruthy();
  });

  test('Sidebar is visible in Default story', async ({ canvasElement }) => {
    const sidebar = canvasElement.querySelector('.od-layout-sidebar');
    expect(sidebar).toBeTruthy();
  });

  test('Content is visible in Default story', async ({ canvasElement }) => {
    const content = canvasElement.querySelector('.od-layout-content');
    expect(content).toBeTruthy();
  });

  test('Footer is visible in FullLayout story', async ({ canvasElement }) => {
    const footer = canvasElement.querySelector('.od-layout-footer');
    expect(footer).toBeTruthy();
  });

  test('Collapsed sidebar has correct class', async ({ canvasElement }) => {
    const sidebar = canvasElement.querySelector('.od-layout-sidebar');
    expect(sidebar?.classList.contains('od-layout-sidebar--collapsed')).toBe(true);
  });

  test('Fixed header has correct class', async ({ canvasElement }) => {
    const header = canvasElement.querySelector('.od-layout-header');
    expect(header?.classList.contains('od-layout-header--fixed')).toBe(true);
  });
});
