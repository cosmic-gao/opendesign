import type { Meta, StoryObj } from '@storybook/react';
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
  render: () => (
    <Layout>
      <Header>Header</Header>
      <Sidebar>Sidebar</Sidebar>
      <Content>Content</Content>
      <Footer>Footer</Footer>
    </Layout>
  ),
};

export const WithCustomConfig: Story = {
  args: {
    header: { fixed: true },
    sidebar: { collapsed: false, collapsible: true },
  },
  render: (args) => (
    <Layout {...args}>
      <Header>Fixed Header</Header>
      <Sidebar>Collapsible Sidebar</Sidebar>
      <Content>Main Content</Content>
      <Footer>Footer</Footer>
    </Layout>
  ),
};
