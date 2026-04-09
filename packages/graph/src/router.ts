import type { Edge, Message } from './types.js';

// 路由器 - 负责消息路由和边管理
export class Router {
  private edges: Edge[] = [];
  private sourceToEdges: Map<string, Edge[]> = new Map();
  private wildcardPatterns: Map<string, Edge[]> = new Map();

  addEdge(edge: Edge): void {
    this.edges.push(edge);
    
    const sourceEdges = this.sourceToEdges.get(edge.source) ?? [];
    sourceEdges.push(edge);
    this.sourceToEdges.set(edge.source, sourceEdges);

    if (edge.target.includes('*')) {
      const pattern = this.wildcardPatterns.get(edge.source) ?? [];
      pattern.push(edge);
      this.wildcardPatterns.set(edge.source, pattern);
    }
  }

  removeEdge(edgeId: string): void {
    const idx = this.edges.findIndex(e => e.id === edgeId);
    if (idx === -1) return;
    
    const edge = this.edges[idx];
    this.edges.splice(idx, 1);
    
    const sourceEdges = this.sourceToEdges.get(edge.source);
    if (sourceEdges) {
      const filtered = sourceEdges.filter(e => e.id !== edgeId);
      if (filtered.length === 0) {
        this.sourceToEdges.delete(edge.source);
      } else {
        this.sourceToEdges.set(edge.source, filtered);
      }
    }
    
    this.wildcardPatterns.delete(edge.source);
  }

  clear(): void {
    this.edges = [];
    this.sourceToEdges.clear();
    this.wildcardPatterns.clear();
  }

  // 路由消息 - 返回所有匹配的边
  // 源端点格式: "NodeId.direction:name"
  // 消息 endpoint 格式: "direction:name" (如 "out:llm")
  route(msg: Message, sourceNode: string): Edge[] {
    const results: Edge[] = [];
    
    // 1. 精确匹配: "NodeA.out:llm" -> "NodeB.in:tool"
    const exactSource = `${sourceNode}.${msg.endpoint}`;
    const exactEdges = this.sourceToEdges.get(exactSource) ?? [];
    results.push(...exactEdges.filter(e => e.target !== '*'));

    // 2. 广播边匹配 (target === '*')
    const broadcastEdges = exactEdges.filter(e => e.target === '*');
    
    // 3. 通配符边匹配
    const wildcardEdges = this.wildcardPatterns.get(exactSource) ?? [];
    results.push(...wildcardEdges.filter(e => e.target !== '*'));
    
    // 4. 广播边（target 为 '*'）- 标记用于外部处理
    for (const edge of broadcastEdges) {
      results.push(edge);
    }

    return this.deduplicateEdges(results);
  }

  // 检查消息是否匹配广播边
  // 返回 { isBroadcast, endpointName } - endpointName 用于广播时构造目标端点
  static parseBroadcastEdge(sourceEndpoint: string): { isBroadcast: boolean; endpointName: string } {
    const match = sourceEndpoint.match(/^(.+?)\.(in|out):(.+)$/);
    if (!match) return { isBroadcast: false, endpointName: '' };
    
    const endpointName = match[3];
    return { isBroadcast: true, endpointName };
  }

  private deduplicateEdges(edges: Edge[]): Edge[] {
    const seen = new Set<string>();
    return edges.filter(e => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  }

  getEdges(): Edge[] {
    return [...this.edges];
  }

  // 获取从指定节点出发的所有边
  // 格式: "NodeName.out:name"
  getOutgoingEdges(nodeName: string): Edge[] {
    return this.edges.filter(e => e.source.startsWith(`${nodeName}.out:`));
  }

  // 获取到达指定节点的所有边
  // 格式: "NodeName.in:name"
  getIncomingEdges(nodeName: string): Edge[] {
    return this.edges.filter(e => e.target.startsWith(`${nodeName}.in:`));
  }
}

// 条件路由函数类型
export type ConditionFn = (msg: Message) => boolean;

// 带条件的路由器
export class ConditionalRouter extends Router {
  private conditions: Map<string, ConditionFn[]> = new Map();

  addCondition(edgeId: string, condition: ConditionFn): void {
    const existing = this.conditions.get(edgeId) ?? [];
    existing.push(condition);
    this.conditions.set(edgeId, existing);
  }

  evaluateConditions(edgeId: string, msg: Message): boolean {
    const conditions = this.conditions.get(edgeId);
    if (!conditions) return true;
    return conditions.every(fn => fn(msg));
  }

  // 路由消息（带条件检查）
  route(msg: Message, sourceNode: string): Edge[] {
    const edges = super.route(msg, sourceNode);
    return edges.filter(edge => this.evaluateConditions(edge.id, msg));
  }
}
