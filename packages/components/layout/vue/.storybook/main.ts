import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
  stories: ['./src/**/*.stories.@(js|jsx|ts|tsx)', './src/**/*.mdx'],
  addons: [
    '@storybook/addon-vitest',
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  viteFinal: async (storybookConfig) => {
    return storybookConfig;
  },
};

export default config;
