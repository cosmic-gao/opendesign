import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import path from "path";

const config: StorybookConfig = {
  stories: [
    "../../packages/components/**/react/**/*.stories.tsx",
    "../../packages/components/**/react/**/*.stories.mdx",
  ],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (config) => {
    return mergeConfig(config, {
      resolve: {
        alias: {
          "@openlayout/react": path.resolve(
            __dirname,
            "../../packages/components/layout/react/src"
          ),
          "@openlayout/button": path.resolve(
            __dirname,
            "../../packages/components/button/react/src"
          ),
        },
      },
    });
  },
};

export default config;
