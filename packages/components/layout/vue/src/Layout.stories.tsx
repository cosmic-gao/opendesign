import type { Meta, StoryObj } from '@storybook/vue3';
import { Layout } from './Layout';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Content } from './Content';
import { Footer } from './Footer';

const meta: Meta<typeof Layout> = {
  title: 'Layout/Layout',
  component: Layout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Layout>;

export const Default: Story = {
  render: (args) => ({
    components: { Layout, Header, Sidebar, Content, Footer },
    setup() {
      return { args };
    },
    template: `
      <Layout v-bind="args">
        <Header height="60">Header Content</Header>
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
    sidebar: { width: 240, collapsedWidth: 64 },
  },
};

export const WithCollapsedSidebar: Story = {
  render: (args) => ({
    components: { Layout, Header, Sidebar, Content, Footer },
    setup() {
      return { args };
    },
    template: `
      <Layout v-bind="args">
        <Header height="60">Header Content</Header>
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
    sidebar: { width: 240, collapsedWidth: 64, defaultCollapsed: true },
  },
};

export const WithoutHeader: Story = {
  render: (args) => ({
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
  render: (args) => ({
    components: { Layout, Header, Content },
    setup() {
      return { args };
    },
    template: `
      <Layout v-bind="args">
        <Header height="60">Header Only</Header>
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
  render: (args) => ({
    components: { Layout, Header, Sidebar, Content, Footer },
    setup() {
      return { args };
    },
    template: `
      <Layout v-bind="args">
        <Header height="60">Fixed Header</Header>
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
