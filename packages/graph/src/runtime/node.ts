import { ALWAYS, ON_TRIGGER, SLOT_INPUT, SLOT_OUTPUT } from './constants';
import type { NodeMode } from './constants';
import { cloneValue } from './clone';
import type { TriggerOptions } from './contracts';
import type { InputSlot, OutputSlot, SerializedNode } from './contracts';
import type { LGraph } from './graph';
import { LiteGraph } from './litegraph';

const randomId = (): string => Math.floor(Math.random() * 9999).toString();

export class LGraphNode {
  public id: number | string;
  public type: string | null;
  public title: string;
  public size: [number, number];
  public pos: [number, number];
  public graph: LGraph | null;
  public mode: NodeMode = ALWAYS;
  public order = 0;
  public flags: Record<string, unknown>;
  public color?: string;
  public bgcolor?: string;
  public boxcolor?: string;
  public shape?: number | string;
  public inputs: InputSlot[];
  public outputs: OutputSlot[];
  public properties: Record<string, unknown>;
  public properties_info: Array<Record<string, unknown>>;
  public widgets?: Array<{ value: unknown; options?: { property?: string } }>;
  public serialize_widgets?: boolean;
  public has_errors?: boolean;
  public last_serialization?: SerializedNode;
  public execute_triggered = 0;
  public action_triggered = 0;
  public exec_version = 0;
  public action_call?: string;
  public _waiting_actions?: Array<
    [string | undefined, unknown, TriggerOptions, number?]
  >;
  public constructor(title?: string) {
    this.title = title ?? 'Unnamed';
    this.size = [LiteGraph.NODE_WIDTH, 60];
    this.pos = [10, 10];
    this.graph = null;
    this.id = -1;
    this.type = null;
    this.inputs = [];
    this.outputs = [];
    this.properties = {};
    this.properties_info = [];
    this.flags = {};
  }

  public addInput(name: string, type: string | number): number {
    this.inputs.push({ name, type, link: null });
    return this.inputs.length - 1;
  }

  public addOutput(name: string, type: string | number): number {
    this.outputs.push({ name, type, links: null });
    return this.outputs.length - 1;
  }

  public findInputSlot(name: string): number {
    return this.inputs.findIndex((slot) => slot.name === name);
  }

  public findOutputSlot(name: string): number {
    return this.outputs.findIndex((slot) => slot.name === name);
  }

  public connect(
    slot: number,
    targetNode: LGraphNode,
    targetSlot: number,
  ): number | string | null {
    if (!this.graph || this.graph !== targetNode.graph) {
      return null;
    }
    return this.graph.connect(this, slot, targetNode, targetSlot);
  }

  public disconnectInput(slot: number): void {
    if (!this.graph) {
      return;
    }
    this.graph.disconnectInput(this, slot);
  }

  public getInputData(slot: number, forceUpdate = false): unknown {
    const input = this.inputs[slot];
    if (!input || input.link == null || !this.graph) {
      return undefined;
    }

    const link = this.graph.links[String(input.link)];
    if (!link) {
      return null;
    }
    if (!forceUpdate) {
      return link.data;
    }

    const node = this.graph.getNodeById(link.origin_id);
    if (!node) {
      return link.data;
    }
    if (typeof node.onExecute === 'function') {
      node.onExecute();
    }
    return link.data;
  }

  public setOutputData(slot: number, data: unknown): void {
    const output = this.outputs[slot];
    if (!output || !this.graph) {
      return;
    }
    output._data = data;
    if (!output.links) {
      return;
    }
    for (const linkId of output.links) {
      const link = this.graph.links[String(linkId)];
      if (link) {
        link.data = data;
      }
    }
  }

  public doExecute(param?: unknown, options: TriggerOptions = {}): void {
    if (!this.onExecute || !this.graph) {
      return;
    }

    if (!options.action_call) {
      options.action_call = `${String(this.id)}_exec_${randomId()}`;
    }
    this.graph.nodes_executing[String(this.id)] = true;
    this.onExecute(param, options);
    this.graph.nodes_executing[String(this.id)] = false;
    this.exec_version = this.graph.iteration;
    this.action_call = options.action_call;
    this.graph.nodes_executedAction[String(this.id)] = options.action_call;
    this.execute_triggered = 2;
  }

  public actionDo(
    action: string | undefined,
    param?: unknown,
    options: TriggerOptions = {},
    actionSlot?: number,
  ): void {
    if (!this.onAction || !this.graph) {
      return;
    }
    if (!options.action_call) {
      options.action_call = `${String(this.id)}_${action ?? 'action'}_${randomId()}`;
    }
    this.graph.nodes_actioning[String(this.id)] = action ?? 'actioning';
    this.onAction(action, param, options, actionSlot);
    this.graph.nodes_actioning[String(this.id)] = false;
    this.action_call = options.action_call;
    this.graph.nodes_executedAction[String(this.id)] = options.action_call;
    this.action_triggered = 2;
  }

  public trigger(
    action?: string,
    param?: unknown,
    options: TriggerOptions = {},
  ): void {
    if (!this.outputs.length) {
      return;
    }
    if (this.graph) {
      this.graph._last_trigger_time = Date.now();
    }
    for (let i = 0; i < this.outputs.length; i += 1) {
      const output = this.outputs[i];
      if (!output || output.type !== LiteGraph.EVENT) {
        continue;
      }
      if (action && output.name !== action) {
        continue;
      }
      this.triggerSlot(i, param, undefined, options);
    }
  }

  public triggerSlot(
    slot: number,
    param?: unknown,
    linkId?: number | string,
    options: TriggerOptions = {},
  ): void {
    if (!this.graph) {
      return;
    }
    const output = this.outputs[slot];
    if (!output?.links?.length) {
      return;
    }

    for (const currentId of output.links) {
      if (linkId != null && linkId !== currentId) {
        continue;
      }
      const linkInfo = this.graph.links[String(currentId)];
      if (!linkInfo) {
        continue;
      }
      const targetNode = this.graph.getNodeById(linkInfo.target_id);
      if (!targetNode) {
        continue;
      }
      const targetConnection = targetNode.inputs[linkInfo.target_slot];
      if (targetNode.mode === ON_TRIGGER) {
        if (!options.action_call) {
          options.action_call = `${String(this.id)}_trigg_${randomId()}`;
        }
        if (typeof targetNode.onExecute === 'function') {
          targetNode.doExecute(param, options);
        }
        continue;
      }

      if (typeof targetNode.onAction !== 'function') {
        continue;
      }
      if (!options.action_call) {
        options.action_call = `${String(this.id)}_act_${randomId()}`;
      }
      if (LiteGraph.use_deferred_actions && typeof targetNode.onExecute === 'function') {
        if (!targetNode._waiting_actions) {
          targetNode._waiting_actions = [];
        }
        targetNode._waiting_actions.push([
          targetConnection?.name,
          param,
          options,
          linkInfo.target_slot,
        ]);
        continue;
      }
      targetNode.actionDo(targetConnection?.name, param, options, linkInfo.target_slot);
    }
  }

  public executePendingActions(): void {
    if (!this._waiting_actions?.length) {
      return;
    }
    for (const action of this._waiting_actions) {
      this.onAction?.(action[0], action[1], action[2], action[3]);
    }
    this._waiting_actions = [];
  }

  public configure(info: SerializedNode): void {
    for (const [key, value] of Object.entries(info)) {
      if (key === 'properties' && value && typeof value === 'object') {
        const propEntries = Object.entries(value as Record<string, unknown>);
        for (const [propKey, propValue] of propEntries) {
          this.properties[propKey] = propValue;
          this.onPropertyChanged?.(propKey, propValue);
        }
        continue;
      }
      if (value == null) {
        continue;
      }
      (this as unknown as Record<string, unknown>)[key] = cloneValue(value);
    }

    if (!info.title && this.constructor && 'title' in this.constructor) {
      const ctorTitle = (this.constructor as { title?: string }).title;
      if (ctorTitle) {
        this.title = ctorTitle;
      }
    }

    if (this.inputs.length) {
      for (let i = 0; i < this.inputs.length; i += 1) {
        const input = this.inputs[i];
        const linkInfo = input ? this.graph?.links[String(input.link)] : undefined;
        if (input) {
          this.onConnectionsChange?.(SLOT_INPUT, i, true, linkInfo, input);
        }
      }
    }
    if (this.outputs.length) {
      for (let i = 0; i < this.outputs.length; i += 1) {
        const output = this.outputs[i];
        if (!output?.links) {
          continue;
        }
        for (const outLinkId of output.links) {
          const linkInfo = this.graph?.links[String(outLinkId)];
          this.onConnectionsChange?.(SLOT_OUTPUT, i, true, linkInfo, output);
        }
      }
    }

    this.onConfigure?.(info);
  }

  public serialize(): SerializedNode {
    if (this.constructor === LGraphNode && this.last_serialization) {
      return this.last_serialization;
    }

    const data: SerializedNode = {
      id: this.id,
      type: this.type ?? '',
      pos: [this.pos[0], this.pos[1]],
      size: [this.size[0], this.size[1]],
      flags: cloneValue(this.flags),
      order: this.order,
      mode: this.mode,
    };

    if (this.inputs.length) {
      data.inputs = cloneValue(this.inputs);
    }
    if (this.outputs.length) {
      const outputs = cloneValue(this.outputs);
      for (const output of outputs) {
        delete output._data;
      }
      data.outputs = outputs;
    }
    if (this.title && this.title !== (this.constructor as { title?: string }).title) {
      data.title = this.title;
    }
    if (Object.keys(this.properties).length) {
      data.properties = cloneValue(this.properties);
    }
    if (this.widgets && this.serialize_widgets) {
      data.widgets_values = this.widgets.map((widget) => widget.value);
    }
    if (!data.type) {
      data.type = (this.constructor as { type?: string }).type ?? '';
    }
    if (this.color) {
      data.color = this.color;
    }
    if (this.bgcolor) {
      data.bgcolor = this.bgcolor;
    }
    if (this.boxcolor) {
      data.boxcolor = this.boxcolor;
    }
    if (this.shape) {
      data.shape = this.shape;
    }
    this.onSerialize?.(data);
    return data;
  }
}

export interface LGraphNode {
  onExecute?: (param?: unknown, options?: TriggerOptions) => void;
  onAction?: (
    action: string | undefined,
    param?: unknown,
    options?: TriggerOptions,
    action_slot?: number,
  ) => void;
  onSerialize?: (data: SerializedNode) => void;
  onConfigure?: (data: SerializedNode) => void;
  onPropertyChanged?: (name: string, value: unknown) => void;
  onConnectionsChange?: (
    type: number,
    slot: number,
    isConnected: boolean,
    linkInfo: unknown,
    ioSlot: InputSlot | OutputSlot,
  ) => void;
}
