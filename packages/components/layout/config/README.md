# @openlayout/config

OpenDesign Layout 配置包，提供布局配置的默认值。

## 安装

```bash
npm install @openlayout/config
```

## 使用

```typescript
import { defaultConfig } from '@openlayout/config';
import type { LayoutConfig } from '@openlayout/type';

const config: LayoutConfig = {
  ...defaultConfig,
  // 可覆盖默认配置
  sizes: {
    header: 80,
    sidebar: 300,
  },
};
```

## 默认值

| 配置项 | 默认值 |
|--------|--------|
| mode | `sidebar` |
| defaultCollapsed | `false` |
| breakpoints.xs | `480` |
| breakpoints.sm | `768` |
| breakpoints.md | `1024` |
| sizes.header | `64` |
| sizes.footer | `48` |
| sizes.sidebar | `240` |
