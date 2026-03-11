import type { StorybookConfig } from "@storybook/react-vite";
import path from "path";

const config: StorybookConfig = {
  stories: [
    path.resolve(__dirname, "../../../packages/components/layout/react/src/**/*.stories.tsx"),
    path.resolve(__dirname, "../../../packages/components/layout/vue/src/**/*.stories.tsx"),
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
