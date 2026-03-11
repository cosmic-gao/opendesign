import type { StorybookConfig } from "@storybook/vue3-vite";
import { mergeConfig } from "vite";
import path from "path";

const config: StorybookConfig = {
  stories: [
    "../../packages/components/**/vue/**/*.stories.ts",
    "../../packages/components/**/vue/**/*.stories.mdx",
  ],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/vue3-vite",
    options: {},
  },
  viteFinal: async (config) => {
    return mergeConfig(config, {
      resolve: {
        alias: {
          "@openlayout/vue": path.resolve(
            __dirname,
            "../../packages/components/layout/vue/src"
          ),
          "@openlayout/button": path.resolve(
            __dirname,
            "../../packages/components/button/vue/src"
          ),
        },
      },
    });
  },
};

export default config;
