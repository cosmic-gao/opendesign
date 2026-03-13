import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
  stories: [
    "E:/opendesign/packages/components/layout/react/src/**/*.stories.tsx",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  refs: {
    vue: {
      title: "Vue Components",
      url: "http://localhost:6007",
      expanded: true,
    }
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
