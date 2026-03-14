import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['./src/**/*.stories.@(js|jsx|ts|tsx)', './src/**/*.mdx'],
  addons: [
    '@storybook/addon-vitest',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (storybookConfig) => {
    return storybookConfig;
  },
};

export default config;
