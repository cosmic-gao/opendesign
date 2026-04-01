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
    this.subgraph.onInputAdded = this.onSubgraphInputAdded.bind(this);
    this.subgraph.onInputRenamed = this.onSubgraphInputRenamed.bind(this);
    this.subgraph.onInputTypeChanged = this.onSubgraphInputTypeChanged.bind(this);
    this.subgraph.onInputRemoved = this.onSubgraphInputRemoved.bind(this);
    this.subgraph.onOutputAdded = this.onSubgraphOutputAdded.bind(this);
    this.subgraph.onOutputRenamed = this.onSubgraphOutputRenamed.bind(this);
    this.subgraph.onOutputTypeChanged = this.onSubgraphOutputTypeChanged.bind(this);
    this.subgraph.onOutputRemoved = this.onSubgraphOutputRemoved.bind(this);
  }

  public executeSubgraph(): void {
    this.enabled = this.getInputOrProperty('enabled') as boolean;
    if (!this.enabled) {
      return;
    }
    for (const [index, input] of this.inputs.entries()) {
      // 父图输入 -> 子图全局输入：按“同名端口”做一次镜像。
      const value = this.getInputData(index);
      this.subgraph.setInputData(input.name, value);
    }
    this.subgraph.runStep(1, true);
    for (const [index, output] of this.outputs.entries()) {
      // 子图全局输出 -> 父图输出：执行完成后统一回写到当前节点输出槽。
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

  public onSubgraphInputAdded(name: string, type: string): void {
    // 子图结构变化会实时同步到外层节点，保证“容器节点”接口始终一致。
    if (this.findInputSlot(name) === -1) {
      this.addInput(name, type);
    }
  }

  public onSubgraphInputRenamed(oldName: string, newName: string): void {
    const slot = this.findInputSlot(oldName);
    if (slot !== -1) {
      this.inputs[slot]!.name = newName;
    }
  }

  public onSubgraphInputTypeChanged(name: string, type: string): void {
    const slot = this.findInputSlot(name);
    if (slot !== -1) {
      this.inputs[slot]!.type = type;
    }
  }

  public onSubgraphInputRemoved(name: string): void {
    const slot = this.findInputSlot(name);
    if (slot !== -1) {
      this.removeInput(slot);
    }
  }

  public onSubgraphOutputAdded(name: string, type: string): void {
    if (this.findOutputSlot(name) === -1) {
      this.addOutput(name, type);
    }
  }

  public onSubgraphOutputRenamed(oldName: string, newName: string): void {
    const slot = this.findOutputSlot(oldName);
    if (slot !== -1) {
      this.outputs[slot]!.name = newName;
    }
  }

  public onSubgraphOutputTypeChanged(name: string, type: string): void {
    const slot = this.findOutputSlot(name);
    if (slot !== -1) {
      this.outputs[slot]!.type = type;
    }
  }

  public onSubgraphOutputRemoved(name: string): void {
    const slot = this.findOutputSlot(name);
    if (slot !== -1) {
      this.removeOutput(slot);
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
