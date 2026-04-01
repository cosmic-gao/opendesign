import { describe, expect, it } from 'vitest';

import {
  ACTION,
  ALWAYS,
  LGraph,
  LGraphNode,
  LiteGraph,
  ON_TRIGGER,
  SubgraphNode,
} from './src/runtime';

class ConstNode extends LGraphNode {
  public static title = 'ConstNode';
  public value: number;

  public constructor(value = 0) {
    super('ConstNode');
    this.value = value;
    this.addOutput('value', 'number');
    this.onExecute = () => {
      this.setOutputData(0, this.value);
    };
  }
}

class AddNode extends LGraphNode {
  public static title = 'AddNode';

  public constructor() {
    super('AddNode');
    this.addInput('a', 'number');
    this.addInput('b', 'number');
    this.addOutput('sum', 'number');
    this.onExecute = () => {
      const a = (this.getInputData(0) as number | undefined) ?? 0;
      const b = (this.getInputData(1) as number | undefined) ?? 0;
      this.setOutputData(0, a + b);
    };
  }
}

class CounterActionNode extends LGraphNode {
  public static title = 'CounterActionNode';
  public count = 0;

  public constructor() {
    super('CounterActionNode');
    this.addInput('run', ACTION);
    this.mode = ON_TRIGGER;
    this.onExecute = () => {
      this.count += 1;
    };
  }
}

class EmptyNode extends LGraphNode {
  public static title = 'EmptyNode';

  public constructor(title = 'EmptyNode') {
    super(title);
  }
}

class PlainCtorNode {
  public title: string;
  public constructor(title = 'PlainCtorNode') {
    this.title = title;
  }
}

describe('graph runtime', () => {
  it('支持数据流执行', () => {
    LiteGraph.registerNodeType('test/const', ConstNode);
    LiteGraph.registerNodeType('test/add', AddNode);

    const graph = new LGraph();
    const a = LiteGraph.createNode('test/const') as ConstNode;
    const b = LiteGraph.createNode('test/const') as ConstNode;
    const add = LiteGraph.createNode('test/add') as AddNode;

    a.value = 3;
    b.value = 4;
    graph.add(a);
    graph.add(b);
    graph.add(add);
    a.connect(0, add, 0);
    b.connect(0, add, 1);

    graph.runStep();
    expect(add.outputs[0]?._data).toBe(7);
  });

  it('支持事件触发 ON_TRIGGER 节点', () => {
    LiteGraph.registerNodeType('test/counter_action', CounterActionNode);
    const source = new LGraphNode('Source');
    source.addOutput('run', ACTION);
    const target = LiteGraph.createNode(
      'test/counter_action',
    ) as CounterActionNode;
    const graph = new LGraph();

    graph.add(source);
    graph.add(target);
    source.connect(0, target, 0);
    source.trigger('run');

    expect(target.count).toBe(1);
  });

  it('支持图序列化与反序列化', () => {
    LiteGraph.registerNodeType('test/empty', EmptyNode);
    const graph = new LGraph();
    const a = LiteGraph.createNode('test/empty', 'A') as EmptyNode;
    const b = LiteGraph.createNode('test/empty', 'B') as EmptyNode;
    a.addOutput('out', 'number');
    b.addInput('in', 'number');
    graph.add(a);
    graph.add(b);
    a.connect(0, b, 0);

    const data = graph.serialize();
    const clone = new LGraph();
    const hasError = clone.configure(data);

    expect(hasError).toBe(false);
    expect(Object.keys(clone.serialize().links).length).toBe(1);
    expect(clone.serialize().nodes.length).toBe(2);
  });

  it('支持子图节点编排', () => {
    const graph = new LGraph();
    const subgraphNode = new SubgraphNode();
    subgraphNode.addInput('input', 'number');
    subgraphNode.addOutput('output', 'number');
    subgraphNode.subgraph.addInput('input', 'number');
    subgraphNode.subgraph.addOutput('output', 'number');

    const inputReader = new LGraphNode('InputReader');
    inputReader.addOutput('value', 'number');
    inputReader.onExecute = () => {
      inputReader.setOutputData(0, subgraphNode.subgraph.getInputData('input'));
    };

    const outputWriter = new LGraphNode('OutputWriter');
    outputWriter.addInput('value', 'number');
    outputWriter.onExecute = () => {
      subgraphNode.subgraph.setOutputData('output', outputWriter.getInputData(0));
    };

    subgraphNode.subgraph.add(inputReader);
    subgraphNode.subgraph.add(outputWriter);
    inputReader.connect(0, outputWriter, 0);
    graph.add(subgraphNode);
    const source = new LGraphNode('Source');
    source.addOutput('value', 'number');
    source.onExecute = () => {
      source.setOutputData(0, 9);
    };
    graph.add(source);
    source.connect(0, subgraphNode, 0);
    source.onExecute();
    subgraphNode.onExecute();

    expect(subgraphNode.outputs[0]?._data).toBe(9);
  });

  it('支持执行模式与执行序更新', () => {
    const graph = new LGraph();
    const node = new LGraphNode('Exec');
    let called = 0;
    node.mode = ALWAYS;
    node.onExecute = () => {
      called += 1;
    };
    graph.add(node);
    graph.runStep(3);
    expect(called).toBe(3);
  });

  it('trigger 仅透传到图级 onTrigger 回调', () => {
    const graph = new LGraph();
    const calls: Array<{ action: string; param: unknown }> = [];

    graph.onTrigger = (action, param) => {
      calls.push({ action, param });
    };
    graph.trigger('commit', { id: 1 });

    expect(calls).toEqual([{ action: 'commit', param: { id: 1 } }]);
  });

  it('clear 会清空全局输入输出', () => {
    const graph = new LGraph();
    graph.addInput('a', 'number');
    graph.addOutput('b', 'number');
    graph.setInputData('a', 1);
    graph.setOutputData('b', 2);

    graph.clear();

    expect(graph.getInputData('a')).toBe(undefined);
    expect(graph.getOutputData('b')).toBe(undefined);
  });

  it('支持注册非继承节点构造器并补齐基础能力', () => {
    LiteGraph.registerNodeType('test/plain', PlainCtorNode);
    const node = LiteGraph.createNode('test/plain');

    expect(node).not.toBeNull();
    expect(typeof node?.addInput).toBe('function');
    node?.addInput('in', 'number');
    node?.addOutput('out', 'number');
    expect(node?.findInputSlot('in')).toBe(0);
    expect(node?.findOutputSlot('out')).toBe(0);
  });
});
