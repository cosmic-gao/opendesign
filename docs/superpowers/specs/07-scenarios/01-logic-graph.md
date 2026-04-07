# 逻辑编排图扩展

本文档定义如何将框架扩展用于业务逻辑编排场景。

---

## 1. 场景需求

```
用途: 业务流程编排、条件分支、状态机

需求:
- 节点类型: 条件分支、循环、并行、顺序、错误处理、补偿
- 关系类型: 控制流、数据流
- 操作: 条件路由、并行执行、事务管理、熔断降级
- 规模: 通常为中等到大规模业务流程
```

---

## 2. 节点类型定义

```typescript
// 逻辑节点类型
type LogicNodeType = 
  | 'condition'      // 条件分支
  | 'loop'           // 循环
  | 'parallel'       // 并行分支
  | 'sequence'       // 顺序执行
  | 'try-catch'      // 错误处理
  | 'compensation';   // 补偿事务

// 端点定义
interface LogicNodeEndpoints extends NodeEndpoints {
  in: {
    input: Slot<unknown>;           // 默认输入
    cancel: Slot<void>;             // 取消信号
    control: Slot<ControlMessage>;
  };
  out: {
    output: Slot<unknown>;         // 默认输出
    error: Slot<ErrorMessage>;
    done: Slot<{ success: boolean }>;
  };
}
```

---

## 3. 条件节点

```typescript
interface ConditionNode extends NodeDefinition {
  type: 'logic:condition';
  config: {
    conditionType: 'if' | 'switch' | 'match';
    
    // if 条件
    condition?: (input: unknown) => boolean;
    conditionExpression?: string;   // 可序列化的条件表达式
    
    // switch/match 分支
    cases?: {
      value: unknown;
      targetEndpoint: string;     // 路由目标端点
    }[];
    defaultEndpoint?: string;       // 默认分支
  };
}

// 条件节点处理器
const conditionNodeHandler: NodeHandler = {
  async onMessage(endpoint, message, state) {
    const condition = state.config.condition;
    const result = condition(message);
    
    // 确定目标端点
    let targetEndpoint: string;
    if (state.config.conditionType === 'if') {
      targetEndpoint = result 
        ? state.config.cases[0].targetEndpoint 
        : state.config.defaultEndpoint;
    } else {
      const matched = state.config.cases.find(c => c.value === message);
      targetEndpoint = matched?.targetEndpoint || state.config.defaultEndpoint;
    }
    
    return {
      messages: {
        [targetEndpoint]: message  // 路由到对应分支
      }
    };
  }
};
```

---

## 4. 并行节点

```typescript
interface ParallelNode extends NodeDefinition {
  type: 'logic:parallel';
  config: {
    branches: {
      nodeId: string;
      endpoint: string;           // 分支目标端点
    }[];
    aggregator: 'all' | 'any' | 'first' | 'custom';
    customAggregatorExpression?: string;
    
    // 执行控制
    maxConcurrency?: number;
    timeout?: number;
  };
}

// 并行节点处理器
const parallelNodeHandler: NodeHandler = {
  async onMessage(endpoint, message, state) {
    const branches = state.config.branches;
    
    // 启动所有分支
    const messages = branches.map(branch => ({
      targetNodeId: branch.nodeId,
      targetEndpoint: branch.endpoint,
      payload: message
    }));
    
    // 初始化分支状态
    return {
      updates: {
        branchStates: new Map(branches.map(b => [b.nodeId, { status: 'running' }])),
        results: new Map()
      },
      messages: {
        output: messages  // 分支消息
      }
    };
  }
};
```

---

## 5. 循环节点

```typescript
interface LoopNode extends NodeDefinition {
  type: 'logic:loop';
  config: {
    loopType: 'while' | 'for' | 'foreach' | 'do-while';
    
    // 循环条件
    maxIterations?: number;
    continueCondition?: (input: unknown, iteration: number) => boolean;
    
    // 循环体
    bodyNodeId?: string;
    iterator?: unknown;
    
    // 循环变量
    loopVariable?: string;
  };
}

// 循环节点状态
interface LoopNodeState extends NodeState {
  currentIteration: number;
  loopVariableHistory: unknown[];
  shouldContinue: boolean;
}

// 循环节点处理器
const loopNodeHandler: NodeHandler = {
  async onMessage(endpoint, message, state: LoopNodeState) {
    // 检查是否应该继续循环
    const shouldContinue = state.config.continueCondition
      ? state.config.continueCondition(message, state.currentIteration)
      : state.currentIteration < (state.config.maxIterations || Infinity);
    
    if (shouldContinue) {
      // 发送消息到循环体
      return {
        updates: {
          currentIteration: state.currentIteration + 1,
          shouldContinue: true
        },
        messages: {
          [state.config.bodyNodeId + '.in']: message
        }
      };
    } else {
      // 循环完成
      return {
        updates: {
          shouldContinue: false
        },
        messages: {
          output: message
        },
        action: 'complete'
      };
    }
  }
};
```

---

## 6. 错误处理节点

```typescript
interface TryCatchNode extends NodeDefinition {
  type: 'logic:try-catch';
  config: {
    tryNodeId?: string;             // 可能抛出异常的节点
    catchNodeId?: string;           // 异常处理节点
    finallyNodeId?: string;          // finally 节点（可选）
    
    // 异常匹配
    errorTypes?: string[];         // 捕获的异常类型
    retryCount?: number;            // 重试次数
  };
}

// 错误处理流程
const tryCatchNodeHandler: NodeHandler = {
  async onMessage(endpoint, message, state) {
    if (endpoint === 'input') {
      try {
        // 正常流程，发送到 try 节点
        return {
          messages: {
            [state.config.tryNodeId + '.in']: message
          }
        };
      } catch (error) {
        // 异常处理，发送到 catch 节点
        return {
          messages: {
            [state.config.catchNodeId + '.in']: {
              error,
              originalInput: message
            }
          }
        };
      }
    } else if (endpoint === 'error') {
      // 处理异常
      const errorMessage = message as ErrorMessage;
      
      if (state.config.retryCount && state.metadata.retryCount < state.config.retryCount) {
        // 重试
        return {
          updates: {
            metadata: { retryCount: (state.metadata.retryCount || 0) + 1 }
          },
          messages: {
            [state.config.tryNodeId + '.in']: state.metadata.originalInput
          }
        };
      }
      
      // 发送给 catch 节点
      return {
        messages: {
          [state.config.catchNodeId + '.in']: errorMessage
        }
      };
    }
    
    return { action: 'continue' };
  }
};
```

---

## 7. 流程编排示例

```
逻辑编排图示例:

┌─────────────┐
│   Start    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Condition   │──────► [Process A]
│ (if x > 0) │       (out:true)
└──────┬──────┘
       │
       │ (false)
       ▼
┌─────────────┐     ┌─────────────┐
│  Parallel   │────►│  Task B    │
│             │────►│  Task C    │
│             │────►│  Task D    │
└──────┬──────┘     └─────────────┘
       │
       │ (all completed)
       ▼
┌─────────────┐
│   End      │
└─────────────┘
```

---

## 8. 事务管理

```typescript
interface TransactionNode extends NodeDefinition {
  type: 'logic:transaction';
  config: {
    participants: string[];         // 参与节点
    timeout: number;                // 超时时间
    compensationStrategy: 'rollback' | 'compensate' | 'saga';
  };
}

// Saga 模式实现
const sagaHandler: NodeHandler = {
  async onMessage(endpoint, message, state) {
    if (endpoint === 'input') {
      // 开始事务
      const sagaId = generateSagaId();
      
      // 按顺序执行参与者
      for (const participant of state.config.participants) {
        await this.executeParticipant(participant, message, sagaId);
      }
      
      return {
        updates: { sagaId, status: 'completed' }
      };
    }
    
    if (endpoint === 'compensate') {
      // 补偿事务
      const compensationOrder = [...state.config.participants].reverse();
      
      for (const participant of compensationOrder) {
        await this.compensateParticipant(participant, message.sagaId);
      }
      
      return {
        updates: { status: 'compensated' }
      };
    }
    
    return { action: 'continue' };
  }
};
```

---

## 9. 相关文档

- [核心概念索引](../README.md#第三部分核心概念)
- [待确认决策](../04-decisions/00-pending.md)
