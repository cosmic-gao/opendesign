import type { Edge, Message, ParsedEndpoint } from './types.js';
import { parseEndpoint } from './types.js';

// 路由匹配结果
export interface RouteMatch {
  edge: Edge;
  targets: string[];  // 目标端点列表
}

// 路由器
export class Router {
  private edges: Edge[] = [];
  private sourceToEdges: Map<string, Edge[]> = new Map();
  private wildcardPatterns: Map<string, Edge[]> = new Map();

  // 添加边
  addEdge(edge: Edge): void {
    this.edges.push(edge);
    
    // 构建源到边的映射
    const sourceEdges = this.sourceToEdges.get(edge.source) ?? [];
    sourceEdges.push(edge);
    this.sourceToEdges.set(edge.source, sourceEdges);

    // 处理通配符
    if (edge.target.includes('*')) {
      const pattern = this.wildcardPatterns.get(edge.source) ?? [];
      pattern.push(edge);
      this.wildcardPatterns.set(edge.source, pattern);
    }
  }

  // 移除边
  removeEdge(edgeId: string): void {
    const idx = this.edges.findIndex(e => e.id === edgeId);
    if (idx !== -1) {
      const edge = this.edges[idx];
      this.edges.splice(idx, 1);
      
      // 清理映射
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
  }

  // 清空所有边
  clear(): void {
    this.edges = [];
    this.sourceToEdges.clear();
    this.wildcardPatterns.clear();
  }

  // 路由消息 - 返回所有匹配的边
  route(msg: Message, sourceNode: string): Edge[] {
    const results: Edge[] = [];
    
    // 1. 精确匹配 (e.g., "NodeA.out:llm" -> "NodeB.in:tool")
    const exactSource = `${sourceNode}.${msg.endpoint}`;
    const exactEdges = this.sourceToEdges.get(exactSource) ?? [];
    results.push(...exactEdges.filter(e => e.target !== '*'));

    // 2. 广播 (e.g., "NodeA.out:events" -> "*")
    const broadcastEdges = exactEdges.filter(e => e.target === '*');
    if (broadcastEdges.length > 0) {
      // 广播到所有接收该消息的边（排除发送给发送者本身）
      results.push(...this.edges.filter(e => 
        e.id !== msg.id && 
        e.source.startsWith('in.') &&
        this.matchWildcard(msg.endpoint, e.source)
      ));
    }

    // 3. 通配符匹配 (e.g., "NodeA.out:*" -> "NodeB.in:*")
    const wildcardEdges = this.wildcardPatterns.get(exactSource) ?? [];
    for (const edge of wildcardEdges) {
      if (edge.target === '*') {
        // 通配符目标 -> 广播
        results.push(...this.edges.filter(e => 
          e.source.startsWith('in.') &&
          this.matchWildcard(msg.endpoint, e.source)
        ));
      } else if (edge.target.includes('*')) {
        // 带通配符的目标
        results.push(edge);
      }
    }

    // 去重
    const uniqueEdges = Array.from(new Set(results.map(e => e.id)))
      .map(id => results.find(e => e.id === id)!);

    return uniqueEdges;
  }

  // 通配符匹配
  // "out:events" matches "out:*"
  // "out:events" matches "out:*"
  private matchWildcard(endpoint: string, pattern: string): boolean {
    if (!pattern.includes('*')) return false;
    
    const endpointParts = endpoint.split('.');
    const patternParts = pattern.split('.');

    // 简单通配符匹配：只支持末尾 *
    if (pattern.endsWith('.*')) {
      const prefix = patternParts.slice(0, -1).join('.');
      return endpoint.startsWith(prefix);
    }

    if (pattern === '*') {
      return true;
    }

    return false;
  }

  // 获取所有边
  getEdges(): Edge[] {
    return [...this.edges];
  }

  // 获取从指定节点出发的所有边
  getOutgoingEdges(nodeName: string): Edge[] {
    return this.edges.filter(e => e.source.startsWith(`${nodeName}.out.`));
  }

  // 获取到达指定节点的所有边
  getIncomingEdges(nodeName: string): Edge[] {
    return this.edges.filter(e => e.target.startsWith(`${nodeName}.in.`));
  }
}

// 条件路由函数类型
export type ConditionFn = (msg: Message) => boolean;

// 带条件的路由器
export class ConditionalRouter extends Router {
  private conditions: Map<string, ConditionFn[]> = new Map();

  // 添加条件路由
  addCondition(edgeId: string, condition: ConditionFn): void {
    const existing = this.conditions.get(edgeId) ?? [];
    existing.push(condition);
    this.conditions.set(edgeId, existing);
  }

  // 检查消息是否满足条件
  evaluateConditions(edgeId: string, msg: Message): boolean {
    const conditions = this.conditions.get(edgeId);
    if (!conditions) return true;
    return conditions.every(fn => fn(msg));
  }

  // 路由消息（带条件检查）
  routeWithConditions(msg: Message, sourceNode: string): Edge[] {
    const edges = this.route(msg, sourceNode);
    return edges.filter(edge => this.evaluateConditions(edge.id, msg));
  }
}
