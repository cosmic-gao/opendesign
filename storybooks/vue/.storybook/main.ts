import type { StorybookConfig } from "@storybook/vue3-vite";

const config: StorybookConfig = {
  stories: [
    "../../packages/**/*.stories.tsx",
    "../../packages/**/*.stories.mdx",
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
