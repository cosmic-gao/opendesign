# Graph 图

---

## 1. 概念定义

Graph（图）是框架的核心抽象，由节点（Node）和边（Edge）组成的有向图结构。

---

## 2. 类型定义

```typescript
interface GraphDefinition {
  id: string;                           // 图实例唯一标识
  name: string;                          // 图名称
  version: number;                       // 版本号（乐观锁）
  
  // 组成元素
  nodes: Map<string, NodeDefinition>;    // 节点定义
  edges: Edge[];                         // 边定义
  
  // 配置
  config: GraphConfig;
  
  // 元数据
  metadata?: Record<string, unknown>;
}

interface GraphConfig {
  maxSupersteps?: number;                 // 最大超步骤数，默认 10000
  checkpointFrequency?: number;          // checkpoint 频率
  defaultTimeout?: number;               // 默认超时时间
}
```

---

## 3. 边定义

### 3.1 Edge 抽象基类（轻量设计）

```typescript
// Edge 抽象基类
abstract class Edge {
  readonly id: string;
  readonly source: Endpoint;              // 源端点（使用 Endpoint 实体类）
  readonly target: Endpoint | '*';         // 目标端点或 '*' 表示广播

  constructor(id: string, source: Endpoint, target: Endpoint | '*') {
    this.id = id;
    this.source = source;
    this.target = target;
  }

  abstract readonly type: string;           // 边类型标识

  // 判断是否为广播边
  isBroadcast(): boolean {
    return this.target === '*';
  }

  // 匹配消息
  abstract matches(msg: Message, sourceNodeId: string): boolean;
}

// 直接边 - 点对点连接
class DirectEdge extends Edge {
  readonly type = 'direct';

  matches(msg: Message, sourceNodeId: string): boolean {
    const msgEndpoint = `${sourceNodeId}.${msg.endpoint}`;
    const sourceEndpoint = this.source.fullName();
    return msgEndpoint === sourceEndpoint && !this.isBroadcast();
  }
}

// 边的路由行为在 Router 中处理，Edge 本身保持简单
```

### 3.2 边与广播的说明

**广播边的设计决策**：
- 广播（`target: '*'`）是路由层的特殊标记，不单独作为 Edge 类型
- 广播只在 **推模式（Push）** 场景下有意义
- 拉模式（Pull）使用点对点的请求-响应，不需要广播

| 模式 | 广播需要 | 说明 |
|------|---------|------|
| 推模式 | 是 | 生产者主动推送，广播到多个消费者 |
| 拉模式 | 否 | 消费者主动拉取，点对点请求-响应 |

### 3.3 简化边定义（旧版接口 - 兼容）

```typescript
// 向后兼容的接口定义
interface Edge {
  id: string;
  source: string;  // e.g., "NodeA.out:llm"
  target: string;  // e.g., "NodeB.in:tool" or "*"
}
```

---

## 4. 图状态

```typescript
interface GraphState {
  graphId: string;
  version: number;
  
  // 执行状态
  status: GraphStatus;
  currentSuperstep: number;
  
  // 节点状态
  nodeStates: Map<string, NodeState>;
  
  // 统计
  stats: GraphStats;
  
  // 时间戳
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
}

type GraphStatus = 
  | 'created'     // 创建完成
  | 'starting'    // 启动中
  | 'running'     // 运行中
  | 'paused'      // 暂停
  | 'completed'  // 执行完成
  | 'failed';     // 执行失败

interface GraphStats {
  totalMessages: number;
  completedNodes: number;
  failedNodes: number;
  totalDuration?: number;
}
```

---

## 5. 图操作

```typescript
interface GraphManager {
  // 图管理
  createGraph(definition: GraphDefinition): Promise<Graph>;
  getGraph(graphId: string): Promise<Graph | null>;
  deleteGraph(graphId: string): Promise<void>;
  
  // 节点管理
  addNode(node: NodeDefinition): Promise<void>;
  removeNode(nodeId: string): Promise<void>;
  getNode(nodeId: string): Promise<NodeDefinition | null>;
  
  // 边管理
  addEdge(edge: Edge): Promise<void>;
  removeEdge(edgeId: string): Promise<void>;
  
  // 执行控制
  start(input?: unknown): Promise<void>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  
  // 状态查询
  getState(): Promise<GraphState>;
  getNodeState(nodeId: string): Promise<NodeState | null>;
}
```

---

## 6. 图的构建

```typescript
// 构建示例
const graph = new GraphDefinition({
  id: 'llm-workflow',
  name: 'LLM Agent Workflow',
  nodes: new Map([
    ['user', { id: 'user', type: 'system:input', ... }],
    ['llm', { id: 'llm', type: 'ai:llm', ... }],
    ['tool', { id: 'tool', type: 'ai:tool', ... }],
  ]),
  edges: [
    {
      id: 'e1',
      source: { nodeId: 'user', endpoint: 'out' },
      target: { nodeId: 'llm', endpoint: 'in:user' },
      type: 'data'
    },
    {
      id: 'e2',
      source: { nodeId: 'llm', endpoint: 'out:tool' },
      target: { nodeId: 'tool', endpoint: 'in' },
      type: 'data'
    }
  ]
});
```

---

## 7. 子图设计

支持层次化，子图可以嵌套：

```typescript
interface Subgraph extends GraphDefinition {
  parentNodeId?: string;           // 父节点 ID（如果有）
  childSubgraphs?: string[];       // 子图 ID 列表
}

// 子图示例
const codeGraph = new Subgraph({
  id: 'code-analysis',
  name: 'Code Analysis Subgraph',
  nodes: new Map([
    ['parser', { id: 'parser', type: 'code:file', ... }],
    ['analyzer', { id: 'analyzer', type: 'logic:parallel', ... }],
  ]),
  edges: [...]
});
```

---

## 8. 相关文档

- [Node 节点](./01-node.md)
- [Endpoint 端点设计](./02-endpoint.md)
- [Edge 边](#) - 边的连接方式待确认
