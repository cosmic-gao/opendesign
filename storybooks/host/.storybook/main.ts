import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    "../../packages/**/*.stories.tsx",
    "../../packages/**/*.stories.mdx",
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
