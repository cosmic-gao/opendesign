# Node 节点

---

## 1. 概念定义

Node（节点）是图中的基本计算单元，每个节点维护自己的状态，通过端点（Endpoint）接收和发送消息。

---

## 2. 类型定义

```typescript
// 节点定义
interface NodeDefinition<In extends Endpoints, Out extends Endpoints> {
  id: string;
  type: NodeType;
  name?: string;
  endpoints: NodeEndpoints<In, Out>;
  handler: NodeHandler<In, Out>;
  metadata?: Record<string, unknown>;
}

// 节点类型
type NodeType = 
  // 代码场景
  | 'code:file' | 'code:function' | 'code:class' | 'code:import'
  // 逻辑场景
  | 'logic:condition' | 'logic:loop' | 'logic:parallel' | 'logic:sequence'
  // AI 场景
  | 'ai:llm' | 'ai:tool' | 'ai:memory' | 'ai:router' | 'ai:human'
  // 系统
  | 'system:input' | 'system:output' | 'system:transform';
```

---

## 3. 节点状态

```typescript
interface NodeState {
  nodeId: string;
  
  // 端点状态
  inputSlots: Map<string, InputSlotState>;
  outputSlots: Map<string, OutputSlotState>;
  
  // 执行状态
  status: NodeStatus;
  version: number;                    // 乐观锁版本
  lastCheckpointSuperstep: number;    // 上次 checkpoint 的超步骤号
  
  // 错误处理
  error?: ExecutionError;
  
  // 时间戳
  createdAt: number;
  updatedAt: number;
}

type NodeStatus = 
  | 'idle'        // 等待消息
  | 'running'     // 正在处理
  | 'waiting'     // 等待条件满足（如人工介入）
  | 'completed'    // 执行完成
  | 'failed';     // 执行失败
```

---

## 4. 节点处理器

```typescript
// 节点处理器接口
interface NodeHandler<In extends Endpoints, Out extends Endpoints> {
  // 处理消息，返回状态更新
  onMessage(
    endpoint: keyof In,
    message: In[keyof In]['payloadType'],
    state: NodeState
  ): Promise<NodeResponse<Out>>;
  
  // 可选：超步骤开始时的行为
  onSuperstepBegin?(state: NodeState): void;
  
  // 可选：超步骤结束时的行为
  onSuperstepEnd?(state: NodeState): void;
  
  // 可选：恢复时的特殊处理
  onRestore?(state: NodeState, checkpoint: CheckpointSnapshot): void;
  
  // 可选：节点被激活
  onActivate?(state: NodeState): void;
  
  // 可选：节点被停用
  onDeactivate?(state: NodeState): void;
}

// 节点响应
interface NodeResponse<Out extends Endpoints> {
  // 状态更新
  updates?: Partial<NodeState>;
  
  // 发送的消息（按端点分组）
  messages?: Partial<{
    [K in keyof Out]: Out[K]['payloadType'][];
  }>;
  
  // 动作
  action?: 'continue' | 'wait' | 'complete' | 'fail';
}
```

---

## 5. 节点执行

```typescript
class NodeExecutor<In extends Endpoints, Out extends Endpoints> {
  constructor(
    private node: NodeDefinition<In, Out>,
    private state: NodeState,
    private handler: NodeHandler<In, Out>,
    private router: MessageRouter,
    private checkpointManager: CheckpointManager
  ) {}
  
  // 处理输入端点队列中的消息
  async processEndpoint(endpointName: keyof In): Promise<void> {
    const slot = this.state.inputSlots.get(endpointName as string);
    if (!slot) return;
    
    // 取出消息
    while (slot.queue.length > 0) {
      const msg = slot.queue.shift()!;
      
      try {
        // 调用处理器
        const response = await this.handler.onMessage(
          endpointName,
          msg.payload as In[keyof In]['payloadType'],
          this.state
        );
        
        // 处理响应
        await this.handleResponse(response);
        
      } catch (error) {
        // 错误处理
        await this.handleError(error, msg);
      }
    }
  }
  
  // 执行整个超步骤
  async executeSuperstep(): Promise<SuperstepResult> {
    // 1. 处理所有输入端点
    for (const endpointName of Object.keys(this.node.endpoints.in)) {
      await this.processEndpoint(endpointName);
    }
    
    // 2. 通知超步骤结束
    if (this.handler.onSuperstepEnd) {
      this.handler.onSuperstepEnd(this.state);
    }
    
    return { nodeId: this.node.id, success: this.state.status !== 'failed' };
  }
}
```

---

## 6. 节点生命周期

```
                    ┌─────────────┐
                    │   创建      │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
              ┌────►│   激活     │
              │     └──────┬──────┘
              │            │
              │            ▼
              │     ┌─────────────┐
              │     │   Idle     │◄────────────────┐
              │     └──────┬──────┘                 │
              │            │ 收到消息               │处理完成/超时
              │            ▼                         │
              │     ┌─────────────┐                   │
              │     │  Running   │───────────────────┤
              │     └──────┬──────┘                   │
              │            │                          │
              │     ┌──────┴──────┐                  │
              │     │              │                  │
              │     ▼              ▼                  │
              │ ┌────────┐   ┌────────┐            │
              │ │ Failed │   │Waiting │            │
              │ └────────┘   └───┬────┘            │
              │                 │ 收到信号            │
              │                 └───────────────────┘
              │                                          │
              │     ┌─────────────┐                      │
              └─────┤  Completed  │──────────────────────┘
                    └─────────────┘                    重新激活
```

---

## 7. 节点注册表

```typescript
interface NodeRegistry {
  register(definition: NodeDefinition): Promise<void>;
  unregister(nodeId: string): Promise<void>;
  get(nodeId: string): Promise<NodeDefinition | null>;
  getAll(): Promise<NodeDefinition[]>;
  updateState(nodeId: string, state: NodeState): Promise<void>;
  getState(nodeId: string): Promise<NodeState | null>;
}
```

---

## 8. 相关文档

- [Endpoint 端点设计](./02-endpoint.md)
- [Message 消息](./03-message.md)
- [Superstep 超步骤](./04-superstep.md)
