import type { NodeMode } from './constants';

export interface InputSlot {
  name: string;
  type: string | number;
  link: number | string | null;
}

export interface OutputSlot {
  name: string;
  type: string | number;
  links: Array<number | string> | null;
  _data?: unknown;
}

export interface SerializedLinkTuple
  extends Array<number | string | null | undefined> {
  0: number | string;
  1: number | string;
  2: number;
  3: number | string;
  4: number;
  5: string | number | null | undefined;
}

export interface SerializedNode {
  id: number | string;
  type: string;
  pos: [number, number];
  size: [number, number];
  flags: Record<string, unknown>;
  order: number;
  mode: NodeMode;
  title?: string;
  inputs?: InputSlot[];
  outputs?: OutputSlot[];
  properties?: Record<string, unknown>;
  widgets_values?: unknown[];
  color?: string;
  bgcolor?: string;
  boxcolor?: string;
  shape?: number | string;
}

export interface SerializedGroup {
  title?: string;
}

export interface SerializedGraph {
  last_node_id: number;
  last_link_id: number;
  nodes: SerializedNode[];
  links: SerializedLinkTuple[];
  groups: SerializedGroup[];
  config: Record<string, unknown>;
  extra: Record<string, unknown>;
  version: number;
}

export interface TriggerOptions {
  action_call?: string;
}
