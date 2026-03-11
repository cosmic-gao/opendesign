import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [],
  refs: {
    vue: {
      title: "Vue Components",
      url: process.env.STORYBOOK_VUE_URL || "http://localhost:6007",
    },
    react: {
      title: "React Components",
      url: process.env.STORYBOOK_REACT_URL || "http://localhost:6008",
    },
  },
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-links",
  ],
  framework: {
    name: "@storybook/react-vite",
  },
};

export default config;
