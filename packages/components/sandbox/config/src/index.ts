export type { 
  ContainerStatus,
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

export { DEFAULT_CONFIG, DEFAULT_PROCESS_OPTIONS } from './constants';

export { mergeConfig } from './merge';
export { validate } from './validate';
