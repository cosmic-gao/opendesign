import type { InEndpoints, OutEndpoints, Slot, Message, Edge, NodeEndpoints } from './types.js';

// 节点状态
export type NodeStatus = 'idle' | 'running' | 'waiting' | 'error' | 'stopped';

// 节点接口定义
export interface NodeInterface<In extends InEndpoints, Out extends OutEndpoints> {
  readonly id: string;
  readonly name: string;
  readonly endpoints: NodeEndpoints<In, Out>;
  status: NodeStatus;
  
  // 处理输入消息，返回输出消息
  handle(endpoint: keyof In & string, msg: Message): Promise<Message[]>;
  
  // 生命周期方法
  start(): Promise<void>;
  stop(): Promise<void>;
  handleError(error: Error): Promise<void>;
  
  // 生命周期钩子（可选实现）
  onStart?(): Promise<void>;
  onStop?(): Promise<void>;
  onError?(error: Error): Promise<void>;
}

// 节点基类
export abstract class Node<In extends InEndpoints, Out extends OutEndpoints> implements NodeInterface<In, Out> {
  readonly id: string;
  readonly name: string;
  readonly endpoints: NodeEndpoints<In, Out>;
  status: NodeStatus = 'idle';

  private errorHandler?: (error: Error) => Promise<void>;

  constructor(id: string, name: string, endpoints: NodeEndpoints<In, Out>) {
    this.id = id;
    this.name = name;
    this.endpoints = endpoints;
  }

  // 子类实现处理逻辑
  abstract handle(endpoint: keyof In & string, msg: Message): Promise<Message[]>;

  // 设置错误处理器
  setErrorHandler(handler: (error: Error) => Promise<void>): void {
    this.errorHandler = handler;
  }

  // 内部错误处理
  async handleError(error: Error): Promise<void> {
    this.status = 'error';
    if (this.errorHandler) {
      await this.errorHandler(error);
    } else {
      const hook = (this as unknown as { onError?: (error: Error) => Promise<void> }).onError;
      if (hook) {
        await hook(error);
      }
    }
  }

  // 生命周期
  async start(): Promise<void> {
    this.status = 'running';
    const hook = (this as unknown as { onStart?: () => Promise<void> }).onStart;
    if (hook) {
      await hook();
    }
  }

  async stop(): Promise<void> {
    this.status = 'stopped';
    const hook = (this as unknown as { onStop?: () => Promise<void> }).onStop;
    if (hook) {
      await hook();
    }
  }

  // 检查端点是否存在
  hasInEndpoint(name: string & keyof In): boolean {
    return name in this.endpoints.in;
  }

  hasOutEndpoint(name: string & keyof Out): boolean {
    return name in this.endpoints.out;
  }

  // 获取完整端点名称
  inEndpoint(name: string & keyof In): string {
    return `in.${name}`;
  }

  outEndpoint(name: string & keyof Out): string {
    return `out.${name}`;
  }

  // 全名（用于边连接）
  fullName(prefix?: string): string {
    return prefix ? `${prefix}.${this.name}` : this.name;
  }
}

// 简单函数式节点（无需继承）
export type NodeHandler<In extends InEndpoints, Out extends OutEndpoints> = (
  endpoint: keyof In & string,
  msg: Message
) => Promise<Message[]>;

// 创建函数式节点
export function createNode<In extends InEndpoints, Out extends OutEndpoints>(
  id: string,
  name: string,
  endpoints: NodeEndpoints<In, Out>,
  handler: NodeHandler<In, Out>
): Node<In, Out> {
  return new (class extends Node<In, Out> {
    async handle(endpoint: keyof In & string, msg: Message): Promise<Message[]> {
      return handler(endpoint, msg);
    }
  })(id, name, endpoints);
}
