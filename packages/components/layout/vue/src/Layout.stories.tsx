import type { Meta, StoryObj } from '@storybook/vue3';
import { Layout } from './Layout';
import { Header } from './Header';
import { Footer } from './Footer';
import { Sidebar } from './Sidebar';
import { Content } from './Content';

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
  render: () => ({
    components: { Layout, Header, Footer, Sidebar, Content },
    template: `
      <Layout>
        <Header>Header</Header>
        <Sidebar>Sidebar</Sidebar>
        <Content>Content</Content>
        <Footer>Footer</Footer>
      </Layout>
    `,
  }),
};

export const FixedHeader: Story = {
  render: () => ({
    components: { Layout, Header, Footer, Sidebar, Content },
    data: () => ({ header: { fixed: true } }),
    template: `
      <Layout :header="header">
        <Header>Fixed Header</Header>
        <Sidebar>Sidebar</Sidebar>
        <Content>Main Content</Content>
        <Footer>Footer</Footer>
      </Layout>
    `,
  }),
};

export const CollapsibleSidebar: Story = {
  render: () => ({
    components: { Layout, Header, Footer, Sidebar, Content },
    data: () => ({ sidebar: { collapsed: false, collapsible: true } }),
    template: `
      <Layout :sidebar="sidebar">
        <Header>Header</Header>
        <Sidebar>Collapsible Sidebar</Sidebar>
        <Content>Main Content</Content>
        <Footer>Footer</Footer>
      </Layout>
    `,
  }),
};
