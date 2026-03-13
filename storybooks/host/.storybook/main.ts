import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    "../packages/components/layout/react/src/**/*.stories.tsx",
    "../packages/components/layout/vue/src/**/*.stories.tsx",
  ],
  addons: [
    "@storybook/addon-links",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
};

export default config;
