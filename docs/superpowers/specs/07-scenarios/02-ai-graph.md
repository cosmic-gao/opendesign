# AI 工作流图扩展

本文档定义如何将框架扩展用于 AI Agent 工作流场景。

---

## 1. 场景需求

```
用途: 构建 AI Agent、多步骤推理、工具调用

需求:
- 节点类型: LLM 调用、工具执行、记忆管理、路由、人工介入
- 关系类型: Agent 协作、消息传递、工具链
- 操作: 推理循环、工具选择、记忆检索、人机协作
- 规模: 从简单单 Agent 到复杂多 Agent 系统
```

---

## 2. 节点类型定义

```typescript
// AI 节点类型
type AINodeType = 
  | 'ai:llm'           // LLM 调用
  | 'ai:tool'          // 工具执行
  | 'ai:memory'        // 记忆管理
  | 'ai:router'        // 路由决策
  | 'ai:human';        // 人工介入

// 通用 AI 端点定义
interface AINodeEndpoints extends NodeEndpoints {
  in: {
    input: Slot<unknown>;
    interrupt: Slot<InterruptRequest>;
    control: Slot<ControlMessage>;
  };
  out: {
    output: Slot<unknown>;
    error: Slot<ErrorMessage>;
  };
}
```

---

## 3. LLM 节点

```typescript
interface LLMNode extends NodeDefinition {
  type: 'ai:llm';
  
  // 端点定义
  endpoints: {
    in: {
      user: Slot<UserMessage>;           // 用户消息
      tool: Slot<ToolResult>;           // 工具结果
      memory: Slot<MemoryQuery>;        // 记忆检索结果
      control: Slot<ControlMessage>;
    };
    out: {
      llm: Slot<LLMRequest>;            // LLM 请求
      tool: Slot<ToolCall>;              // 工具调用
      memory: Slot<MemoryStore>;        // 记忆存储
      error: Slot<ErrorMessage>;
    };
  };
  
  // LLM 配置
  config: {
    model: string;
    provider?: 'openai' | 'anthropic' | 'ollama' | 'custom';
    temperature?: number;
    maxTokens?: number;
    tools?: ToolDefinition[];
    systemPrompt?: string;
  };
}

// LLM 节点处理器
const llmNodeHandler: NodeHandler = {
  async onMessage(endpoint, message, state: LLMNodeState) {
    switch (endpoint) {
      case 'user': {
        // 构建消息上下文
        const messages = [
          ...state.messages,
          { role: 'user', content: message.content }
        ];
        
        // 调用 LLM
        const response = await this.callLLM({
          model: state.config.model,
          messages,
          tools: state.config.tools
        });
        
        // 处理响应
        if (response.toolCalls) {
          // 返回工具调用
          return {
            updates: { messages: [...messages, response] },
            messages: {
              tool: response.toolCalls.map(tc => ({
                toolCallId: tc.id,
                function: tc.function.name,
                arguments: JSON.parse(tc.function.arguments)
              }))
            }
          };
        } else {
          // 返回文本响应
          return {
            updates: { messages: [...messages, response] },
            messages: {
              output: { content: response.content }
            }
          };
        }
      }
      
      case 'tool': {
        // 工具执行结果，返回给 LLM
        const toolResultMsg: LLMMessage = {
          role: 'tool',
          content: message.result,
          toolCallId: message.toolCallId
        };
        
        return {
          updates: {
            messages: [...state.messages, toolResultMsg]
          }
        };
      }
    }
  }
};
```

---

## 4. 工具节点

```typescript
interface ToolNode extends NodeDefinition {
  type: 'ai:tool';
  
  endpoints: {
    in: {
      request: Slot<ToolCall>;
      cancel: Slot<{ toolCallId: string }>;
    };
    out: {
      result: Slot<ToolResult>;
      error: Slot<ErrorMessage>;
    };
  };
  
  config: {
    toolName: string;
    parameters?: z.ZodSchema;
    timeout?: number;
    maxRetries?: number;
    cacheResults?: boolean;
  };
}

// 工具节点处理器
const toolNodeHandler: NodeHandler = {
  async onMessage(endpoint, message, state: ToolNodeState) {
    if (endpoint === 'request') {
      const { toolCallId, function: fn, arguments: args } = message;
      
      try {
        // 执行工具
        const result = await this.executeTool(fn, args, state);
        
        return {
          updates: {
            executionStatus: 'completed',
            lastResult: result
          },
          messages: {
            result: { toolCallId, result, success: true }
          }
        };
      } catch (error) {
        // 重试处理
        if (state.config.maxRetries && state.retryCount < state.config.maxRetries) {
          return {
            updates: { retryCount: state.retryCount + 1 },
            messages: {
              result: { toolCallId, error: error.message, retry: true }
            }
          };
        }
        
        return {
          updates: { executionStatus: 'failed' },
          messages: {
            error: { code: 'TOOL_ERROR', message: error.message }
          }
        };
      }
    }
    
    return { action: 'continue' };
  }
};
```

---

## 5. 记忆节点

```typescript
interface MemoryNode extends NodeDefinition {
  type: 'ai:memory';
  
  endpoints: {
    in: {
      store: Slot<MemoryStore>;        // 存储记忆
      retrieve: Slot<MemoryQuery>;    // 检索记忆
      clear: Slot<void>;              // 清除记忆
    };
    out: {
      retrieved: Slot<MemoryResult>;  // 检索结果
      stored: Slot<{ success: boolean }>;
    };
  };
  
  config: {
    memoryType: 'short-term' | 'long-term' | 'hybrid';
    embeddingModel?: string;
    maxEntries?: number;
    similarityThreshold?: number;
  };
}

// 记忆节点处理器
const memoryNodeHandler: NodeHandler = {
  async onMessage(endpoint, message, state: MemoryNodeState) {
    switch (endpoint) {
      case 'store': {
        // 存储到记忆
        const embedding = await this.createEmbedding(message.value);
        await this.memoryStore.add({
          key: message.key,
          value: message.value,
          embedding,
          timestamp: Date.now(),
          metadata: message.metadata
        });
        
        return {
          messages: {
            stored: { success: true }
          }
        };
      }
      
      case 'retrieve': {
        // 检索相关记忆
        const queryEmbedding = await this.createEmbedding(message.query);
        const results = await this.memoryStore.search(
          queryEmbedding,
          { limit: message.limit || 5, threshold: state.config.similarityThreshold }
        );
        
        return {
          messages: {
            retrieved: {
              query: message.query,
              results
            }
          }
        };
      }
      
      case 'clear': {
        // 清除记忆
        await this.memoryStore.clear();
        
        return {
          updates: { entries: [] },
          messages: {
            stored: { success: true }
          }
        };
      }
    }
  }
};
```

---

## 6. 人工介入节点

```typescript
interface HumanNode extends NodeDefinition {
  type: 'ai:human';
  
  endpoints: {
    in: {
      request: Slot<HumanRequest>;    // 请求人工介入
      response: Slot<HumanResponse>;  // 人工响应
      cancel: Slot<void>;              // 取消请求
    };
    out: {
      question: Slot<HumanQuestion>; // 向人提问
      timeout: Slot<void>;            // 超时信号
    };
  };
  
  config: {
    timeout?: number;               // 超时时间（ms）
    defaultAction?: 'retry' | 'skip' | 'fail';
    notificationChannels?: string[]; // 通知渠道
  };
}

// 人工介入流程
const humanNodeHandler: NodeHandler = {
  async onMessage(endpoint, message, state: HumanNodeState) {
    switch (endpoint) {
      case 'request': {
        // 触发人工介入
        return {
          updates: {
            status: 'waiting',
            question: message.question,
            options: message.options
          },
          messages: {
            question: {
              question: message.question,
              options: message.options,
              context: message.context,
              requestId: message.requestId
            }
          },
          action: 'wait'  // 暂停执行，等待人工响应
        };
      }
      
      case 'response': {
        // 收到人工响应
        return {
          updates: {
            status: 'responded',
            response: message.answer
          },
          messages: {
            output: message.answer
          }
        };
      }
      
      case 'cancel': {
        return {
          updates: { status: 'cancelled' },
          action: 'complete'
        };
      }
    }
  }
};
```

---

## 7. 多 Agent 协作

### 7.1 管理者模式

```
┌─────────────────────────────────────────────────────────────────┐
│                    管理者 Agent 模式                               │
│                                                                  │
│                    ┌─────────────┐                               │
│                    │  Manager   │                               │
│                    │   Agent     │                               │
│                    └──────┬──────┘                               │
│                           │                                        │
│           ┌───────────────┼───────────────┐                     │
│           ▼               ▼               ▼                     │
│    ┌───────────┐   ┌───────────┐   ┌───────────┐            │
│    │ Researcher │   │  Planner  │   │  Executor │            │
│    │   Agent   │   │   Agent   │   │   Agent   │            │
│    └───────────┘   └───────────┘   └───────────┘            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 对等模式

```
┌─────────────────────────────────────────────────────────────────┐
│                    对等 Agent 协作模式                            │
│                                                                  │
│    ┌───────────┐         ┌───────────┐                        │
│    │  Agent A  │◄──────►│  Agent B  │                        │
│    └─────┬─────┘         └─────┬─────┘                        │
│          │                       │                               │
│          │    ┌───────────┐     │                               │
│          └───►│  Agent C  │◄────┘                               │
│               └───────────┘                                      │
│                     │                                            │
│                     ▼                                            │
│               ┌───────────┐                                      │
│               │  Shared   │                                      │
│               │  Memory   │                                      │
│               └───────────┘                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 消息传递示例

```typescript
// Agent 间消息
interface AgentMessage {
  type: 'agent:request' | 'agent:response' | 'agent:delegate';
  from: string;
  to: string;
  content: unknown;
  conversationId?: string;
}

// 委托消息示例
const delegateMsg: AgentMessage = {
  type: 'agent:delegate',
  from: 'manager',
  to: 'researcher',
  content: {
    task: 'research market trends',
    context: { industry: 'AI', timeframe: '2024' },
    deadline: Date.now() + 3600000
  }
};
```

---

## 8. 完整工作流示例

```
AI Agent 工作流示例:

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User     │────►│    LLM      │────►│   Router    │
│  (Human)   │     │   Agent     │     │             │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                            │                     │
                            │ needs_tool         │ needs_human
                            ▼                     ▼
                     ┌─────────────┐     ┌─────────────┐
                     │    Tool     │     │   Human     │
                     │   Executor  │     │  Intervention│
                     └──────┬──────┘     └──────┬──────┘
                            │                     │
                            │ result              │ response
                            ▼                     ▼
                     ┌─────────────┐     ┌─────────────┐
                     │    LLM       │◄────│    LLM      │
                     │ (继续推理)   │     │ (提供上下文) │
                     └──────┬──────┘     └─────────────┘
                            │
                            │ final_response
                            ▼
                     ┌─────────────┐
                     │    User     │
                     │  (Human)   │
                     └─────────────┘
```

---

## 9. 相关文档

- [核心概念索引](../README.md#第三部分核心概念)
- [已确认决策](../04-decisions/01-confirmed.md)
