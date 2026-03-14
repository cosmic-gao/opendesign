import { expect, test, describe } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/vue3';
import { Layout } from '../src/Layout';
import { Header } from '../src/Header';
import { Sidebar } from '../src/Sidebar';
import { Content } from '../src/Content';
import { Footer } from '../src/Footer';

const meta: Meta<typeof Layout> = {
  title: 'Vue/Layout',
  component: Layout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Layout>;

export const Default: Story = {
  render: (args: typeof meta.args) => ({
    components: { Layout, Header, Sidebar, Content, Footer },
    setup() {
      return { args };
    },
    template: `
      <Layout v-bind="args">
        <Header :height="60">Header Content</Header>
        <div style="display: flex; flex: 1; padding-top: 60px;">
          <Sidebar>
            <div style="padding: 16px;">Sidebar Content</div>
          </Sidebar>
          <Content>
            <div style="padding: 24px;">
              <h1>Main Content</h1>
              <p>This is the main content area.</p>
            </div>
          </Content>
        </div>
        <Footer>Footer Content</Footer>
      </Layout>
    `,
  }),
  args: {
    header: { fixed: true },
    sidebar: { width: 240, min: 64 },
  },
};

export const WithCollapsedSidebar: Story = {
  render: (args: typeof meta.args) => ({
    components: { Layout, Header, Sidebar, Content, Footer },
    setup() {
      return { args };
    },
    template: `
      <Layout v-bind="args">
        <Header :height="60">Header Content</Header>
        <div style="display: flex; flex: 1; padding-top: 60px;">
          <Sidebar>
            <div style="padding: 16px;">Sidebar Content</div>
          </Sidebar>
          <Content>
            <div style="padding: 24px;">
              <h1>Main Content</h1>
              <p>Sidebar is collapsed by default.</p>
            </div>
          </Content>
        </div>
      </Layout>
    `,
  }),
  args: {
    header: { fixed: true },
    sidebar: { width: 240, min: 64, collapsed: true },
  },
};

export const WithoutHeader: Story = {
  render: (args: typeof meta.args) => ({
    components: { Layout, Sidebar, Content },
    setup() {
      return { args };
    },
    template: `
      <Layout v-bind="args">
        <div style="display: flex; flex: 1;">
          <Sidebar>
            <div style="padding: 16px;">Sidebar Content</div>
          </Sidebar>
          <Content>
            <div style="padding: 24px;">
              <h1>No Header</h1>
              <p>This layout has no header.</p>
            </div>
          </Content>
        </div>
      </Layout>
    `,
  }),
  args: {
    sidebar: { width: 240 },
  },
};

export const WithoutSidebar: Story = {
  render: (args: typeof meta.args) => ({
    components: { Layout, Header, Content },
    setup() {
      return { args };
    },
    template: `
      <Layout v-bind="args">
        <Header :height="60">Header Only</Header>
        <div style="padding-top: 60px;">
          <Content>
            <div style="padding: 24px;">
              <h1>No Sidebar</h1>
              <p>This layout has no sidebar.</p>
            </div>
          </Content>
        </div>
      </Layout>
    `,
  }),
  args: {
    header: { fixed: true },
  },
};

export const FullLayout: Story = {
  render: (args: typeof meta.args) => ({
    components: { Layout, Header, Sidebar, Content, Footer },
    setup() {
      return { args };
    },
    template: `
      <Layout v-bind="args">
        <Header :height="60">Fixed Header</Header>
        <div style="display: flex; flex: 1; padding-top: 60px; padding-bottom: 48px;">
          <Sidebar>
            <div style="padding: 16px;">Sidebar</div>
          </Sidebar>
          <Content>
            <div style="padding: 24px;">
              <h1>Full Layout</h1>
              <p>Header, Sidebar, Content, and Footer.</p>
            </div>
          </Content>
        </div>
        <Footer>Fixed Footer</Footer>
      </Layout>
    `,
  }),
  args: {
    header: { fixed: true },
    sidebar: { width: 240 },
    footer: { fixed: false },
  },
};

describe('Layout Storybook Interaction Tests', () => {
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
