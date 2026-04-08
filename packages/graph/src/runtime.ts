import type { Graph } from './graph.js';
import type { Message } from './types.js';
import { createMessage } from './types.js';

// Superstep 状态
export interface SuperstepState {
  number: number;
  activeNodes: Set<string>;
  messages: Message[];
  startTime: number;
  endTime?: number;
}

// 运行时配置
export interface RuntimeConfig {
  maxSupersteps?: number;        // 最大 superstep 数
  syncTimeout?: number;          // 同步等待超时 (ms)
  enableLogging?: boolean;       // 启用日志
}

// BSP 执行引擎
export class Runtime {
  private graph: Graph;
  private config: RuntimeConfig;
  private currentSuperstep: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private superstepHistory: SuperstepState[] = [];
  private haltedNodes: Set<string> = new Set();

  // 消息队列（每个节点一个队列）
  private messageQueues: Map<string, Message[]> = new Map();

  // 投票状态
  private nodeVotes: Map<string, 'vote-halt' | 'vote-continue'> = new Map();

  constructor(graph: Graph, config: RuntimeConfig = {}) {
    this.graph = graph;
    this.config = {
      maxSupersteps: config.maxSupersteps ?? 100,
      syncTimeout: config.syncTimeout ?? 30000,
      enableLogging: config.enableLogging ?? true,
    };
  }

  // 启动执行
  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    
    if (this.config.enableLogging) {
      console.log(`[Runtime] Starting graph: ${this.graph.name}`);
    }

    // 初始化节点消息队列
    for (const node of this.graph.getNodes()) {
      this.messageQueues.set(node.id, []);
    }

    // 启动图
    await this.graph.start();

    // 执行 BSP 循环
    await this.runBSP();
  }

  // 停止执行
  async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;
    
    if (this.config.enableLogging) {
      console.log(`[Runtime] Stopping graph: ${this.graph.name}`);
    }

    await this.graph.stop();
  }

  // 暂停执行
  pause(): void {
    this.isPaused = true;
  }

  // 恢复执行
  resume(): void {
    this.isPaused = false;
  }

  // 发送消息到指定节点
  sendMessage(targetNodeId: string, msg: Message): void {
    const queue = this.messageQueues.get(targetNodeId) ?? [];
    queue.push(msg);
    this.messageQueues.set(targetNodeId, queue);
  }

  // BSP 主循环
  private async runBSP(): Promise<void> {
    while (this.isRunning && !this.isPaused) {
      // 检查是否达到最大 superstep
      if (this.currentSuperstep >= (this.config.maxSupersteps ?? 100)) {
        if (this.config.enableLogging) {
          console.log(`[Runtime] Max supersteps (${this.config.maxSupersteps}) reached`);
        }
        break;
      }

      // 超级步开始
      this.currentSuperstep++;
      const superstepState: SuperstepState = {
        number: this.currentSuperstep,
        activeNodes: new Set(),
        messages: [],
        startTime: Date.now(),
      };

      if (this.config.enableLogging) {
        console.log(`[Runtime] Superstep ${this.currentSuperstep} started`);
      }

      // 1. GATHER: 收集消息（消息已在队列中）

      // 2. APPLY: 执行每个活跃节点
      const nodes = this.graph.getNodes();
      const haltedThisStep: string[] = [];

      for (const node of nodes) {
        // 检查是否有消息
        const queue = this.messageQueues.get(node.id) ?? [];
        if (queue.length === 0 && this.haltedNodes.has(node.id)) {
          // 节点已停止且无消息，跳过
          continue;
        }

        // 处理队列中的所有消息
        const messagesToProcess = [...queue];
        this.messageQueues.set(node.id, []);

        for (const msg of messagesToProcess) {
          try {
            const outputMessages = await node.handle(msg.endpoint as any, msg);
            
            // 处理输出消息
            for (const outMsg of outputMessages) {
              const enrichedMsg = createMessage({
                ...outMsg,
                endpoint: `${node.id}.${outMsg.endpoint}`,
              });
              
              superstepState.messages.push(enrichedMsg);
              this.graph.sendFromNode(node.id, enrichedMsg);
            }

            superstepState.activeNodes.add(node.id);
          } catch (error) {
            console.error(`[Runtime] Error in node ${node.id}:`, error);
            await node.handleError?.(error as Error);
          }
        }

        // 投票：检查节点是否应该停止
        // 这里简单实现：只有显式调用 halt 才停止
        if (this.nodeVotes.get(node.id) === 'vote-halt' && queue.length === 0) {
          haltedThisStep.push(node.id);
        }
      }

      // 3. SCATTER: 同步屏障 - 等待所有节点完成
      await this.synchronize();

      // 更新停止的节点
      for (const nodeId of haltedThisStep) {
        this.haltedNodes.add(nodeId);
      }

      superstepState.endTime = Date.now();

      // 检查是否所有节点都停止了
      if (this.haltedNodes.size === nodes.length) {
        if (this.config.enableLogging) {
          console.log(`[Runtime] All nodes halted, terminating`);
        }
        break;
      }

      // 记录历史
      this.superstepHistory.push(superstepState);

      if (this.config.enableLogging) {
        console.log(`[Runtime] Superstep ${this.currentSuperstep} completed in ${superstepState.endTime - superstepState.startTime}ms`);
      }
    }
  }

  // 同步屏障
  private async synchronize(): Promise<void> {
    // 在单机实现中，同步是即时的
    // 在分布式实现中，这里会等待所有 worker 完成
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  // 节点投票停止
  voteHalt(nodeId: string): void {
    this.nodeVotes.set(nodeId, 'vote-halt');
  }

  // 节点投票继续
  voteContinue(nodeId: string): void {
    this.nodeVotes.set(nodeId, 'vote-continue');
  }

  // 获取当前 superstep
  getCurrentSuperstep(): number {
    return this.currentSuperstep;
  }

  // 获取执行历史
  getHistory(): SuperstepState[] {
    return [...this.superstepHistory];
  }

  // 获取运行时状态
  getStatus(): {
    isRunning: boolean;
    isPaused: boolean;
    currentSuperstep: number;
    haltedNodes: number;
    totalNodes: number;
  } {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentSuperstep: this.currentSuperstep,
      haltedNodes: this.haltedNodes.size,
      totalNodes: this.graph.getNodes().length,
    };
  }
}

// 运行时构建器
export class RuntimeBuilder {
  private graph?: Graph;
  private config: RuntimeConfig = {};

  withGraph(graph: Graph): this {
    this.graph = graph;
    return this;
  }

  withConfig(config: RuntimeConfig): this {
    this.config = { ...this.config, ...config };
    return this;
  }

  build(): Runtime {
    if (!this.graph) {
      throw new Error('Graph is required');
    }
    return new Runtime(this.graph, this.config);
  }
}
