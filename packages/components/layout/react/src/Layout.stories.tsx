import type { Meta, StoryObj } from '@storybook/react';
import { Layout } from './Layout';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Content } from './Content';
import { Footer } from './Footer';

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
  render: () => (
    <Layout
      header={{ fixed: true }}
      sidebar={{ width: 240, collapsedWidth: 64 }}
    >
      <Header height={60}>Header Content</Header>
      <div style={{ display: 'flex', flex: 1, paddingTop: '60px' }}>
        <Sidebar>
          <div style={{ padding: '16px' }}>Sidebar Content</div>
        </Sidebar>
        <Content>
          <div style={{ padding: '24px' }}>
            <h1>Main Content</h1>
            <p>This is the main content area.</p>
          </div>
        </Content>
      </div>
      <Footer>Footer Content</Footer>
    </Layout>
  ),
};

export const WithCollapsedSidebar: Story = {
  render: () => (
    <Layout
      header={{ fixed: true }}
      sidebar={{ width: 240, collapsedWidth: 64, defaultCollapsed: true }}
    >
      <Header height={60}>Header Content</Header>
      <div style={{ display: 'flex', flex: 1, paddingTop: '60px' }}>
        <Sidebar>
          <div style={{ padding: '16px' }}>Sidebar Content</div>
        </Sidebar>
        <Content>
          <div style={{ padding: '24px' }}>
            <h1>Main Content</h1>
            <p>Sidebar is collapsed by default.</p>
          </div>
        </Content>
      </div>
    </Layout>
  ),
};

export const WithoutHeader: Story = {
  render: () => (
    <Layout sidebar={{ width: 240 }}>
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar>
          <div style={{ padding: '16px' }}>Sidebar Content</div>
        </Sidebar>
        <Content>
          <div style={{ padding: '24px' }}>
            <h1>No Header</h1>
            <p>This layout has no header.</p>
          </div>
        </Content>
      </div>
    </Layout>
  ),
};

export const WithoutSidebar: Story = {
  render: () => (
    <Layout header={{ fixed: true }}>
      <Header height={60}>Header Only</Header>
      <div style={{ paddingTop: '60px' }}>
        <Content>
          <div style={{ padding: '24px' }}>
            <h1>No Sidebar</h1>
            <p>This layout has no sidebar.</p>
          </div>
        </Content>
      </div>
    </Layout>
  ),
};

export const FullLayout: Story = {
  render: () => (
    <Layout
      header={{ fixed: true }}
      sidebar={{ width: 240 }}
      footer={{ fixed: false }}
    >
      <Header height={60}>Fixed Header</Header>
      <div style={{ display: 'flex', flex: 1, paddingTop: '60px', paddingBottom: '48px' }}>
        <Sidebar>
          <div style={{ padding: '16px' }}>Sidebar</div>
        </Sidebar>
        <Content>
          <div style={{ padding: '24px' }}>
            <h1>Full Layout</h1>
            <p>Header, Sidebar, Content, and Footer.</p>
          </div>
        </Content>
      </div>
      <Footer>Fixed Footer</Footer>
    </Layout>
  ),
};
