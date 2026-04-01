import { ALWAYS } from './constants';
import { LGraph } from './graph';
import { LiteGraph } from './litegraph';
import { LGraphNode } from './node';

export class SubgraphNode extends LGraphNode {
  public static title = 'Subgraph';
  public static desc = 'Graph inside a node';

  public enabled = true;
  public readonly subgraph: LGraph;

  public constructor() {
    super('Subgraph');
    this.size = [140, 80];
    this.properties = { enabled: true };
    this.subgraph = new LGraph();
    this.onExecute = () => {
      this.executeSubgraph();
    };
    this.subgraph.onAction = this.onSubgraphAction.bind(this);
  }

  public executeSubgraph(): void {
    this.enabled = this.getInputOrProperty('enabled') as boolean;
    if (!this.enabled) {
      return;
    }
    for (const [index, input] of this.inputs.entries()) {
      const value = this.getInputData(index);
      this.subgraph.setInputData(input.name, value);
    }
    this.subgraph.runStep(1, true);
    for (const [index, output] of this.outputs.entries()) {
      const value = this.subgraph.getOutputData(output.name);
      this.setOutputData(index, value);
    }
  }

  public sendEventToAllNodes(
    eventName: string,
    param?: unknown[] | unknown,
    mode = ALWAYS,
  ): void {
    if (!this.enabled) {
      return;
    }
    this.subgraph.sendEventToAllNodes(eventName, param, mode);
  }

  public onSubgraphAction(action: string, param?: unknown): void {
    const slot = this.findOutputSlot(action);
    if (slot !== -1) {
      this.triggerSlot(slot, param);
    }
  }

  public getInputOrProperty(name: string): unknown {
    const inputSlot = this.findInputSlot(name);
    if (inputSlot !== -1) {
      const data = this.getInputData(inputSlot);
      if (data !== undefined) {
        return data;
      }
    }
    return this.properties[name];
  }
}

LiteGraph.registerNodeType('graph/subgraph', SubgraphNode);
