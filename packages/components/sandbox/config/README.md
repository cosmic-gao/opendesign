# @opensandbox/config

> WebContainer 配置管理包 - 轻量级、无框架依赖的 WebContainer 类型解决方案

## 特性

- **框架无关** - 纯 TypeScript 实现，可与 React、Vue、Svelte 等任何框架配合使用
- **泛型适配** - 通过泛型参数，上层框架传入自己的 VNode 和 CSSProperties 类型
- **类型安全** - 完整的 TypeScript 类型定义
- **可验证** - 提供配置验证功能，确保参数合法
- **可合并** - 支持浅合并和深度合并

## 安装

```bash
pnpm add @opensandbox/config
```

## 快速开始

```typescript
import { mergeConfig, validate } from '@opensandbox/config';

// 1. 合并配置
const config = mergeConfig({
  autoBoot: true,
  autoMount: true,
});

// 2. 验证配置
const result = validate({
  autoBoot: 'yes'  // 错误：应该是 boolean
});

if (!result.valid) {
  console.log(result.errors);
}
```

## API 参考

### mergeConfig(props, options?)

合并用户配置与默认配置。

**参数**:
- `props: WebContainerConfig` - 用户配置
- `options?: { deep?: boolean }` - 合并选项

**返回**: `WebContainerConfigResolved`

### validate(props)

验证配置合法性。

**参数**:
- `props: WebContainerConfig` - 要验证的配置

**返回**: `ValidationResult`

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}
```

## 默认配置

| 配置项 | 默认值 |
|--------|--------|
| autoBoot | true |
| autoMount | true |
| enableExit | true |

## 验证规则

| 字段 | 规则 |
|------|------|
| autoBoot | boolean |
| autoMount | boolean |
| enableExit | boolean |
| files | object (FileTree) |

## 导出列表

```typescript
// 类型
export type { ContainerStatus, WebContainerConfig, WebContainerConfigResolved }
export type { ValidationError, ValidationResult }
export type { SandboxError, BootError, MountError }
export type { FileTree, FileNode, DirectoryNode, SymlinkNode }
export type { DirEnt, FileEncoding, FileSystemOptions, WatchEvent, WatchListener, Watcher }
export type { SpawnOptions, ProcessStatus, ProcessHandle, ProcessExitEvent, ProcessOutputEvent }
export type { ServerReadyEvent, PortEvent, ServerInfo }

// 函数
export { mergeConfig, validate }

// 常量
export { DEFAULT_CONFIG, DEFAULT_PROCESS_OPTIONS }
```

## License

MIT
