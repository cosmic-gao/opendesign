import {
  ALWAYS,
  SLOT_INPUT,
  SLOT_OUTPUT,
  STATUS_RUNNING,
  STATUS_STOPPED,
} from './constants';
import { cloneValue } from './clone';
import type { SerializedGraph, SerializedLinkTuple, TriggerOptions } from './contracts';
import { LLink } from './link';
import { LiteGraph } from './litegraph';
import { LGraphNode } from './node';

type GraphNodeMap = Record<string, LGraphNode>;

interface GlobalIO {
  name: string;
  type: string;
  value: unknown;
}

interface TimerHandle {
  stop: () => void;
}

export class LGraph {
  public status = STATUS_STOPPED;
  public last_node_id = 0;
  public last_link_id = 0;
  public links: Record<string, LLink> = {};
  public config: Record<string, unknown> = {};
  public vars: Record<string, unknown> = {};
  public extra: Record<string, unknown> = {};
  public globaltime = 0;
  public runningtime = 0;
  public fixedtime = 0;
  public fixedtime_lapse = 0.01;
  public elapsed_time = 0.01;
  public last_update_time = 0;
  public starttime = 0;
  public execution_time = 0;
  public iteration = 0;
  public catch_errors = true;
  public nodes_executing: Record<string, boolean> = {};
  public nodes_actioning: Record<string, string | boolean> = {};
  public nodes_executedAction: Record<string, string> = {};
  public _last_trigger_time = 0;
  public readonly inputs: Record<string, GlobalIO> = {};
  public readonly outputs: Record<string, GlobalIO> = {};
  public onPlayEvent?: () => void;
  public onStopEvent?: () => void;
  public onBeforeStep?: () => void;
  public onAfterStep?: () => void;
  public onExecuteStep?: () => void;
  public onAfterExecute?: () => void;
  public onSerialize?: (data: SerializedGraph) => void;
  public onConfigure?: (data: SerializedGraph) => void;
  public onTrigger?: (action: string, param?: unknown) => void;
  public onInputAdded?: (name: string, type: string) => void;
  public onInputRenamed?: (oldName: string, newName: string) => void;
  public onInputTypeChanged?: (name: string, type: string) => void;
  public onInputRemoved?: (name: string) => void;
  public onOutputAdded?: (name: string, type: string) => void;
  public onOutputRenamed?: (oldName: string, newName: string) => void;
  public onOutputTypeChanged?: (name: string, type: string) => void;
  public onOutputRemoved?: (name: string) => void;
  public onNodeConnectionChange?: (
    type: number,
    node: LGraphNode,
    slot: number,
    targetNode: LGraphNode,
    targetSlot: number,
  ) => void;

  private _nodes: LGraphNode[] = [];
  private _nodes_by_id: GraphNodeMap = {};
  private _nodes_in_order: LGraphNode[] = [];
  private _nodes_executable: LGraphNode[] = [];
  private execution_timer: TimerHandle | null = null;

  public constructor(o?: SerializedGraph) {
    this.clear();
    if (o) {
      this.configure(o);
    }
  }

  public clear(): void {
    this.stop();
    this.status = STATUS_STOPPED;
    this.last_node_id = 0;
    this.last_link_id = 0;
    this._nodes = [];
    this._nodes_by_id = {};
    this._nodes_in_order = [];
    this._nodes_executable = [];
    this.links = {};
    this.iteration = 0;
    this.config = {};
    this.vars = {};
    this.extra = {};
    this.globaltime = 0;
    this.runningtime = 0;
    this.fixedtime = 0;
    this.elapsed_time = 0.01;
    this.last_update_time = 0;
    this.starttime = 0;
    this.execution_time = 0;
    this.nodes_executing = {};
    this.nodes_actioning = {};
    this.nodes_executedAction = {};
    this._last_trigger_time = 0;
    for (const key of Object.keys(this.inputs)) {
      delete this.inputs[key];
    }
    for (const key of Object.keys(this.outputs)) {
      delete this.outputs[key];
    }
  }

  public add(node: LGraphNode, skipComputeOrder = false): void {
    if (this._nodes.length >= LiteGraph.MAX_NUMBER_OF_NODES) {
      throw new Error('LiteGraph: max number of nodes in a graph reached');
    }
    if (node.id !== -1 && this._nodes_by_id[String(node.id)]) {
      node.id = ++this.last_node_id;
    }
    if (node.id === -1) {
      node.id = ++this.last_node_id;
    }
    node.graph = this;
    this._nodes.push(node);
    this._nodes_by_id[String(node.id)] = node;
    if (!skipComputeOrder) {
      this.updateExecutionOrder();
    }
    node.onAdded?.();
  }

  public remove(node: LGraphNode): void {
    if (!this._nodes_by_id[String(node.id)]) {
      return;
    }
    for (let i = node.inputs.length - 1; i >= 0; i -= 1) {
      this.disconnectInput(node, i);
    }
    for (let i = node.outputs.length - 1; i >= 0; i -= 1) {
      const output = node.outputs[i];
      if (!output?.links?.length) {
        continue;
      }
      for (const linkId of [...output.links]) {
        this.removeLink(linkId);
      }
    }
    delete this._nodes_by_id[String(node.id)];
    this._nodes = this._nodes.filter((candidate) => candidate !== node);
    node.graph = null;
    this.updateExecutionOrder();
    node.onRemoved?.();
  }

  public getNodeById(id: number | string): LGraphNode | null {
    return this._nodes_by_id[String(id)] ?? null;
  }

  public connect(
    originNode: LGraphNode,
    originSlot: number,
    targetNode: LGraphNode,
    targetSlot: number,
  ): number | string | null {
    const output = originNode.outputs[originSlot];
    const input = targetNode.inputs[targetSlot];
    if (!output || !input) {
      return null;
    }

    if (input.link != null) {
      this.disconnectInput(targetNode, targetSlot);
    }

    const linkId = ++this.last_link_id;
    const link = new LLink(
      linkId,
      output.type,
      originNode.id,
      originSlot,
      targetNode.id,
      targetSlot,
    );
    this.links[String(linkId)] = link;

    if (!output.links) {
      output.links = [];
    }
    output.links.push(linkId);
    input.link = linkId;
    originNode.onConnectionsChange?.(SLOT_OUTPUT, originSlot, true, link, output);
    targetNode.onConnectionsChange?.(SLOT_INPUT, targetSlot, true, link, input);
    this.onNodeConnectionChange?.(
      SLOT_OUTPUT,
      originNode,
      originSlot,
      targetNode,
      targetSlot,
    );
    this.updateExecutionOrder();
    return linkId;
  }

  public disconnectInput(node: LGraphNode, slot: number): void {
    const input = node.inputs[slot];
    if (!input || input.link == null) {
      return;
    }
    this.removeLink(input.link);
  }

  public removeLink(linkId: number | string): void {
    const link = this.links[String(linkId)];
    if (!link) {
      return;
    }
    const originNode = this.getNodeById(link.origin_id);
    const targetNode = this.getNodeById(link.target_id);
    if (originNode) {
      const output = originNode.outputs[link.origin_slot];
      if (output?.links) {
        output.links = output.links.filter((current) => current !== link.id);
        if (!output.links.length) {
          output.links = null;
        }
        originNode.onConnectionsChange?.(
          SLOT_OUTPUT,
          link.origin_slot,
          false,
          link,
          output,
        );
      }
    }
    if (targetNode) {
      const input = targetNode.inputs[link.target_slot];
      if (input) {
        input.link = null;
        targetNode.onConnectionsChange?.(SLOT_INPUT, link.target_slot, false, link, input);
      }
    }
    if (originNode && targetNode) {
      this.onNodeConnectionChange?.(
        SLOT_INPUT,
        targetNode,
        link.target_slot,
        originNode,
        link.origin_slot,
      );
    }
    delete this.links[String(linkId)];
    this.updateExecutionOrder();
  }

  public start(interval = 0): void {
    if (this.status === STATUS_RUNNING) {
      return;
    }
    this.status = STATUS_RUNNING;
    this.onPlayEvent?.();
    this.sendEventToAllNodes('onStart');
    this.starttime = Date.now();
    this.last_update_time = this.starttime;

    this.execution_timer = this.createTimer(interval);
  }

  public stop(): void {
    if (this.status === STATUS_STOPPED) {
      return;
    }
    this.status = STATUS_STOPPED;
    this.onStopEvent?.();
    this.execution_timer?.stop();
    this.execution_timer = null;
    this.sendEventToAllNodes('onStop');
  }

  public runStep(
    num = 1,
    doNotCatchErrors = false,
    limit?: number,
  ): void {
    const start = Date.now();
    this.globaltime = (start - this.starttime) * 0.001;
    const nodes = this._nodes_executable.length ? this._nodes_executable : this._nodes;
    const max = limit ?? nodes.length;

    const execute = (): void => {
      for (let i = 0; i < num; i += 1) {
        for (let j = 0; j < max; j += 1) {
          const node = nodes[j];
          if (!node) {
            continue;
          }
          if (LiteGraph.use_deferred_actions && node._waiting_actions?.length) {
            node.executePendingActions();
          }
          if (node.mode === ALWAYS && node.onExecute) {
            node.doExecute();
          }
        }
        this.fixedtime += this.fixedtime_lapse;
        this.onExecuteStep?.();
      }
      this.onAfterExecute?.();
    };

    if (doNotCatchErrors) {
      execute();
    } else {
      try {
        execute();
      } catch (error) {
        if (LiteGraph.throw_errors) {
          throw error;
        }
        this.stop();
      }
    }

    const now = Date.now();
    const elapsed = Math.max(now - start, 1);
    this.execution_time = elapsed * 0.001;
    this.globaltime += elapsed * 0.001;
    this.iteration += 1;
    this.elapsed_time = (now - this.last_update_time) * 0.001;
    this.last_update_time = now;
    this.nodes_executing = {};
    this.nodes_actioning = {};
    this.nodes_executedAction = {};
  }

  public updateExecutionOrder(): void {
    this._nodes_in_order = this.computeExecutionOrder(false);
    this._nodes_executable = this._nodes_in_order.filter((node) => !!node.onExecute);
  }

  public computeExecutionOrder(onlyOnExecute = false): LGraphNode[] {
    const pending = new Map<number | string, LGraphNode>();
    const incomingCount = new Map<number | string, number>();
    const queue: LGraphNode[] = [];
    const visitedLinks = new Set<number | string>();
    const ordered: LGraphNode[] = [];

    for (const node of this._nodes) {
      if (onlyOnExecute && !node.onExecute) {
        continue;
      }
      pending.set(node.id, node);
      let count = 0;
      for (const input of node.inputs) {
        if (input.link != null) {
          count += 1;
        }
      }
      incomingCount.set(node.id, count);
      if (count === 0) {
        queue.push(node);
      }
    }

    while (queue.length) {
      const node = queue.shift();
      if (!node) {
        continue;
      }
      ordered.push(node);
      pending.delete(node.id);
      for (const output of node.outputs) {
        if (!output?.links?.length) {
          continue;
        }
        for (const linkId of output.links) {
          if (visitedLinks.has(linkId)) {
            continue;
          }
          visitedLinks.add(linkId);
          const link = this.links[String(linkId)];
          if (!link) {
            continue;
          }
          const left = (incomingCount.get(link.target_id) ?? 0) - 1;
          incomingCount.set(link.target_id, left);
          if (left === 0) {
            const target = this.getNodeById(link.target_id);
            if (target) {
              queue.push(target);
            }
          }
        }
      }
    }

    for (const node of pending.values()) {
      ordered.push(node);
    }

    for (let i = 0; i < ordered.length; i += 1) {
      ordered[i]!.order = i;
    }

    ordered.sort((a, b) => {
      const ap = (a.constructor as { priority?: number }).priority ?? 0;
      const bp = (b.constructor as { priority?: number }).priority ?? 0;
      if (ap === bp) {
        return a.order - b.order;
      }
      return ap - bp;
    });

    for (let i = 0; i < ordered.length; i += 1) {
      ordered[i]!.order = i;
    }

    return ordered;
  }

  public sendEventToAllNodes(
    eventName: keyof LGraphNode | string,
    params?: unknown[] | unknown,
    mode = ALWAYS,
  ): void {
    const nodes = this._nodes_in_order.length ? this._nodes_in_order : this._nodes;
    for (const node of nodes) {
      if (node.mode !== mode) {
        continue;
      }
      const handler = (node as unknown as Record<string, unknown>)[eventName];
      if (typeof handler !== 'function') {
        continue;
      }

      if (Array.isArray(params)) {
        (handler as (...args: unknown[]) => void)(...params);
        continue;
      }
      if (params === undefined) {
        (handler as () => void)();
        continue;
      }
      (handler as (arg: unknown) => void)(params);
    }
  }

  public onAction(
    action: string,
    param?: unknown,
    options: TriggerOptions = {},
  ): void {
    const nodes = this._nodes_in_order.length ? this._nodes_in_order : this._nodes;
    for (const node of nodes) {
      if (node.mode !== ALWAYS) {
        continue;
      }
      node.actionDo(action, param, options);
    }
  }

  public trigger(action: string, param?: unknown): void {
    this.onTrigger?.(action, param);
  }

  public addInput(name: string, type = '', value?: unknown): void {
    if (this.inputs[name]) {
      return;
    }
    this.inputs[name] = { name, type, value };
    this.onInputAdded?.(name, type);
  }

  public setInputDataType(name: string, type: string): boolean {
    const input = this.inputs[name];
    if (!input) {
      return false;
    }
    input.type = type;
    this.onInputTypeChanged?.(name, type);
    return true;
  }

  public renameInput(oldName: string, newName: string): boolean {
    if (!this.inputs[oldName] || this.inputs[newName]) {
      return false;
    }
    const current = this.inputs[oldName]!;
    delete this.inputs[oldName];
    current.name = newName;
    this.inputs[newName] = current;
    this.onInputRenamed?.(oldName, newName);
    return true;
  }

  public removeInput(name: string): boolean {
    if (!this.inputs[name]) {
      return false;
    }
    delete this.inputs[name];
    this.onInputRemoved?.(name);
    return true;
  }

  public addOutput(name: string, type = '', value?: unknown): void {
    if (this.outputs[name]) {
      return;
    }
    this.outputs[name] = { name, type, value };
    this.onOutputAdded?.(name, type);
  }

  public setOutputDataType(name: string, type: string): boolean {
    const output = this.outputs[name];
    if (!output) {
      return false;
    }
    output.type = type;
    this.onOutputTypeChanged?.(name, type);
    return true;
  }

  public renameOutput(oldName: string, newName: string): boolean {
    if (!this.outputs[oldName] || this.outputs[newName]) {
      return false;
    }
    const current = this.outputs[oldName]!;
    delete this.outputs[oldName];
    current.name = newName;
    this.outputs[newName] = current;
    this.onOutputRenamed?.(oldName, newName);
    return true;
  }

  public removeOutput(name: string): boolean {
    if (!this.outputs[name]) {
      return false;
    }
    delete this.outputs[name];
    this.onOutputRemoved?.(name);
    return true;
  }

  public setInputData(name: string, value: unknown): void {
    if (!this.inputs[name]) {
      this.addInput(name);
    }
    this.inputs[name]!.value = value;
  }

  public getInputData(name: string): unknown {
    return this.inputs[name]?.value;
  }

  public setOutputData(name: string, value: unknown): void {
    if (!this.outputs[name]) {
      this.addOutput(name);
    }
    this.outputs[name]!.value = value;
  }

  public getOutputData(name: string): unknown {
    return this.outputs[name]?.value;
  }

  public findNodesByType(type: string): LGraphNode[] {
    return this._nodes.filter((node) => node.type === type);
  }

  public findNodesByClass<T extends LGraphNode>(
    klass: new (...args: unknown[]) => T,
  ): T[] {
    return this._nodes.filter((node) => node instanceof klass) as T[];
  }

  public getNodeByTitle(title: string): LGraphNode | null {
    return this._nodes.find((node) => node.title === title) ?? null;
  }

  public getTime(): number {
    return this.globaltime;
  }

  public runStepAsync(
    num = 1,
    doNotCatchErrors = false,
    limit?: number,
  ): Promise<void> {
    return Promise.resolve().then(() => {
      this.runStep(num, doNotCatchErrors, limit);
    });
  }

  public arrange(margin = 100): void {
    const nodes = this.computeExecutionOrder(false);
    const columns = new Map<number, LGraphNode[]>();
    const levels = new Map<number | string, number>();
    for (const node of nodes) {
      levels.set(node.id, 1);
    }
    for (const node of nodes) {
      let level = levels.get(node.id) ?? 1;
      for (const input of node.inputs) {
        if (input.link == null) {
          continue;
        }
        const link = this.links[String(input.link)];
        if (!link) {
          continue;
        }
        const sourceLevel = levels.get(link.origin_id) ?? 1;
        level = Math.max(level, sourceLevel + 1);
      }
      levels.set(node.id, level);
      if (!columns.has(level)) {
        columns.set(level, []);
      }
      columns.get(level)!.push(node);
    }
    let x = margin;
    const sortedLevels = [...columns.keys()].sort((a, b) => a - b);
    for (const level of sortedLevels) {
      const column = columns.get(level)!;
      let y = margin + LiteGraph.NODE_TITLE_HEIGHT;
      let maxWidth = 100;
      for (const node of column) {
        node.pos[0] = x;
        node.pos[1] = y;
        y += node.size[1] + margin + LiteGraph.NODE_TITLE_HEIGHT;
        if (node.size[0] > maxWidth) {
          maxWidth = node.size[0];
        }
      }
      x += maxWidth + margin;
    }
  }


  public serialize(): SerializedGraph {
    const nodes = this._nodes.map((node) => node.serialize());
    const links = Object.values(this.links).map((link) => link.serialize());
    const data: SerializedGraph = {
      last_node_id: this.last_node_id,
      last_link_id: this.last_link_id,
      nodes,
      links,
      groups: [],
      config: cloneValue(this.config),
      extra: cloneValue(this.extra),
      version: LiteGraph.VERSION,
    };
    this.onSerialize?.(data);
    return data;
  }

  public configure(data: SerializedGraph, keepOld = false): boolean {
    if (!keepOld) {
      this.clear();
    }

    let hasError = false;
    this.last_node_id = data.last_node_id ?? 0;
    this.last_link_id = data.last_link_id ?? 0;
    this.config = cloneValue(data.config ?? {});
    this.extra = cloneValue(data.extra ?? {});

    const decodedLinks: Record<string, LLink> = {};
    for (const serializedLink of data.links ?? []) {
      if (!serializedLink) {
        continue;
      }
      const link = new LLink(0, null, 0, 0, 0, 0);
      link.configure(serializedLink as SerializedLinkTuple);
      decodedLinks[String(link.id)] = link;
    }
    this.links = decodedLinks;

    this._nodes = [];
    this._nodes_by_id = {};
    for (const nodeData of data.nodes ?? []) {
      const node = LiteGraph.createNode(nodeData.type, nodeData.title);
      const realNode = node ?? new LGraphNode(nodeData.title);
      if (!node) {
        realNode.last_serialization = nodeData;
        realNode.has_errors = true;
        hasError = true;
      }
      realNode.id = nodeData.id;
      this.add(realNode, true);
    }

    for (const nodeData of data.nodes ?? []) {
      const node = this.getNodeById(nodeData.id);
      node?.configure(nodeData);
    }

    this.updateExecutionOrder();
    this.onConfigure?.(data);
    return hasError;
  }

  private createTimer(interval: number): TimerHandle | null {
    const globalWithTimer = globalThis as unknown as {
      setInterval?: (handler: () => void, timeout?: number) => unknown;
      clearInterval?: (id: unknown) => void;
      requestAnimationFrame?: (cb: () => void) => unknown;
      cancelAnimationFrame?: (id: unknown) => void;
    };

    if (interval <= 0 && globalWithTimer.requestAnimationFrame) {
      let rafId: unknown;
      let active = true;
      const runFrame = (): void => {
        if (!active) {
          return;
        }
        this.onBeforeStep?.();
        this.runStep(1, !this.catch_errors);
        this.onAfterStep?.();
        rafId = globalWithTimer.requestAnimationFrame?.(runFrame);
      };
      rafId = globalWithTimer.requestAnimationFrame(runFrame);
      return {
        stop: () => {
          active = false;
          if (globalWithTimer.cancelAnimationFrame) {
            globalWithTimer.cancelAnimationFrame(rafId);
          }
        },
      };
    }

    if (globalWithTimer.setInterval && globalWithTimer.clearInterval) {
      const id = globalWithTimer.setInterval(() => {
        this.onBeforeStep?.();
        this.runStep(1, !this.catch_errors);
        this.onAfterStep?.();
      }, interval > 0 ? interval : 16);
      return {
        stop: () => {
          globalWithTimer.clearInterval?.(id);
        },
      };
    }

    return null;
  }
}
