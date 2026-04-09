// Slot - 端点槽位类型，用于泛型约束
export interface Slot<T = unknown> {
  readonly _type?: T;
  readonly _direction?: 'in' | 'out';
}

// Endpoint 方向
export type EndpointDirection = 'in' | 'out';

// Endpoint 名称解析后的结构
export interface ParsedEndpoint {
  direction: EndpointDirection;
  name: string;       // 复合名称: "user", "llm", "tool.result"
  parts: string[];    // 层级分解: ["tool", "result"]
}

// 端点定义
export interface EndpointDef {
  direction: EndpointDirection;
  name: string;
}

// 输入端点映射
export type InEndpoints = Record<string, Slot>;

// 输出端点映射  
export type OutEndpoints = Record<string, Slot>;

// 节点端点配置
export interface NodeEndpoints<In extends InEndpoints, Out extends OutEndpoints> {
  in: In;
  out: Out;
}

// 解析端点字符串为结构
// 格式: "<nodeId>.in:<name>" 或 "in:<name>" 或 "in:<name>.<subname>" (层级)
// 示例: "in:user" -> { nodeId: undefined, direction: 'in', name: 'user', parts: ['user'] }
// 示例: "Agent.out:llm" -> { nodeId: 'Agent', direction: 'out', name: 'llm', parts: ['llm'] }
// 示例: "Agent.out:tool.result" -> { nodeId: 'Agent', direction: 'out', name: 'tool.result', parts: ['tool', 'result'] }
export function parseEndpoint(endpoint: string): ParsedEndpoint & { nodeId?: string } {
  const match = endpoint.match(/^(.+?)\.(in|out):(.+)$/);
  if (match) {
    const name = match[3];
    return {
      nodeId: match[1],
      direction: match[2] as EndpointDirection,
      name,
      parts: name.split('.'),
    };
  }
  
  const simpleMatch = endpoint.match(/^(in|out):(.+)$/);
  if (simpleMatch) {
    const name = simpleMatch[2];
    return {
      direction: simpleMatch[1] as EndpointDirection,
      name,
      parts: name.split('.'),
    };
  }
  
  throw new Error(`Invalid endpoint format: ${endpoint}`);
}

// 格式化端点为字符串（无 nodeId）
export function formatEndpoint(direction: EndpointDirection, name: string): string {
  return `${direction}:${name}`;
}

// 格式化完整端点字符串（带 nodeId）
export function formatFullEndpoint(nodeId: string, direction: EndpointDirection, name: string): string {
  return `${nodeId}.${direction}:${name}`;
}

// 类型化消息
export interface Message<P = unknown> {
  readonly id: string;
  readonly endpoint: string;
  readonly payload: P;
  readonly timestamp: number;
}

// 消息构建选项
export interface MessageOptions<P = unknown> {
  id?: string;
  endpoint: string;
  payload: P;
  timestamp?: number;
}

// 创建消息
export function createMessage<P = unknown>(options: MessageOptions<P>): Message<P> {
  return {
    id: options.id ?? `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    endpoint: options.endpoint,
    payload: options.payload,
    timestamp: options.timestamp ?? Date.now(),
  };
}

// 路由规则类型
export type RouteRule = 
  | { type: 'exact'; source: string; target: string }
  | { type: 'broadcast'; source: string; target: '*' }
  | { type: 'wildcard'; source: string; target: string };

// 连接边定义
export interface Edge {
  id: string;
  source: string;  // e.g., "NodeA.out:llm"
  target: string;  // e.g., "NodeB.in:tool" or "*"
}
