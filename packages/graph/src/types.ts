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
// "in.user" -> { direction: 'in', name: 'user', parts: ['user'] }
// "out.tool.result" -> { direction: 'out', name: 'tool.result', parts: ['tool', 'result'] }
export function parseEndpoint(endpoint: string): ParsedEndpoint {
  const parts = endpoint.split('.');
  const direction = parts[0] as EndpointDirection;
  const name = parts.slice(1).join('.');
  return {
    direction,
    name,
    parts,
  };
}

// 格式化端点为字符串
export function formatEndpoint(direction: EndpointDirection, name: string): string {
  return `${direction}.${name}`;
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
