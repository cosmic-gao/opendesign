import type { FileTree } from './files';

export type ContainerStatus = 
  | 'idle' 
  | 'loading' 
  | 'ready' 
  | 'installing' 
  | 'booting' 
  | 'error';

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

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
