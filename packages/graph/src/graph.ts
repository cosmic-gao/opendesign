import type { NodeInterface } from './node.js';
import type { InEndpoints, OutEndpoints, Edge, Message, NodeEndpoints } from './types.js';
import { Router, ConditionalRouter } from './router.js';
import { createMessage } from './types.js';

// 边 ID 生成器
let edgeIdCounter = 0;
function nextEdgeId(): string {
  return `edge_${++edgeIdCounter}`;
}

// 图配置
export interface GraphConfig {
  enableConditions?: boolean;  // 启用条件路由
}

// 图类
export class Graph<In extends InEndpoints = InEndpoints, Out extends OutEndpoints = OutEndpoints> {
  readonly id: string;
  readonly name: string;
  private nodes: Map<string, NodeInterface<any, any>> = new Map();
  private router: Router;
  private conditionalRouter?: ConditionalRouter;
  private config: GraphConfig;

  constructor(id: string, name: string, config: GraphConfig = {}) {
    this.id = id;
    this.name = name;
    this.config = config;
    this.router = new Router();
    if (config.enableConditions) {
      this.conditionalRouter = new ConditionalRouter();
    }
  }

  // 添加节点
  addNode<In2 extends InEndpoints, Out2 extends OutEndpoints>(
    node: NodeInterface<In2, Out2>
  ): this {
    this.nodes.set(node.id, node);
    return this;
  }

  // 移除节点（同时移除所有关联的边）
  removeNode(nodeId: string): this {
    const node = this.nodes.get(nodeId);
    if (!node) return this;

    // 移除所有与该节点相关的边
    const edgesToRemove = this.router.getEdges().filter(
      e => e.source.startsWith(`${nodeId}.`) || e.target.startsWith(`${nodeId}.`)
    );
    edgesToRemove.forEach(e => this.router.removeEdge(e.id));

    this.nodes.delete(nodeId);
    return this;
  }

  // 获取节点
  getNode(id: string): NodeInterface<any, any> | undefined {
    return this.nodes.get(id);
  }

  // 获取所有节点
  getNodes(): NodeInterface<any, any>[] {
    return Array.from(this.nodes.values());
  }

  // 连接两个节点（显式端点连接）
  // e.g., graph.connect('Agent.out:llm', 'LLM.in:request')
  connect(source: string, target: string): this {
    const edge: Edge = {
      id: nextEdgeId(),
      source,
      target,
    };
    this.router.addEdge(edge);
    return this;
  }

  // 广播连接
  // e.g., graph.broadcast('Events.out:update', '*')
  broadcast(source: string, target: '*'): this {
    return this.connect(source, target);
  }

  // 多目标连接
  // e.g., graph.connectMultiple('Agent.out:result', ['Parser.in:json', 'Validator.in:data'])
  connectMultiple(source: string, targets: string[]): this {
    targets.forEach(target => this.connect(source, target));
    return this;
  }

  // 移除连接
  disconnect(source: string, target: string): this {
    const edge = this.router.getEdges().find(
      e => e.source === source && e.target === target
    );
    if (edge) {
      this.router.removeEdge(edge.id);
    }
    return this;
  }

  // 添加条件路由
  // e.g., graph.addCondition('edge_1', (msg) => msg.payload.type === 'tool')
  addCondition(edgeId: string, condition: (msg: Message) => boolean): this {
    if (this.conditionalRouter) {
      this.conditionalRouter.addCondition(edgeId, condition);
    }
    return this;
  }

  // 发送消息（内部使用）
  private sendTo(targetEndpoint: string, msg: Message): void {
    // 解析目标端点
    const [targetNodeId, targetDirection, targetName] = this.parseEndpointPath(targetEndpoint);
    
    if (!targetNodeId || !targetDirection || !targetName) {
      console.warn(`Invalid target endpoint: ${targetEndpoint}`);
      return;
    }

    const targetNode = this.nodes.get(targetNodeId);
    if (!targetNode) {
      console.warn(`Target node not found: ${targetNodeId}`);
      return;
    }

    // 更新消息端点为目标端点
    const targetMsg = createMessage({
      ...msg,
      endpoint: `${targetDirection}.${targetName}`,
    });

    // 调用节点处理
    targetNode.handle(`${targetDirection}.${targetName}` as any, targetMsg).catch(err => {
      console.error(`Error handling message at ${targetNodeId}:`, err);
      targetNode.handleError?.(err);
    });
  }

  // 解析端点路径
  // "NodeA.out:llm" -> ["NodeA", "out", "llm"]
  private parseEndpointPath(endpoint: string): [string?, string?, string?] {
    // 格式: "NodeID.direction.name" 或 "NodeID.out:llm"
    const match = endpoint.match(/^(.+?)\.(in|out):(.+)$/);
    if (match) {
      return [match[1], match[2], match[3]];
    }
    
    // 简单格式: "in.name" 或 "out.name" (当前节点)
    const simpleMatch = endpoint.match(/^(in|out):(.+)$/);
    if (simpleMatch) {
      return [undefined, simpleMatch[1], simpleMatch[2]];
    }
    
    return [undefined, undefined, undefined];
  }

  // 从节点发送消息
  sendFromNode(sourceNodeId: string, msg: Message): void {
    const node = this.nodes.get(sourceNodeId);
    if (!node) {
      console.warn(`Source node not found: ${sourceNodeId}`);
      return;
    }

    // 构建源端点字符串
    const sourceEndpoint = msg.endpoint;

    // 路由消息
    let edges = this.router.route(msg, sourceNodeId);

    // 如果启用条件路由，执行条件检查
    if (this.conditionalRouter) {
      edges = edges.filter(e => this.conditionalRouter!.evaluateConditions(e.id, msg));
    }

    // 发送消息到所有匹配的边
    for (const edge of edges) {
      if (edge.target === '*') {
        // 广播模式 - 发送到所有输入端点
        for (const targetNode of this.nodes.values()) {
          if (targetNode.id !== sourceNodeId) {
            this.sendTo(`${targetNode.id}.in:${sourceEndpoint.split('.')[1]}`, msg);
          }
        }
      } else {
        this.sendTo(edge.target, msg);
      }
    }
  }

  // 启动图
  async start(): Promise<void> {
    for (const node of this.nodes.values()) {
      await node.start();
    }
  }

  // 停止图
  async stop(): Promise<void> {
    for (const node of this.nodes.values()) {
      await node.stop();
    }
  }

  // 获取路由信息
  getRouter(): Router {
    return this.router;
  }

  // 获取所有边
  getEdges(): Edge[] {
    return this.router.getEdges();
  }
}

// 图构建器
export class GraphBuilder<In extends InEndpoints, Out extends OutEndpoints> {
  private graph: Graph<In, Out>;

  constructor(id: string, name: string, config?: GraphConfig) {
    this.graph = new Graph<In, Out>(id, name, config);
  }

  node<In2 extends InEndpoints, Out2 extends OutEndpoints>(
    node: NodeInterface<In2, Out2>
  ): GraphBuilder<In & In2, Out & Out2> {
    this.graph.addNode(node);
    return this as any;
  }

  connect(source: string, target: string): this {
    this.graph.connect(source, target);
    return this;
  }

  build(): Graph<In, Out> {
    return this.graph;
  }
}
