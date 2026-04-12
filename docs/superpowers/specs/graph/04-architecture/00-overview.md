# 核心架构概览

---

## 1. 整体架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Graph Runtime                               │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                     Graph Manager                            │    │
│  │                                                              │    │
│  │  • 图注册/注销           • 节点生命周期管理                   │    │
│  │  • 版本控制              • 快照管理                          │    │
│  │  • 运行时配置            • 扩展点                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                      │
│  ┌───────────────────────────┼───────────────────────────────────┐  │
│  │                    Superstep Executor                         │  │
│  │                                                            │  │
│  │   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   │  │
│  │   │ Node A  │   │ Node B  │   │ Node C  │   │ Node D  │   │  │
│  │   │Endpoints│   │Endpoints│   │Endpoints│   │Endpoints│   │  │
│  │   │ ┌─────┐ │   │ ┌─────┐ │   │ ┌─────┐ │   │ ┌─────┐ │   │  │
│  │   │ │in:_*│ │   │ │in:_*│ │   │ │in:_*│ │   │ │in:_*│ │   │  │
│  │   │ └─────┘ │   │ └─────┘ │   │ └─────┘ │   │ └─────┘ │   │  │
│  │   │ ┌─────┐ │   │ ┌─────┐ │   │ ┌─────┐ │   │ ┌─────┐ │   │  │
│  │   │ │out:_│ │   │ │out:_│ │   │ │out:_│ │   │ │out:_│ │   │  │
│  │   │ └─────┘ │   │ └─────┘ │   │ └─────┘ │   │ └─────┘ │   │  │
│  │   └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘   │  │
│  │        │             │             │             │         │  │
│  │        └─────────────┼─────────────┼─────────────┘         │  │
│  │                      ▼                                      │  │
│  │              ┌───────────────┐                              │  │
│  │              │ Message Router│                              │  │
│  │              │               │                              │  │
│  │              │ • Route       │                              │  │
│  │              │ • Broadcast   │                              │  │
│  │              │ • Subscribe    │                              │  │
│  │              └───────┬───────┘                              │  │
│  │                      │                                      │  │
│  │   ┌─────────────────┼─────────────────┐                   │  │
│  │   │                 ▼                 │                   │  │
│  │   │  ┌─────────────────────────────┐  │                   │  │
│  │   │  │   Checkpoint Manager        │  │                   │  │
│  │   │  │                             │  │                   │  │
│  │   │  │  • Full Checkpoint         │  │                   │  │
│  │   │  │  • Incremental Checkpoint   │  │                   │  │
│  │   │  │  • Recovery                  │  │                   │  │
│  │   │  │  • GC                       │  │                   │  │
│  │   │  └─────────────────────────────┘  │                   │  │
│  │   └────────────────────────────────────┘                   │  │
│  │                      │                                      │  │
│  └──────────────────────┼──────────────────────────────────────┘  │
│                         │                                         │
└─────────────────────────┼───────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │   Redis  │   │  Kafka  │   │ Postgres │
    │ (Cache)  │   │ (Queue) │   │  (Store) │
    └──────────┘   └──────────┘   └──────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │   S3/MinIO   │
                   │ (Checkpoint) │
                   └──────────────┘
```

---

## 2. 核心组件

### 2.1 Graph Manager

负责图的创建、生命周期管理。

```typescript
interface GraphManager {
  createGraph(def: GraphDefinition): Graph;
  getGraph(id: string): Graph | null;
  deleteGraph(id: string): void;
  
  addNode(graphId: string, node: NodeDefinition): void;
  removeNode(graphId: string, nodeId: string): void;
  
  compile(graphId: string): CompiledGraph;
  execute(graphId: string, input?: unknown): Promise<void>;
}
```

### 2.2 Node

节点是图中的计算单元。

```typescript
interface Node {
  id: string;
  type: string;
  endpoints: NodeEndpoints;
  
  handle(endpoint: string, message: unknown): Promise<NodeResponse>;
  getState(): NodeState;
  setState(state: NodeState): void;
}
```

### 2.3 Endpoint / Slot

端点是节点的消息接口，支持类型安全。

```typescript
interface Slot<T = unknown> {
  name: string;
  direction: 'in' | 'out';
  payloadType: T;
}

interface NodeEndpoints {
  in: Record<string, Slot>;
  out: Record<string, Slot>;
}
```

### 2.4 Message Router

消息路由器负责消息的路由和分发。

```typescript
interface MessageRouter {
  send(msg: TypedMessage): Promise<void>;
  subscribe(
    nodeId: string, 
    endpoint: string, 
    handler: (msg: TypedMessage) => void
  ): Promise<Unsubscribe>;
  broadcast(msg: TypedMessage): Promise<void>;
}
```

### 2.5 Checkpoint Manager

检查点管理器负责状态持久化和恢复。

```typescript
interface CheckpointManager {
  saveFull(checkpoint: FullCheckpoint): Promise<string>;
  saveIncremental(checkpoint: IncrementalCheckpoint): Promise<string>;
  restore(id: string): Promise<FullCheckpoint>;
  gc(graphId: string, keepCount: number): Promise<void>;
}
```

---

## 3. 组件关系

```
┌─────────────────────────────────────────────────────────────────┐
│                       Graph Manager                              │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Graph    │  │    Node     │  │   Router    │            │
│  │  Registry  │  │  Registry   │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│         │                │                │                     │
│         │                │                │                     │
│         ▼                ▼                ▼                     │
│  ┌─────────────────────────────────────────────────┐           │
│  │              Superstep Executor                 │           │
│  │                                                  │           │
│  │  1. Route Messages                               │           │
│  │  2. Barrier                                     │           │
│  │  3. Execute Nodes                                │           │
│  │  4. Merge States                                │           │
│  │  5. Checkpoint (optional)                        │           │
│  │                                                  │           │
│  └─────────────────────────────────────────────────┘           │
│                            │                                     │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────┐           │
│  │            Checkpoint Manager                    │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. 执行上下文

```typescript
interface ExecutionContext {
  graphId: string;
  superstep: number;
  
  // 节点状态
  nodeStates: Map<string, NodeState>;
  
  // 消息
  pendingMessages: TypedMessage[];
  
  // Checkpoint
  lastCheckpoint?: Checkpoint;
  
  // 统计
  stats: ExecutionStats;
}
```

---

## 5. 相关文档

- [Graph 图](../02-concepts/00-graph.md)
- [Node 节点](../02-concepts/01-node.md)
- [Endpoint 端点](../02-concepts/02-endpoint.md)
- [Message 消息](../02-concepts/03-message.md)
- [Superstep 超步骤](../02-concepts/04-superstep.md)
