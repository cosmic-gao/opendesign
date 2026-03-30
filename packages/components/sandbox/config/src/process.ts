export interface SpawnOptions {
  cwd?: string;
  env?: Record<string, string | number | boolean>;
  output?: boolean;
  terminal?: { cols: number; rows: number };
}

export type ProcessStatus = 'spawning' | 'running' | 'exit' | 'killed';

export interface ProcessHandle {
  id: number;
  command: string;
  args: string[];
  status: ProcessStatus;
  exit: Promise<number>;
  output: ReadableStream<string>;
  input: WritableStream<string>;
  kill(): void;
  resize(dimensions: { cols: number; rows: number }): void;
}

export interface ProcessExitEvent {
  id: number;
  command: string;
  exitCode: number;
}

export interface ProcessOutputEvent {
  processId: number;
  data: string;
}
