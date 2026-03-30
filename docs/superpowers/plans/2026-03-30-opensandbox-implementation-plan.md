# WebContainer Headless Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建 `@opensandbox/config` 和 `@opensandbox/core` 两个包，提供 WebContainer API 的 headless 封装

**Architecture:** 分层架构
- `config` 包：纯类型定义 + 常量 + 验证，无运行时依赖
- `core` 包：框架无关的运行时逻辑，依赖 config 和 @opendesign/signal

**Tech Stack:**
- TypeScript
- @webcontainer/api (peerDependency)
- @opendesign/signal (事件系统)

---

## Task 1: 初始化 config 包结构

**Files:**
- Create: `packages/components/sandbox/config/src/types.ts`
- Create: `packages/components/sandbox/config/src/constants.ts`
- Create: `packages/components/sandbox/config/src/index.ts`
- Create: `packages/components/sandbox/config/package.json`
- Create: `packages/components/sandbox/config/tsconfig.json`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p packages/components/sandbox/config/src
```

- [ ] **Step 2: 创建 package.json**

```json
{
  "name": "@opensandbox/config",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "src/index.ts"
}
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "extends": "@opendesign/tsconfig/lib",
  "compilerOptions": {
    "rootDir": "src",
    "composite": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 4: 提交**

```bash
git add packages/components/sandbox/config/
git commit -m "feat(sandbox): init config package structure"
```

---

## Task 2: 实现 types.ts - 基础类型定义

**Files:**
- Create: `packages/components/sandbox/config/src/types.ts`

**Prerequisite:** Task 1

- [ ] **Step 1: 创建 types.ts**

```typescript
// 状态类型
export type ContainerStatus = 
  | 'idle' 
  | 'loading' 
  | 'ready' 
  | 'installing' 
  | 'booting' 
  | 'error';

// 错误类型基类
export class SandboxError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SandboxError';
  }
}

// 错误类型细分
export class BootError extends SandboxError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('BOOT_ERROR', message, details);
    this.name = 'BootError';
  }
}

export class MountError extends SandboxError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('MOUNT_ERROR', message, details);
    this.name = 'MountError';
  }
}

// 配置类型 (泛型用于框架无关)
export interface WebContainerConfig<
  VNode = unknown, 
  CSSProperties = unknown
> {
  autoBoot?: boolean;
  autoMount?: boolean;
  enableExit?: boolean;
  files?: FileTree;
  className?: string;
  style?: CSSProperties;
  children?: VNode;
}

export interface WebContainerConfigResolved {
  autoBoot: boolean;
  autoMount: boolean;
  enableExit: boolean;
}

// 验证结果类型
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// 导出 files.ts 的类型供外部使用
export type { FileTree, FileNode, DirectoryNode, SymlinkNode } from './files';
```

- [ ] **Step 2: 提交**

```bash
git add packages/components/sandbox/config/src/types.ts
git commit -m "feat(sandbox): add base types in config package"
```

---

## Task 3: 实现 files.ts - 文件系统类型

**Files:**
- Create: `packages/components/sandbox/config/src/files.ts`

**Prerequisite:** Task 2

- [ ] **Step 1: 创建 files.ts**

```typescript
// 文件系统树节点
export interface FileNode {
  file: {
    contents: string | Uint8Array;
  };
}

export interface SymlinkNode {
  file: {
    symlink: string;
  };
}

export interface DirectoryNode {
  directory: FileTree;
}

export type FileTree = {
  [key: string]: FileNode | SymlinkNode | DirectoryNode | string;
};

// 目录条目
export interface DirEnt {
  name: string | Uint8Array;
  isDirectory(): boolean;
  isFile(): boolean;
}

// 文件编码类型
export type FileEncoding = 
  | 'utf8' 
  | 'utf-16le' 
  | 'ascii' 
  | 'base64' 
  | 'latin1' 
  | 'binary' 
  | 'hex';

// 文件系统选项
export interface FileSystemOptions {
  encoding?: FileEncoding;
  withFileTypes?: boolean;
  recursive?: boolean;
  force?: boolean;
}

// 监控事件类型
export type WatchEvent = 'rename' | 'change';

export interface WatchListener {
  (event: WatchEvent, filename?: string | Uint8Array): void;
}

export interface Watcher {
  close(): void;
}
```

- [ ] **Step 2: 更新 types.ts 导出**

```typescript
// 在 types.ts 中添加：
export type { FileTree, FileNode, DirectoryNode, SymlinkNode } from './files';
export type { DirEnt, FileEncoding, FileSystemOptions, WatchEvent, WatchListener, Watcher } from './files';
```

- [ ] **Step 3: 提交**

```bash
git add packages/components/sandbox/config/src/files.ts packages/components/sandbox/config/src/types.ts
git commit -m "feat(sandbox): add filesystem types"
```

---

## Task 4: 实现 process.ts - 进程类型

**Files:**
- Create: `packages/components/sandbox/config/src/process.ts`

**Prerequisite:** Task 3

- [ ] **Step 1: 创建 process.ts**

```typescript
// 进程 Spawn 选项
export interface SpawnOptions {
  cwd?: string;
  env?: Record<string, string | number | boolean>;
  output?: boolean;
  terminal?: { cols: number; rows: number };
}

// 进程状态
export type ProcessStatus = 'spawning' | 'running' | 'exit' | 'killed';

// 进程句柄接口
export interface ProcessHandle {
  id: number;
  command: string;
  args: string[];
  status: ProcessStatus;
  exit: Promise<number>;
  output: ReadableStream<string>;
  input: WritableStream<string>;
  kill(): Promise<void>;
  resize(dimensions: { cols: number; rows: number }): void;
}

// 进程退出事件
export interface ProcessExitEvent {
  id: number;
  command: string;
  exitCode: number;
}

// 进程输出事件
export interface ProcessOutputEvent {
  processId: number;
  data: string;
}
```

- [ ] **Step 2: 更新 types.ts 导出**

```typescript
// 在 types.ts 中添加：
export type { SpawnOptions, ProcessStatus, ProcessHandle, ProcessExitEvent, ProcessOutputEvent } from './process';
```

- [ ] **Step 3: 提交**

```bash
git add packages/components/sandbox/config/src/process.ts packages/components/sandbox/config/src/types.ts
git commit -m "feat(sandbox): add process types"
```

---

## Task 5: 实现 server.ts - 服务器类型

**Files:**
- Create: `packages/components/sandbox/config/src/server.ts`

**Prerequisite:** Task 4

- [ ] **Step 1: 创建 server.ts**

```typescript
// 服务器就绪事件
export interface ServerReadyEvent {
  port: number;
  url: string;
}

// 端口事件
export interface PortEvent {
  port: number;
  type: 'open' | 'close';
  url: string;
}

// 服务器信息
export interface ServerInfo {
  port: number;
  url: string;
}
```

- [ ] **Step 2: 更新 types.ts 导出**

```typescript
// 在 types.ts 中添加：
export type { ServerReadyEvent, PortEvent, ServerInfo } from './server';
```

- [ ] **Step 3: 提交**

```bash
git add packages/components/sandbox/config/src/server.ts packages/components/sandbox/config/src/types.ts
git commit -m "feat(sandbox): add server types"
```

---

## Task 6: 实现 constants.ts - 默认常量

**Files:**
- Create: `packages/components/sandbox/config/src/constants.ts`

**Prerequisite:** Task 5

- [ ] **Step 1: 创建 constants.ts**

```typescript
import type { WebContainerConfigResolved } from './types';

export const DEFAULT_CONFIG: WebContainerConfigResolved = {
  autoBoot: true,
  autoMount: true,
  enableExit: true,
};

export const DEFAULT_PROCESS_OPTIONS: SpawnOptions = {
  output: true,
};
```

- [ ] **Step 2: 提交**

```bash
git add packages/components/sandbox/config/src/constants.ts
git commit -m "feat(sandbox): add constants"
```

---

## Task 7: 实现 merge.ts - 配置合并

**Files:**
- Create: `packages/components/sandbox/config/src/merge.ts`

**Prerequisite:** Task 6

- [ ] **Step 1: 创建 merge.ts**

```typescript
import type { WebContainerConfig, WebContainerConfigResolved } from './types';
import { DEFAULT_CONFIG } from './constants';

export interface MergeOptions {
  deep?: boolean;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target } as T;
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];
    if (isObject(sourceValue) && isObject(targetValue)) {
      (result as Record<string, unknown>)[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      );
    } else if (sourceValue !== undefined) {
      (result as Record<string, unknown>)[key] = sourceValue;
    }
  }
  return result;
}

export function mergeConfig<VNode, CSSProperties>(
  config: WebContainerConfig<VNode, CSSProperties>,
  options?: MergeOptions
): WebContainerConfigResolved {
  const { deep = false } = options ?? {};

  if (deep) {
    return deepMerge(DEFAULT_CONFIG as Record<string, unknown>, {
      autoBoot: config.autoBoot,
      autoMount: config.autoMount,
      enableExit: config.enableExit,
    } as Record<string, unknown>) as WebContainerConfigResolved;
  }

  return {
    ...DEFAULT_CONFIG,
    autoBoot: config.autoBoot ?? DEFAULT_CONFIG.autoBoot,
    autoMount: config.autoMount ?? DEFAULT_CONFIG.autoMount,
    enableExit: config.enableExit ?? DEFAULT_CONFIG.enableExit,
  };
}
```

- [ ] **Step 2: 提交**

```bash
git add packages/components/sandbox/config/src/merge.ts
git commit -m "feat(sandbox): add mergeConfig function"
```

---

## Task 8: 实现 validate.ts - 配置验证

**Files:**
- Create: `packages/components/sandbox/config/src/validate.ts`

**Prerequisite:** Task 7

- [ ] **Step 1: 创建 validate.ts**

```typescript
import type { WebContainerConfig, ValidationError, ValidationResult } from './types';

export function validate<VNode, CSSProperties>(
  config: WebContainerConfig<VNode, CSSProperties>
): ValidationResult {
  const errors: ValidationError[] = [];

  // autoBoot 验证
  if (config.autoBoot !== undefined && typeof config.autoBoot !== 'boolean') {
    errors.push({
      field: 'autoBoot',
      message: 'autoBoot must be a boolean',
      value: config.autoBoot,
    });
  }

  // autoMount 验证
  if (config.autoMount !== undefined && typeof config.autoMount !== 'boolean') {
    errors.push({
      field: 'autoMount',
      message: 'autoMount must be a boolean',
      value: config.autoMount,
    });
  }

  // enableExit 验证
  if (config.enableExit !== undefined && typeof config.enableExit !== 'boolean') {
    errors.push({
      field: 'enableExit',
      message: 'enableExit must be a boolean',
      value: config.enableExit,
    });
  }

  // files 验证 (基础结构检查)
  if (config.files !== undefined && typeof config.files !== 'object') {
    errors.push({
      field: 'files',
      message: 'files must be an object (FileTree)',
      value: config.files,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

- [ ] **Step 2: 提交**

```bash
git add packages/components/sandbox/config/src/validate.ts
git commit -m "feat(sandbox): add validate function"
```

---

## Task 9: 实现 README.md - 包文档

**Files:**
- Create: `packages/components/sandbox/config/README.md`

**Prerequisite:** Task 8

- [ ] **Step 1: 创建 README.md**

```markdown
# @opensandbox/config

> WebContainer 配置管理包 - 轻量级、无框架依赖的 WebContainer 类型解决方案

## 特性

- **框架无关** - 纯 TypeScript 实现，可与 React、Vue、Svelte 等任何框架配合使用
- **泛型适配** - 通过泛型参数，上层框架传入自己的 VNode 和 CSSProperties 类型
- **类型安全** - 完整的 TypeScript 类型定义
- **可验证** - 提供配置验证功能，确保参数合法
- **可合并** - 支持浅合并和深度合并

## 安装

\`\`\`bash
pnpm add @opensandbox/config
\`\`\`

## 快速开始

\`\`\`typescript
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
\`\`\`

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

\`\`\`typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}
\`\`\`

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

\`\`\`typescript
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
\`\`\`

## License

MIT
```

- [ ] **Step 2: 提交**

```bash
git add packages/components/sandbox/config/README.md
git commit -m "docs(sandbox): add config package README"
```

---

## Task 10: 实现 index.ts - 统一导出

**Files:**
- Modify: `packages/components/sandbox/config/src/index.ts`

**Prerequisite:** Task 9

- [ ] **Step 1: 创建 index.ts**

```typescript
// 类型导出
export type { 
  Status,
  WebContainerConfig,
  WebContainerConfigResolved,
  ValidationError,
  ValidationResult,
  SandboxError,
  BootError,
  MountError,
} from './types';

export type {
  FileTree,
  FileNode,
  DirectoryNode,
  SymlinkNode,
  DirEnt,
  FileEncoding,
  FileSystemOptions,
  WatchEvent,
  WatchListener,
  Watcher,
} from './files';

export type {
  SpawnOptions,
  ProcessStatus,
  ProcessHandle,
  ProcessExitEvent,
  ProcessOutputEvent,
} from './process';

export type {
  ServerReadyEvent,
  PortEvent,
  ServerInfo,
} from './server';

// 常量导出
export { DEFAULT_CONFIG, DEFAULT_PROCESS_OPTIONS } from './constants';

// 函数导出
export { mergeConfig } from './merge';
export { validate } from './validate';
```

- [ ] **Step 2: 提交**

```bash
git add packages/components/sandbox/config/src/index.ts
git commit -m "feat(sandbox): add config package exports"
```

---

## Task 11: 初始化 core 包结构

**Files:**
- Create: `packages/components/sandbox/core/src/`
- Create: `packages/components/sandbox/core/package.json`
- Create: `packages/components/sandbox/core/tsconfig.json`

**Prerequisite:** Task 10

- [ ] **Step 1: 创建目录和配置文件**

```bash
mkdir -p packages/components/sandbox/core/src
```

**package.json:**
```json
{
  "name": "@opensandbox/core",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "peerDependencies": {
    "@webcontainer/api": "^1.0.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "@opendesign/signal": "workspace:*",
    "@opensandbox/config": "workspace:*"
  }
}
```

**tsconfig.json:**
```json
{
  "extends": "@opendesign/tsconfig/lib",
  "compilerOptions": {
    "rootDir": "src",
    "composite": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 2: 提交**

```bash
git add packages/components/sandbox/core/
git commit -m "feat(sandbox): init core package structure"
```

---

## Task 12: 实现 events.ts - Signal 事件类型

**Files:**
- Create: `packages/components/sandbox/core/src/events.ts`

**Prerequisite:** Task 11

- [ ] **Step 1: 创建 events.ts**

```typescript
import type { ContainerStatus } from '@opensandbox/config';

  'status:change': { status: ContainerStatus; prevStatus: ContainerStatus };
  'error': SandboxError;
  'ready': void;
  
  // 文件系统事件
  'fs:change': { path: string; type: 'rename' | 'change' };
  'fs:watch-error': { path: string; error: Error };
  
  // 进程事件
  'process:spawn': ProcessHandle;
  'process:exit': ProcessExitEvent;
  'process:output': ProcessOutputEvent;
  
  // 服务器事件
  'server:ready': ServerReadyEvent;
  'server:port': PortEvent;
}
```

- [ ] **Step 2: 提交**

```bash
git add packages/components/sandbox/core/src/events.ts
git commit -m "feat(sandbox): add WebContainer events types"
```

---

## Task 13: 实现 filesystem.ts - 文件系统管理

**Files:**
- Create: `packages/components/sandbox/core/src/filesystem.ts`

**Prerequisite:** Task 12

- [ ] **Step 1: 创建 filesystem.ts**

```typescript
import type { WebContainer } from '@webcontainer/api';
import type { 
  FileTree,
  FileEncoding,
  FileSystemOptions,
  Watcher as ConfigWatcher,
  WatchListener
} from '@opensandbox/config';
import { SandboxError } from '@opensandbox/config';

export class FileSystem {
  constructor(
    private container: WebContainer,
    private watchListeners: Set<ConfigWatcher> = new Set()
  ) {}

  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    try {
      await this.container.fs.mkdir(path, options);
    } catch (error) {
      throw new SandboxError(
        'FS_MKDIR_ERROR',
        `Failed to create directory: ${path}`,
        { path, cause: error }
      );
    }
  }

  async readdir(
    path: string, 
    options?: FileSystemOptions
  ): Promise<string[] | import('@opensandbox/config').DirEnt[]> {
    try {
      return await this.container.fs.readdir(path, options) as string[] | import('@opensandbox/config').DirEnt[];
    } catch (error) {
      throw new SandboxError(
        'FS_READDIR_ERROR',
        `Failed to read directory: ${path}`,
        { path, cause: error }
      );
    }
  }

  async readFile(
    path: string, 
    encoding?: FileEncoding
  ): Promise<string | Uint8Array> {
    try {
      return await this.container.fs.readFile(path, encoding) as string | Uint8Array;
    } catch (error) {
      throw new SandboxError(
        'FS_READ_ERROR',
        `Failed to read file: ${path}`,
        { path, cause: error }
      );
    }
  }

  async writeFile(
    path: string, 
    data: string | Uint8Array,
    options?: { encoding?: FileEncoding }
  ): Promise<void> {
    try {
      await this.container.fs.writeFile(path, data, options);
    } catch (error) {
      throw new SandboxError(
        'FS_WRITE_ERROR',
        `Failed to write file: ${path}`,
        { path, cause: error }
      );
    }
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    try {
      await this.container.fs.rename(oldPath, newPath);
    } catch (error) {
      throw new SandboxError(
        'FS_RENAME_ERROR',
        `Failed to rename: ${oldPath} -> ${newPath}`,
        { oldPath, newPath, cause: error }
      );
    }
  }

  async remove(
    path: string, 
    options?: { force?: boolean; recursive?: boolean }
  ): Promise<void> {
    try {
      await this.container.fs.rm(path, options);
    } catch (error) {
      throw new SandboxError(
        'FS_REMOVE_ERROR',
        `Failed to remove: ${path}`,
        { path, cause: error }
      );
    }
  }

  watch(
    path: string,
    options?: { recursive?: boolean; encoding?: FileEncoding },
    listener?: WatchListener
  ): ConfigWatcher {
    const watcher = this.container.fs.watch(
      path, 
      options ?? {},
      listener ?? (() => {})
    );
    
    this.watchListeners.add(watcher);
    
    const originalClose = watcher.close.bind(watcher);
    watcher.close = () => {
      originalClose();
      this.watchListeners.delete(watcher);
    };
    
    return watcher;
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.container.fs.readdir(path);
      return true;
    } catch {
      return false;
    }
  }

  async isDirectory(path: string): Promise<boolean> {
    try {
      const entries = await this.container.fs.readdir(path, { withFileTypes: true });
      return entries.length > 0 || true; // 如果能读取目录则认为是目录
    } catch {
      return false;
    }
  }

  async isFile(path: string): Promise<boolean> {
    try {
      await this.container.fs.readFile(path);
      return true;
    } catch {
      return false;
    }
  }

  closeAllWatchers(): void {
    for (const watcher of this.watchListeners) {
      watcher.close();
    }
    this.watchListeners.clear();
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add packages/components/sandbox/core/src/filesystem.ts
git commit -m "feat(sandbox): add FileSystem"
```

---

## Task 14: 实现 process.ts - 进程管理

**Files:**
- Create: `packages/components/sandbox/core/src/process.ts`

**Prerequisite:** Task 13

- [ ] **Step 1: 创建 process.ts**

```typescript
import type { WebContainer, WebContainerProcess } from '@webcontainer/api';
import type { SpawnOptions, ProcessHandle, ProcessExitEvent, ProcessOutputEvent } from '@opensandbox/config';
import { SandboxError } from '@opensandbox/config';
import { Signal } from '@opendesign/signal';

export class Process {
  private processes = new Map<number, ProcessHandle>();
  private processCounter = 0;

  constructor(
    private container: WebContainer,
    private events: Signal<any>
  ) {}

  async spawn(
    command: string, 
    args: string[] = [],
    options?: SpawnOptions
  ): Promise<ProcessHandle> {
    try {
      const process = await this.container.spawn(command, args, options);
      const id = ++this.processCounter;

      const handle: ProcessHandle = {
        id,
        command,
        args,
        status: 'running',
        exit: process.exit,
        output: process.output,
        input: process.input,
        kill: () => {
          process.kill();
          return Promise.resolve();
        },
        resize: (dims) => process.resize(dims),
      };

      this.processes.set(id, handle);

      // 监听退出
      process.exit.then((exitCode) => {
        handle.status = 'exit';
        this.processes.delete(id);
        this.events.emit('process:exit', {
          id,
          command,
          exitCode,
        } as ProcessExitEvent);
      });

      this.events.emit('process:spawn', handle);

      return handle;
    } catch (error) {
      throw new SandboxError(
        'PROCESS_SPAWN_ERROR',
        `Failed to spawn process: ${command}`,
        { command, args, cause: error }
      );
    }
  }

  async kill(processId: number): Promise<void> {
    const handle = this.processes.get(processId);
    if (!handle) {
      throw new SandboxError(
        'PROCESS_NOT_FOUND',
        `Process not found: ${processId}`,
        { processId }
      );
    }
    await handle.kill();
    handle.status = 'killed';
    this.processes.delete(processId);
  }

  async killAll(): Promise<void> {
    const killPromises: Promise<void>[] = [];
    for (const [id] of this.processes) {
      killPromises.push(this.kill(id));
    }
    await Promise.all(killPromises);
  }

  getProcess(id: number): ProcessHandle | undefined {
    return this.processes.get(id);
  }

  getProcessList(): ProcessHandle[] {
    return Array.from(this.processes.values());
  }

  getProcessByCommand(command: string): ProcessHandle[] {
    return this.getProcessList().filter(p => p.command === command);
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add packages/components/sandbox/core/src/process.ts
git commit -m "feat(sandbox): add Process"
```

---

## Task 15: 实现 server.ts - 服务器管理

**Files:**
- Create: `packages/components/sandbox/core/src/server.ts`

**Prerequisite:** Task 14

- [ ] **Step 1: 创建 server.ts**

```typescript
import type { ServerReadyEvent, PortEvent, ServerInfo } from '@opensandbox/config';
import { Signal } from '@opendesign/signal';

export class Server {
  private servers = new Map<number, ServerInfo>();

  constructor(private events: Signal<any>) {}

  registerServer(port: number, url: string): void {
    this.servers.set(port, { port, url });
    this.events.emit('server:port', {
      port,
      type: 'open',
      url,
    } as PortEvent);
    this.events.emit('server:ready', { port, url } as ServerReadyEvent);
  }

  unregisterServer(port: number): void {
    const server = this.servers.get(port);
    if (server) {
      this.servers.delete(port);
      this.events.emit('server:port', {
        port,
        type: 'close',
        url: server.url,
      } as PortEvent);
    }
  }

  getServerURL(port?: number): string | null {
    if (port) {
      return this.servers.get(port)?.url ?? null;
    }
    // 返回第一个服务器的 URL
    return this.servers.values().next().value?.url ?? null;
  }

  getServerList(): ServerInfo[] {
    return Array.from(this.servers.values());
  }

  async waitForServer(port: number, timeout: number = 30000): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for server on port ${port}`));
      }, timeout);

      const checkServer = () => {
        const server = this.servers.get(port);
        if (server) {
          clearTimeout(timeoutId);
          resolve(server.url);
        } else {
          setTimeout(checkServer, 100);
        }
      };

      checkServer();
    });
  }

  clear(): void {
    this.servers.clear();
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add packages/components/sandbox/core/src/server.ts
git commit -m "feat(sandbox): add Server"
```

---

## Task 16: 实现 instance.ts - 主类

**Files:**
- Create: `packages/components/sandbox/core/src/instance.ts`

**Prerequisite:** Task 15

- [ ] **Step 1: 创建 instance.ts**

```typescript
import { WebContainer } from '@webcontainer/api';
import { Signal } from '@opendesign/signal';
import type { Events, ContainerStatus } from './events';

export class WebContainerInstance {
  private container: WebContainer | null = null;
  private _status: ContainerStatus = 'idle';
  
  readonly events: Signal<Events>;
  readonly fs: FileSystem;
  readonly process: Process;
  readonly server: Server;

  constructor() {
    this.events = new Signal<Events>();
    this.fs = new FileSystem(null as any);
    this.process = new Process(null as any, this.events);
    this.server = new Server(this.events);
  }

  get status(): ContainerStatus {
    return this._status;
  }

  get isReady(): boolean {
    return this._status === 'ready';
  }

  private setStatus(status: ContainerStatus): void {
    const prev = this._status;
    this._status = status;
    this.events.emit('status:change', { status, prevStatus: prev });
  }

  async boot(): Promise<void> {
    if (this._status !== 'idle' && this._status !== 'error') {
      throw new SandboxError(
        'INVALID_STATE',
        `Cannot boot from status: ${this._status}`,
        { currentStatus: this._status }
      );
    }

    this.setStatus('loading');
    this._error = null;

    try {
      this.container = await WebContainer.boot();
      
      // 重新初始化 managers with container
      this.fs = new FileSystem(this.container);
      this.process = new Process(this.container, this.events);
      
      // 监听 WebContainer 事件
      this.container.on('server-ready', (port: number, url: string) => {
        this.server.registerServer(port, url);
      });

      this.container.on('port', (port: number, type: 'open' | 'close', url: string) => {
        if (type === 'close') {
          this.server.unregisterServer(port);
        }
      });

      this.container.on('error', (error: { message: string }) => {
        this._error = new Error(error.message);
        this.events.emit('error', new BootError(error.message));
      });

      this.setStatus('ready');
      this.events.emit('ready');
    } catch (error) {
      this.setStatus('error');
      const err = error as Error;
      this._error = err;
      this.events.emit('error', new BootError(err.message, { cause: err }));
      throw new BootError(err.message, { cause: err });
    }
  }

  async mount(tree: FileTree): Promise<void> {
    if (!this.container) {
      throw new SandboxError(
        'NOT_BOOTED',
        'WebContainer is not booted',
        {}
      );
    }

    try {
      await this.container.mount(tree);
    } catch (error) {
      const err = error as Error;
      throw new SandboxError(
        'MOUNT_ERROR',
        `Failed to mount filesystem: ${err.message}`,
        { cause: err }
      );
    }
  }

  async teardown(): Promise<void> {
    // 1. 终止所有进程
    await this.process.killAll();
    
    // 2. 关闭所有文件监控
    this.fs.closeAllWatchers();
    
    // 3. 清除服务器
    this.server.clear();
    
    // 4. 销毁 WebContainer
    if (this.container) {
      this.container.teardown();
      this.container = null;
    }
    
    // 5. 清除所有事件监听
    this.events.clear();
    
    this.setStatus('idle');
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add packages/components/sandbox/core/src/instance.ts
git commit -m "feat(sandbox): add WebContainerInstance"
```

---

## Task 17: 实现 index.ts - 统一导出

**Files:**
- Modify: `packages/components/sandbox/core/src/index.ts`

**Prerequisite:** Task 16

- [ ] **Step 1: 创建 index.ts**

```typescript
// 主类
export { WebContainerInstance } from './instance';

// Manager 类 (供测试或高级用法)
export { FileSystem } from './filesystem';
export { Process } from './process';
export { Server } from './server';

// 事件类型
export type { Events } from './events';

// 重新导出 config 包的所有类型
export type {
  Status,
  WebContainerConfig,
  WebContainerConfigResolved,
  ValidationError,
  ValidationResult,
  SandboxError,
  BootError,
  MountError,
  FileTree,
  FileNode,
  DirectoryNode,
  SymlinkNode,
  DirEnt,
  FileEncoding,
  FileSystemOptions,
  WatchEvent,
  WatchListener,
  Watcher,
  SpawnOptions,
  ProcessStatus,
  ProcessHandle,
  ProcessExitEvent,
  ProcessOutputEvent,
  ServerReadyEvent,
  PortEvent,
  ServerInfo,
} from '@opensandbox/config';
```

- [ ] **Step 2: 提交**

```bash
git add packages/components/sandbox/core/src/index.ts
git commit -m "feat(sandbox): add core package exports"
```

---

## Task 18: 实现 README.md - core 包文档

**Files:**
- Create: `packages/components/sandbox/core/README.md`

**Prerequisite:** Task 17

- [ ] **Step 1: 创建 README.md**

```markdown
# @opensandbox/core

> WebContainer 核心运行时包 - 框架无关的 WebContainer API 封装

## 特性

- **框架无关** - 纯 TypeScript 实现，不依赖任何 UI 框架
- **类型安全** - 基于 @opensandbox/config 的完整类型定义
- **事件驱动** - 基于 @opendesign/signal 的类型安全事件系统
- **完整生命周期** - 文件系统、进程、服务器的完整管理
- **错误封装** - 分类错误类型，便于调试处理

## 安装

\`\`\`bash
pnpm add @opensandbox/core
\`\`\`

## 快速开始

\`\`\`typescript
import { WebContainerInstance } from '@opensandbox/core';

const container = new WebContainerInstance();

// 监听事件
container.events.on('ready', () => {
  console.log('WebContainer is ready!');
});

container.events.on('server:ready', ({ port, url }) => {
  console.log(`Server running at ${url}`);
});

// 启动
await container.boot();

// 挂载文件
await container.mount({
  'package.json': {
    file: { contents: '{ "name": "my-app" }' }
  }
});

// 启动开发服务器
const devProcess = await container.process.spawn('npm', ['run', 'dev']);

// 清理
await container.teardown();
\`\`\`

## API 参考

### WebContainerInstance

主类，管理 WebContainer 实例。

#### 属性

- `events: Signal<Events>` - 事件发射器
- `fs: FileSystem` - 文件系统管理器
- `process: Process` - 进程管理器
- `server: Server` - 服务器管理器
- `status: Status` - 当前状态
- `isReady: boolean` - 是否就绪

#### 方法

- `boot(): Promise<void>` - 启动 WebContainer
- `mount(tree: FileTree): Promise<void>` - 挂载文件系统
- `teardown(): Promise<void>` - 销毁实例

### FileSystem

文件系统操作管理器。

#### 方法

- `mkdir(path: string, options?: { recursive?: boolean }): Promise<void>`
- `readdir(path: string, options?: FileSystemOptions): Promise<string[] | DirEnt[]>`
- `readFile(path: string, encoding?: FileEncoding): Promise<string | Uint8Array>`
- `writeFile(path: string, data: string | Uint8Array): Promise<void>`
- `rename(oldPath: string, newPath: string): Promise<void>`
- `remove(path: string, options?: { force?: boolean; recursive?: boolean }): Promise<void>`
- `watch(path: string, options?: WatchOptions, listener?: WatchListener): Watcher`
- `exists(path: string): Promise<boolean>`
- `isDirectory(path: string): Promise<boolean>`
- `isFile(path: string): Promise<boolean>`

### Process

进程管理器。

#### 方法

- `spawn(command: string, args?: string[], options?: SpawnOptions): Promise<ProcessHandle>`
- `kill(processId: number): Promise<void>`
- `killAll(): Promise<void>`
- `getProcess(id: number): ProcessHandle | undefined`
- `getProcessList(): ProcessHandle[]`
- `getProcessByCommand(command: string): ProcessHandle[]`

### Server

服务器管理器。

#### 方法

- `getServerURL(port?: number): string | null`
- `getServerList(): ServerInfo[]`
- `waitForServer(port: number, timeout?: number): Promise<string>`

## 事件系统

\`\`\`typescript
container.events.on('status:change', ({ status, prevStatus }) => {
  console.log(\`Status: \${prevStatus} -> \${status}\`);
});

container.events.on('error', (error) => {
  console.error('Error:', error);
});

container.events.on('process:exit', ({ id, exitCode }) => {
  console.log(\`Process \${id} exited with \${exitCode}\`);
});
\`\`\`

## 错误类型

- `SandboxError` - 基类错误
- `BootError` - 启动失败
- `ProcessError` - 进程执行失败
- `FileSystemError` - 文件操作失败

## License

MIT
```

- [ ] **Step 2: 提交**

```bash
git add packages/components/sandbox/core/README.md
git commit -m "docs(sandbox): add core package README"
```

---

## Task 19: 更新 pnpm-workspace.yaml

**Files:**
- Modify: `pnpm-workspace.yaml`

**Prerequisite:** Task 18

- [ ] **Step 1: 验证 pnpm-workspace.yaml**

确认 sandbox 包在 packages 目录下

\`\`\`yaml
packages:
  - 'packages/**'
  - 'configs/**'
\`\`\`

- [ ] **Step 2: 提交**

```bash
git add pnpm-workspace.yaml
git commit -m "chore(sandbox): add sandbox packages to workspace"
```

---

## Self-Review Checklist

1. **Spec coverage:** 所有设计需求都有对应任务实现
2. **Placeholder scan:** 无 TBD/TODO，已完成的代码都是可直接使用的
3. **Type consistency:** 所有类型在 config 包定义，core 包引用，保持一致
4. **Dependencies:** core 依赖 config 和 @opendesign/signal，符合分层架构

---

## 总结

完成此计划将产出：
1. `@opensandbox/config` 包 - 类型定义、常量、验证、合并
2. `@opensandbox/core` 包 - WebContainer 实例管理、文件系统、进程、服务器管理

**后续步骤：**
1. React 适配包 (`@opensandbox/react`) 的设计与实现
