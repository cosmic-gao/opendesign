import type { StorybookConfig } from "@storybook/vue3-vite";
import path from "path";

const config: StorybookConfig = {
  stories: [
    path.resolve(__dirname, "../../../packages/components/layout/vue/src/**/*.stories.tsx"),
    path.resolve(__dirname, "../../../packages/components/button/vue/src/**/*.stories.tsx"),
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
