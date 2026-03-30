import type { WebContainerConfigResolved } from './types';
import type { SpawnOptions } from './process';

export const DEFAULT_CONFIG: WebContainerConfigResolved = {
  autoBoot: true,
  autoMount: true,
  enableExit: true,
};

export const DEFAULT_PROCESS_OPTIONS: SpawnOptions = {
  output: true,
};
