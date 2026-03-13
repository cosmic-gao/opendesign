import type { StorybookConfig } from "@storybook/vue3-vite";
import { mergeConfig, defineConfig } from 'vite';
import vueJsx from '@vitejs/plugin-vue-jsx';

const config: StorybookConfig = {
  stories: [
    "E:/opendesign/packages/components/layout/vue/src/**/*.stories.tsx",
  ],
  addons: [
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/vue3-vite",
    options: {},
  },
  async viteFinal(config) {
    return mergeConfig(config, defineConfig({
      resolve: {
        alias: {
          '@openlayout/vue': 'E:/opendesign/packages/components/layout/vue/src',
          '@openlayout/config': 'E:/opendesign/packages/components/layout/config/src',
          '@openlayout/core': 'E:/opendesign/packages/components/layout/core/src',
        },
      },
      plugins: [vueJsx()],
      define: {
        __VUE_OPTIONS_API__: JSON.stringify(true),
        __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
      },
    }));
  },
};

export default config;
