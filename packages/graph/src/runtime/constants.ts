export const SLOT_INPUT = 1;
export const SLOT_OUTPUT = 2;

export const EVENT = -1;
export const ACTION = -1;

export const ALWAYS = 0;
export const ON_EVENT = 1;
export const NEVER = 2;
export const ON_TRIGGER = 3;

export const STATUS_STOPPED = 1;
export const STATUS_RUNNING = 2;

export type NodeMode =
  | typeof ALWAYS
  | typeof ON_EVENT
  | typeof NEVER
  | typeof ON_TRIGGER;
