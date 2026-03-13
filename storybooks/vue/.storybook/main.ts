import type { StorybookConfig } from "@storybook/vue3-vite";

const config: StorybookConfig = {
  stories: [
    "../packages/components/layout/vue/src/**/*.stories.tsx",
    "../packages/components/button/vue/src/**/*.stories.tsx",
  ],
  addons: [
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/vue3-vite",
    options: {},
  },
};

export default config;
