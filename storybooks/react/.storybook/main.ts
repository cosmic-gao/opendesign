import type { StorybookConfig } from "@storybook/react-vite";
import path from "path";

const config: StorybookConfig = {
  stories: [
    path.resolve(__dirname, "../../../packages/components/layout/react/src/**/*.stories.tsx"),
    path.resolve(__dirname, "../../../packages/components/button/react/src/**/*.stories.tsx"),
  ],
  addons: [
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
};

export default config;
