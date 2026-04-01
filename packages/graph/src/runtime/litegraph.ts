import {
  ACTION,
  ALWAYS,
  EVENT,
  NEVER,
  ON_EVENT,
  ON_TRIGGER,
} from './constants';
import { LGraphNode } from './node';

export interface NodeClass<TNode = LGraphNode> {
  new (title?: string): TNode;
  type?: string;
  title?: string;
  category?: string;
  priority?: number;
}

class LiteGraphNamespace {
  public VERSION = 1;
  public EVENT = EVENT;
  public ACTION = ACTION;
  public ALWAYS = ALWAYS;
  public ON_EVENT = ON_EVENT;
  public NEVER = NEVER;
  public ON_TRIGGER = ON_TRIGGER;
  public NODE_TITLE_HEIGHT = 30;
  public NODE_SLOT_HEIGHT = 20;
  public NODE_WIDTH = 140;
  public MAX_NUMBER_OF_NODES = 1000;
  public debug = false;
  public catch_exceptions = true;
  public throw_errors = true;
  public use_deferred_actions = true;
  public use_uuids = false;

  public readonly registered_node_types: Record<string, NodeClass> = {};

  public registerNodeType(type: string, nodeClass: NodeClass): void {
    if (
      typeof nodeClass !== 'function' ||
      !Object.prototype.hasOwnProperty.call(nodeClass, 'prototype')
    ) {
      throw new Error(
        'Cannot register a simple object, it must be a class with a prototype',
      );
    }

    const className = nodeClass.name;
    const slashPos = type.lastIndexOf('/');
    nodeClass.type = type;
    nodeClass.category = slashPos > 0 ? type.substring(0, slashPos) : '';
    if (!nodeClass.title) {
      nodeClass.title = className || type;
    }
    for (const key of Object.getOwnPropertyNames(LGraphNode.prototype)) {
      if (key === 'constructor') {
        continue;
      }
      if (Object.prototype.hasOwnProperty.call(nodeClass.prototype, key)) {
        continue;
      }
      const descriptor = Object.getOwnPropertyDescriptor(LGraphNode.prototype, key);
      if (descriptor) {
        Object.defineProperty(nodeClass.prototype, key, descriptor);
      }
    }

    this.registered_node_types[type] = nodeClass;
  }

  public unregisterNodeType(type: string): void {
    if (!this.registered_node_types[type]) {
      throw new Error(`node type not found: ${type}`);
    }
    delete this.registered_node_types[type];
  }

  public clearRegisteredTypes(): void {
    for (const key of Object.keys(this.registered_node_types)) {
      delete this.registered_node_types[key];
    }
  }

  public addNodeMethod(name: string, method: (...args: unknown[]) => unknown): void {
    Object.defineProperty(LGraphNode.prototype, name, {
      value: method,
      configurable: true,
      writable: true,
    });
  }

  public buildNodeClassFromObject(
    type: string,
    object: Record<string, unknown>,
  ): NodeClass {
    const nodeTitle = (object.title as string | undefined) ?? type;
    const self = this;
    const DynamicNode = class extends LGraphNode {
      public static title = nodeTitle;
      public constructor(title?: string) {
        super(title ?? nodeTitle);
        if (Array.isArray(object.inputs)) {
          this.addInputs(object.inputs as Array<[string, string | number]>);
        }
        if (Array.isArray(object.outputs)) {
          this.addOutputs(object.outputs as Array<[string, string | number]>);
        }
        if (object.properties && typeof object.properties === 'object') {
          this.properties = {
            ...this.properties,
            ...(object.properties as Record<string, unknown>),
          };
        }
      }
    };
    for (const [key, value] of Object.entries(object)) {
      if (
        key === 'title' ||
        key === 'inputs' ||
        key === 'outputs' ||
        key === 'properties'
      ) {
        continue;
      }
      (DynamicNode.prototype as unknown as Record<string, unknown>)[key] = value;
    }
    self.registerNodeType(type, DynamicNode);
    return DynamicNode;
  }

  public wrapFunctionAsNode(
    type: string,
    fn: (...args: number[]) => unknown,
    inputTypes: string[] = [],
    outputType = '',
  ): NodeClass {
    const Node = class extends LGraphNode {
      public static title = type.split('/').pop() ?? type;
      public constructor() {
        super(Node.title);
        for (let i = 0; i < inputTypes.length; i += 1) {
          this.addInput(`in${i}`, inputTypes[i] ?? '');
        }
        this.addOutput('out', outputType);
        this.onExecute = () => {
          const args: number[] = [];
          for (let i = 0; i < inputTypes.length; i += 1) {
            const value = this.getInputData(i);
            args.push(typeof value === 'number' ? value : 0);
          }
          this.setOutputData(0, fn(...args));
        };
      }
    };
    this.registerNodeType(type, Node);
    return Node;
  }

  public createNode(type: string, title?: string): LGraphNode | null {
    const nodeClass = this.registered_node_types[type];
    if (!nodeClass) {
      return null;
    }

    const node = new nodeClass(title) as LGraphNode;
    this.hydrateNodeInstance(node, title);
    node.type = type;
    if (!node.title && nodeClass.title) {
      node.title = nodeClass.title;
    }
    return node;
  }

  private hydrateNodeInstance(node: LGraphNode, title?: string): void {
    if (!node.title) {
      node.title = title ?? 'Unnamed';
    }
    if (!Array.isArray(node.inputs)) {
      node.inputs = [];
    }
    if (!Array.isArray(node.outputs)) {
      node.outputs = [];
    }
    if (!node.properties || typeof node.properties !== 'object') {
      node.properties = {};
    }
    if (!Array.isArray(node.properties_info)) {
      node.properties_info = [];
    }
    if (!node.flags || typeof node.flags !== 'object') {
      node.flags = {};
    }
    if (typeof node.order !== 'number') {
      node.order = 0;
    }
    if (typeof node.mode !== 'number') {
      node.mode = ALWAYS;
    }
    if (!Array.isArray(node.size)) {
      node.size = [this.NODE_WIDTH, 60];
    }
    if (!Array.isArray(node.pos)) {
      node.pos = [10, 10];
    }
    if (node.id == null) {
      node.id = -1;
    }
    node.graph = node.graph ?? null;
  }
}

export const LiteGraph = new LiteGraphNamespace();
