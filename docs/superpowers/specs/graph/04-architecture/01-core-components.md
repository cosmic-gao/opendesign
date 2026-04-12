# 核心组件详细设计

---

## 1. GraphManager

### 1.1 接口定义

```typescript
interface GraphManager {
  // 图生命周期
  createGraph(definition: GraphDefinition): Graph;
  getGraph(graphId: string): Graph | null;
  deleteGraph(graphId: string): void;
  
  // 节点管理
  addNode(graphId: string, node: NodeDefinition): void;
  removeNode(graphId: string, nodeId: string): void;
  getNode(graphId: string, nodeId: string): NodeDefinition | null;
  
  // 边管理
  addEdge(graphId: string, edge: Edge): void;
  removeEdge(graphId: string, edgeId: string): void;
  
  // 执行控制
  compile(graphId: string, options?: CompileOptions): CompiledGraph;
  execute(graphId: string, input?: unknown): Promise<ExecutionResult>;
  pause(graphId: string): Promise<void>;
  resume(graphId: string): Promise<void>;
  stop(graphId: string): Promise<void>;
  
  // 状态查询
  getState(graphId: string): GraphState;
  getNodeState(graphId: string, nodeId: string): NodeState | null;
  
  // 快照
  createSnapshot(graphId: string): Promise<string>;
  restoreSnapshot(snapshotId: string): Promise<void>;
}
```

### 1.2 实现

```typescript
class DefaultGraphManager implements GraphManager {
  private graphs = new Map<string, Graph>();
  private nodeRegistry: NodeRegistry;
  private router: MessageRouter;
  private checkpointManager: CheckpointManager;
  
  createGraph(definition: GraphDefinition): Graph {
    const graph = new Graph(definition, {
      nodeRegistry: this.nodeRegistry,
      router: this.router,
      checkpointManager: this.checkpointManager
    });
    this.graphs.set(definition.id, graph);
    return graph;
  }
  
  execute(graphId: string, input?: unknown): Promise<ExecutionResult> {
    const graph = this.graphs.get(graphId);
    if (!graph) {
      throw new Error(`Graph ${graphId} not found`);
    }
    return graph.execute(input);
  }
}
```

---

## 2. Graph

### 2.1 接口定义

```typescript
interface Graph {
  readonly id: string;
  readonly definition: GraphDefinition;
  readonly state: GraphState;
  
  // 执行
  compile(options?: CompileOptions): CompiledGraph;
  execute(input?: unknown): Promise<ExecutionResult>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  
  // 节点操作
  addNode(node: NodeDefinition): void;
  removeNode(nodeId: string): void;
  
  // 边操作
  addEdge(edge: Edge): void;
  removeEdge(edgeId: string): void;
  
  // 状态
  getState(): GraphState;
  getNodeState(nodeId: string): NodeState | null;
}
```

### 2.2 实现

```typescript
class DefaultGraph implements Graph {
  private executor: SuperstepExecutor;
  private state: GraphState;
  
  constructor(
    public readonly definition: GraphDefinition,
    private dependencies: GraphDependencies
  ) {
    this.state = this.createInitialState();
    this.executor = new SuperstepExecutor(this, dependencies);
  }
  
  async execute(input?: unknown): Promise<ExecutionResult> {
    this.state.status = 'running';
    this.state.startedAt = Date.now();
    
    try {
      // 发送初始输入
      await this.sendToInputNodes(input);
      
      // 执行超步骤循环
      await this.executor.execute();
      
      this.state.status = 'completed';
      this.state.completedAt = Date.now();
      
      return { success: true, finalState: this.state };
    } catch (error) {
      this.state.status = 'failed';
      return { success: false, error };
    }
  }
  
  private async sendToInputNodes(input: unknown): Promise<void> {
    const inputNodes = this.definition.nodes.values()
      .filter(n => n.type === 'system:input');
    
    for (const node of inputNodes) {
      await this.dependencies.router.send({
        targetNodeId: node.id,
        targetEndpoint: 'in',
        payload: input
      });
    }
  }
}
```

---

## 3. NodeRegistry

### 3.1 接口定义

```typescript
interface NodeRegistry {
  register(definition: NodeDefinition): Promise<void>;
  unregister(nodeId: string): Promise<void>;
  get(nodeId: string): Promise<NodeDefinition | null>;
  getAll(): Promise<NodeDefinition[]>;
  
  // 状态管理
  getState(nodeId: string): Promise<NodeState | null>;
  setState(nodeId: string, state: NodeState): Promise<void>;
  updateState(nodeId: string, updates: Partial<NodeState>): Promise<void>;
  
  // 状态批量操作
  getAllStates(): Promise<Map<string, NodeState>>;
  restoreStates(states: Map<string, NodeState>): Promise<void>;
}
```

### 3.2 实现

```typescript
class DefaultNodeRegistry implements NodeRegistry {
  private nodes = new Map<string, NodeDefinition>();
  private states = new Map<string, NodeState>();
  
  async register(definition: NodeDefinition): Promise<void> {
    this.nodes.set(definition.id, definition);
    this.states.set(definition.id, {
      nodeId: definition.id,
      status: 'idle',
      version: 0,
      lastCheckpointSuperstep: -1,
      inputSlots: new Map(),
      outputSlots: new Map(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
  
  async setState(nodeId: string, state: NodeState): Promise<void> {
    state.updatedAt = Date.now();
    state.version++;
    this.states.set(nodeId, state);
  }
}
```

---

## 4. MessageRouter

### 4.1 接口定义

```typescript
interface MessageRouter {
  // 发送消息
  send(msg: TypedMessage): Promise<void>;
  sendBatch(messages: TypedMessage[]): Promise<void>;
  
  // 订阅
  subscribe(
    nodeId: string,
    endpoint: string,
    handler: (msg: TypedMessage) => void
  ): Promise<Unsubscribe>;
  
  // 广播
  broadcast(msg: TypedMessage): Promise<void>;
  
  // 节点注册/注销
  registerNode(nodeId: string, endpoints: string[]): Promise<void>;
  unregisterNode(nodeId: string): Promise<void>;
  
  // 统计
  getStats(): RouterStats;
}

interface RouterStats {
  totalMessagesSent: number;
  totalMessagesDelivered: number;
  totalMessagesFailed: number;
  queueSize: Map<string, number>;
  avgLatencyMs: number;
}
```

### 4.2 Redis 实现

```typescript
class RedisMessageRouter implements MessageRouter {
  private publisher: Redis;
  private subscriber: Redis;
  private subscriptions = new Map<string, Set<Handler>>();
  
  async send(msg: TypedMessage): Promise<void> {
    const channel = this.getChannel(msg.targetNodeId, msg.targetEndpoint);
    await this.publisher.publish(channel, JSON.stringify(msg));
  }
  
  async subscribe(
    nodeId: string,
    endpoint: string,
    handler: Handler
  ): Promise<Unsubscribe> {
    const key = `${nodeId}:${endpoint}`;
    
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
      await this.subscriber.subscribe(`node:${key}`);
    }
    
    this.subscriptions.get(key)!.add(handler);
    
    return async () => {
      this.subscriptions.get(key)?.delete(handler);
      if (this.subscriptions.get(key)?.size === 0) {
        await this.subscriber.unsubscribe(`node:${key}`);
        this.subscriptions.delete(key);
      }
    };
  }
  
  private getChannel(nodeId: string, endpoint?: string): string {
    return `node:${nodeId}:${endpoint || 'default'}`;
  }
}
```

---

## 5. CheckpointManager

### 5.1 接口定义

```typescript
interface CheckpointManager {
  // 保存
  saveFull(checkpoint: FullCheckpoint): Promise<string>;
  saveIncremental(checkpoint: IncrementalCheckpoint): Promise<string>;
  
  // 恢复
  restore(checkpointId: string): Promise<FullCheckpoint>;
  
  // 查询
  getLatest(graphId: string): Promise<FullCheckpoint | null>;
  getBySuperstep(graphId: string, superstep: number): Promise<FullCheckpoint | null>;
  getHistory(graphId: string, limit?: number): Promise<CheckpointMetadata[]>;
  
  // 垃圾回收
  gc(graphId: string, keepCount: number): Promise<void>;
}
```

### 5.2 实现

```typescript
class DistributedCheckpointManager implements CheckpointManager {
  private redis: Redis;
  private postgres: Postgres;
  private s3: S3;
  
  async saveFull(checkpoint: FullCheckpoint): Promise<string> {
    const id = this.generateId(checkpoint);
    
    // 1. 保存元数据到 PostgreSQL
    await this.postgres.query(
      `INSERT INTO checkpoints (id, graph_id, superstep, timestamp, checksum)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, checkpoint.graphId, checkpoint.superstep, checkpoint.timestamp, checkpoint.checksum]
    );
    
    // 2. 保存状态到 S3
    const stateKey = `checkpoints/${checkpoint.graphId}/${id}/state.json`;
    await this.s3.putObject(stateKey, JSON.stringify({
      nodeStates: Array.from(checkpoint.nodeStates.entries()),
      edgeStates: Array.from(checkpoint.edgeStates.entries())
    }));
    
    // 3. 更新 Redis 索引
    await this.redis.set(`latest:${checkpoint.graphId}`, id);
    
    return id;
  }
  
  async restore(checkpointId: string): Promise<FullCheckpoint> {
    const meta = await this.postgres.query(
      'SELECT * FROM checkpoints WHERE id = $1',
      [checkpointId]
    );
    
    const stateKey = `checkpoints/${meta.graph_id}/${checkpointId}/state.json`;
    const stateData = await this.s3.getObject(stateKey);
    
    return {
      id: checkpointId,
      graphId: meta.graph_id,
      superstep: meta.superstep,
      nodeStates: new Map(stateData.nodeStates),
      edgeStates: new Map(stateData.edgeStates),
      timestamp: meta.timestamp,
      checksum: meta.checksum
    };
  }
}
```

---

## 6. 依赖关系

```
┌─────────────────────────────────────────────────────────────────┐
│                       组件依赖关系                               │
│                                                                  │
│  GraphManager                                                    │
│       │                                                          │
│       ├──► Graph ──► SuperstepExecutor                           │
│       │                  │                                        │
│       │                  ├──► NodeExecutor                        │
│       │                  │        │                                │
│       │                  │        └──► NodeHandler                │
│       │                  │                                         │
│       │                  ├──► MessageRouter                       │
│       │                  │        │                                │
│       │                  │        ├──► Redis / Kafka              │
│       │                  │        └──► Subscriptions              │
│       │                  │                                         │
│       │                  └──► CheckpointManager                   │
│       │                           │                                │
│       │                           ├──► Redis                       │
│       │                           ├──► PostgreSQL                  │
│       │                           └──► S3 / MinIO                │
│       │                                                          │
│       └──► NodeRegistry ──► Nodes / States                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. 相关文档

- [核心架构概览](./00-overview.md)
- [执行流程](./02-execution-flow.md)
- [Checkpoint 机制](../06-fault-tolerance/00-checkpoint.md)
