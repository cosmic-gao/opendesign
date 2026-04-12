# Superstep 超步骤

---

## 1. 概念定义

Superstep（超步骤）是 BSP (Bulk Synchronous Parallel) 模型中的基本执行周期。每个超步骤包含三个阶段：本地计算、通信同步。

---

## 2. BSP 模型

BSP (Bulk Synchronous Parallel) 是一种并行计算模型：

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BSP 超步骤模型                                │
│                                                                      │
│   Superstep N                    Superstep N+1                       │
│  ┌────────────────────┐         ┌────────────────────┐           │
│  │  Phase 1: Compute   │         │  Phase 1: Compute   │           │
│  │                     │         │                     │           │
│  │  [A] ──► [B]       │         │  [A] ──► [C]       │           │
│  │   │                 │         │                     │           │
│  │   ▼                 │         │                     │           │
│  │  [C]                │         │                     │           │
│  │                     │         │                     │           │
│  │  所有节点独立计算    │         │  所有节点独立计算    │           │
│  └──────────┬──────────┘         └──────────┬──────────┘           │
│              │                                   │                    │
│  ┌──────────▼──────────┐         ┌──────────▼──────────┐          │
│  │  Phase 2: Barrier    │         │  Phase 2: Barrier    │          │
│  │                      │         │                      │          │
│  │  等待所有节点完成     │         │  等待所有节点完成     │          │
│  │  + 消息路由完成       │         │  + 消息路由完成       │          │
│  │  + 同步点            │         │  + 同步点            │          │
│  └──────────┬──────────┘         └──────────┬──────────┘           │
│              │                                   │                    │
│              ▼                                   ▼                    │
│  ┌────────────────────┐         ┌────────────────────┐             │
│  │  Phase 3: Message   │         │                     │             │
│  │     Routing         │         │                     │             │
│  │                     │         │                     │             │
│  │  A.outbox ──► B    │         │                     │             │
│  │  A.outbox ──► C    │         │                     │             │
│  └────────────────────┘         └─────────────────────┘             │
│                                                                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Superstep 定义

```typescript
interface Superstep {
  number: number;                           // 超步骤序号
  status: SuperstepStatus;
  
  // 执行统计
  nodeResults: Map<string, NodeResult>;     // 各节点执行结果
  messages: TypedMessage[];                  // 本超步骤产生的消息
  
  // 时序
  startTime: number;
  endTime?: number;
  duration?: number;                        // 执行时长（ms）
  
  // Checkpoint
  checkpointId?: string;
  
  // 全局进度
  activeNodes: number;                      // 活跃节点数
  completedNodes: number;                    // 已完成节点数
}

type SuperstepStatus = 
  | 'pending'      // 等待开始
  | 'executing'    // 执行中
  | 'barrier'      // 同步屏障中
  | 'completed'     // 已完成
  | 'failed';      // 执行失败
```

---

## 4. 超步骤执行流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Superstep N 执行流程                              │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ 1. 消息路由 (Message Routing)                                     │  │
│  │                                                                 │  │
│  │   1.1 Router 收集所有节点的 outbox 消息                         │  │
│  │   1.2 按 targetNodeId + targetEndpoint 分发到对应输入队列       │  │
│  │   1.3 广播消息分发到所有订阅节点                                 │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                              │                                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ 2. 同步屏障 (Barrier)                                           │  │
│  │                                                                 │  │
│  │   2.1 等待所有节点完成上一轮执行                                 │  │
│  │   2.2 等待所有消息路由完成                                       │  │
│  │   2.3 验证消息完整性                                             │  │
│  │   2.4 超步骤计数器 +1                                            │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                              │                                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ 3. 节点执行 (Node Execution) - 可并行                             │  │
│  │                                                                 │  │
│  │   [Node A] 处理 in:* ──► onMessage() ──► StateDelta             │  │
│  │   [Node B] 处理 in:* ──► onMessage() ──► StateDelta           │  │
│  │   [Node C] 处理 in:* ──► onMessage() ──► StateDelta           │  │
│  │                                                                 │  │
│  │   （各节点独立执行，可能并行）                                    │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                              │                                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ 4. 状态合并 (State Merge)                                       │  │
│  │                                                                 │  │
│  │   4.1 收集所有节点的 StateDelta                                  │  │
│  │   4.2 按 Reducer 合并状态                                        │  │
│  │   4.3 更新节点状态版本号                                         │  │
│  │   4.4 处理冲突                                                   │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                              │                                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ 5. 检查点 (Checkpoint) - 可选                                    │  │
│  │                                                                 │  │
│  │   if (shouldCheckpoint()) {                                    │  │
│  │     5.1 暂停执行                                                │  │
│  │     5.2 序列化当前状态                                           │  │
│  │     5.3 异步保存到存储                                           │  │
│  │     5.4 记录 checkpoint ID                                        │  │
│  │     5.5 恢复执行                                                 │  │
│  │   }                                                             │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. 状态合并策略 (Reducer)

```typescript
type Reducer<T> = (current: T, update: Partial<T>, options?: ReducerOptions) => T;

interface ReducerOptions {
  version?: number;
  timestamp?: number;
  conflictMode?: 'override' | 'merge' | 'skip';
}

// 内置 Reducers
const reducers = {
  // 默认：覆盖模式
  overwrite: <T extends object>(current: T, update: Partial<T>): T => ({
    ...current,
    ...update
  }),
  
  // 深度合并
  deepMerge: <T extends object>(current: T, update: Partial<T>): T => {
    const result = { ...current };
    for (const key in update) {
      const currentVal = (result as any)[key];
      const updateVal = (update as any)[key];
      
      if (
        typeof currentVal === 'object' && 
        currentVal !== null &&
        typeof updateVal === 'object' && 
        updateVal !== null &&
        !Array.isArray(currentVal) &&
        !Array.isArray(updateVal)
      ) {
        (result as any)[key] = reducers.deepMerge(currentVal, updateVal);
      } else {
        (result as any)[key] = updateVal;
      }
    }
    return result;
  },
  
  // 追加模式（用于数组）
  append: <T extends unknown[]>(current: T, update: unknown[]): T => {
    return [...current, ...update] as T;
  },
  
  // 条件覆盖
  selective: <T extends object>(current: T, update: Partial<T>): T => {
    const result = { ...current };
    for (const key in update) {
      const val = (update as any)[key];
      if (val !== undefined && val !== null) {
        (result as any)[key] = val;
      }
    }
    return result;
  }
};
```

---

## 6. Superstep 执行器

```typescript
class SuperstepExecutor {
  private currentSuperstep: number = 0;
  private maxSupersteps: number = 10000;
  
  async execute(): Promise<void> {
    while (this.shouldContinue()) {
      const superstep = await this.createSuperstep();
      
      try {
        // 1. 消息路由
        await this.routeMessages();
        
        // 2. 同步屏障
        await this.barrier();
        
        // 3. 节点执行
        await this.executeNodes();
        
        // 4. 状态合并
        await this.mergeStates();
        
        // 5. Checkpoint (可选)
        if (this.shouldCheckpoint()) {
          await this.createCheckpoint();
        }
        
        // 更新超步骤号
        this.currentSuperstep++;
        
      } catch (error) {
        await this.handleSuperstepError(error);
        break;
      }
    }
  }
  
  private shouldContinue(): boolean {
    if (this.currentSuperstep >= this.maxSupersteps) return false;
    if (this.allNodesCompleted()) return false;
    return true;
  }
}
```

---

## 7. 端点在 Superstep 中的角色

```
Superstep N:
                    ┌─────────────────────────────────────────────────────┐
                    │                                                      │
   输入端点          │  消息路由到输入端点                                   │
                    │                                                      │
  Node A.in:user  ◄─┼────────────────────────────────────────────────────┤
  Node A.in:tool  ◄─┼────────────────────────────────────────────────────┤
                    │                                                      │
                    ▼                                                      │
              ┌───────────┐                                               │
              │  Handler  │  处理输入端点消息                               │
              └─────┬─────┘                                               │
                    │                                                      │
                    ▼                                                      │
   输出端点          │                                                      │
                    │                                                      │
  Node A.out:llm  ──┼────────────────────────────────────────────────────┤
  Node A.out:tool ──┼────────────────────────────────────────────────────┤
                    │                                                      │
                    └─────────────────────────────────────────────────────┘
                    
Superstep N+1:
   消息被路由到下一个节点...
```

---

## 8. 相关文档

- [Node 节点](./01-node.md)
- [Endpoint 端点设计](./02-endpoint.md)
- [Message 消息](./03-message.md)
- [已确认决策](../04-decisions/01-confirmed.md) - Checkpoint 策略
