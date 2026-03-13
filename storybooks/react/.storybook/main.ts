import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  stories: [
    "E:/opendesign/packages/components/layout/react/src/**/*.stories.tsx",
  ],
  addons: [
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@openlayout/react': 'E:/opendesign/packages/components/layout/react/src',
          '@openlayout/config': 'E:/opendesign/packages/components/layout/config/src',
          '@openlayout/core': 'E:/opendesign/packages/components/layout/core/src',
        },
      },
    });
  },
};

export default config;
