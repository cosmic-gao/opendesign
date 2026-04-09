# Endpoint / Slot 端点设计

**状态**: 已确认需要类型安全，Endpoint 作为独立实体类

---

## 1. 概念定义

### 1.1 什么是 Endpoint

Endpoint（端点）是节点的消息接入点，定义了消息的输入或输出通道。

```
┌─────────────────────────────────────────────────────────────────┐
│                         Node                                      │
│                                                                  │
│  输入 Endpoints (多个):                                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │in.user  │ │in.tool  │ │in.memory│ │in.ctrl  │            │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘            │
│       │             │             │             │                │
│       └─────────────┴─────────────┴─────────────┘                │
│                           │                                        │
│                           ▼                                        │
│                    ┌─────────────┐                              │
│                    │   Handler   │                              │
│                    └─────────────┘                              │
│                           │                                        │
│  输出 Endpoints (多个):                                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │out.llm  │ │out.tool │ │out.mem  │ │out.err  │            │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 什么是 Slot

Slot（槽位）是 Endpoint 的具体实例，代表一个可以连接边的端点。

### 1.3 核心特性

| 特性 | 说明 |
|------|------|
| **多端点同方向** | 一个节点可有多个输入端点和多个输出端点 |
| **类型安全** | 每个端点接收/发送特定类型的消息 |
| **独立缓冲** | 每个端点有独立的输入/输出缓冲区 |
| **可配置行为** | 缓冲区大小、流控策略可配置 |

---

## 2. 类型定义

### 2.1 基础类型（TypeScript）

```typescript
// 端点方向
type EndpointDirection = 'in' | 'out';

// 端点元数据
interface EndpointMetadata {
  description?: string;          // 端点描述
  tags?: string[];              // 标签，用于分类
  schema?: JSONSchema;          // 消息 schema（可选）
}

// 单个 Slot 定义
interface Slot<T = unknown> {
  name: string;                  // Slot 名称
  direction: EndpointDirection; // 输入或输出
  payloadType: T;               // 消息类型
  metadata?: EndpointMetadata;   // 元数据
}

// 输入端点集合
type InEndpoints = {
  [name: string]: Slot<unknown>;
};

// 输出端点集合  
type OutEndpoints = {
  [name: string]: Slot<unknown>;
};

// 节点端点定义
interface NodeEndpoints {
  in: InEndpoints;
  out: OutEndpoints;
}
```

### 2.2 Endpoint 实体类（基类架构）

Endpoint 作为独立实体类，提供更好的类型安全和可读性：

```typescript
// Endpoint 接口
interface Endpoint {
  readonly id: string;                    // 唯一标识
  readonly direction: EndpointDirection;  // 'in' | 'out'
  readonly name: string;                  // 名称如 "llm", "tool.result"
  readonly parts: string[];               // 层级分解: ["tool", "result"]
  readonly nodeId?: string;               // 所属节点 ID（可选）
  
  fullName(): string;                      // 完整名称 "in.llm" 或 "out.tool.result"
  isCompatibleWith(other: Endpoint): boolean;
}

// 输入端点实现
class InEndpoint implements Endpoint {
  readonly id: string;
  readonly direction: 'in' = 'in';
  readonly name: string;
  readonly parts: string[];
  readonly nodeId?: string;
  
  constructor(id: string, name: string, nodeId?: string) {
    this.id = id;
    this.name = name;
    this.parts = name.split('.');
    this.nodeId = nodeId;
  }
  
  fullName(): string {
    return this.nodeId 
      ? `${this.nodeId}.in.${this.name}` 
      : `in.${this.name}`;
  }
  
  isCompatibleWith(other: Endpoint): boolean {
    return other.direction === 'out' && other.name === this.name;
  }
}

// 输出端点实现
class OutEndpoint implements Endpoint {
  readonly id: string;
  readonly direction: 'out' = 'out';
  readonly name: string;
  readonly parts: string[];
  readonly nodeId?: string;
  
  constructor(id: string, name: string, nodeId?: string) {
    this.id = id;
    this.name = name;
    this.parts = name.split('.');
    this.nodeId = nodeId;
  }
  
  fullName(): string {
    return this.nodeId 
      ? `${this.nodeId}.out.${this.name}` 
      : `out.${this.name}`;
  }
  
  isCompatibleWith(other: Endpoint): boolean {
    return other.direction === 'in' && other.name === this.name;
  }
}

// Endpoint 解析错误
class EndpointParseError extends Error {
  constructor(message: string, public readonly rawEndpoint: string) {
    super(message);
    this.name = 'EndpointParseError';
  }
}
```

### 2.3 Endpoint 字符串格式

**注意**：代码实现使用冒号分隔符 (`direction:name`)，文档为保持可读性在描述时使用点号分隔，但在指明具体格式时以冒号为准。

| 格式 | 示例 | 说明 |
|------|------|------|
| `in:<name>` | `in:user` | 当前节点的输入端点 |
| `out:<name>` | `out:llm` | 当前节点的输出端点 |
| `<nodeId>.in:<name>` | `Agent.in:user` | 指定节点的输入端点 |
| `<nodeId>.out:<name>` | `Agent.out:tool` | 指定节点的输出端点（支持层级如 `Agent.out:tool.result`） |

### 2.4 Endpoint 解析工具

```typescript
// 解析端点字符串
// 格式: "<nodeId>.in:<name>" 或 "in:<name>"
// 示例: "Agent.out:tool.result" -> nodeId="Agent", direction="out", name="tool.result"
function parseEndpointString(endpoint: string): {
  nodeId?: string;
  direction: EndpointDirection;
  name: string;
  parts: string[];
} {
  // 匹配 nodeId.direction:name 格式
  const match = endpoint.match(/^(.+?)\.(in|out):(.+)$/);
  if (match) {
    return {
      nodeId: match[1],
      direction: match[2] as EndpointDirection,
      name: match[3],
      parts: match[3].split('.'),  // 支持层级名称如 "tool.result"
    };
  }
  
  // 匹配 direction:name 格式（无 nodeId）
  const simpleMatch = endpoint.match(/^(in|out):(.+)$/);
  if (simpleMatch) {
    return {
      direction: simpleMatch[1] as EndpointDirection,
      name: simpleMatch[2],
      parts: simpleMatch[2].split('.'),
    };
  }
  
  throw new EndpointParseError(`Invalid endpoint format: ${endpoint}`, endpoint);
}
```

### 2.2 类型安全示例

```typescript
// 消息类型定义
interface UserMessage {
  type: 'user';
  content: string;
}

interface ToolResult {
  type: 'tool';
  toolName: string;
  result: unknown;
}

interface LLMRequest {
  type: 'llm';
  prompt: string;
  model?: string;
}

interface ErrorMessage {
  type: 'error';
  code: string;
  message: string;
}

// LLM Agent 节点端点定义
interface LLMNodeEndpoints extends NodeEndpoints {
  in: {
    user: Slot<UserMessage>;
    tool: Slot<ToolResult>;
    memory: Slot<{ query: string }>;
    control: Slot<{ action: 'pause' | 'resume' | 'cancel' }>;
  };
  out: {
    llm: Slot<LLMRequest>;
    tool: Slot<{ name: string; params: Record<string, unknown> }>;
    memory: Slot<{ key: string; value: unknown }>;
    error: Slot<ErrorMessage>;
  };
}
```

### 2.3 泛型约束（备选方案）

```typescript
// 端点基类
interface BaseSlot<T = unknown> {
  name: string;
  payloadType: T;
}

// 带元数据的端点
interface MetadataSlot<T = unknown> extends BaseSlot<T> {
  metadata?: EndpointMetadata;
  constraints?: {
    maxBufferSize?: number;
    timeout?: number;
    priority?: number;
  };
}

// 类型安全的节点接口
interface TypedNode<
  In extends Record<string, Slot>,
  Out extends Record<string, Slot>
> {
  readonly endpoints: {
    in: In;
    out: Out;
  };
  
  handle<K extends keyof In>(
    endpoint: K,
    message: In[K]['payloadType']
  ): Promise<Partial<Record<keyof Out, Out[keyof Out]['payloadType']>>>;
}
```

---

## 3. 端点行为

### 3.1 输入端点行为

```typescript
interface InputSlotConfig {
  name: string;
  bufferSize: number;           // 缓冲区大小，默认 100
  overflow: 'block' | 'drop' | 'reject';  // 缓冲区满时的行为
  priority?: number;            // 处理优先级
  timeout?: number;             // 处理超时时间（ms）
}

// 输入端点状态
interface InputSlotState {
  name: string;
  queueLength: number;
  processing: boolean;
  lastProcessedAt?: number;
}
```

### 3.2 输出端点行为

```typescript
interface OutputSlotConfig {
  name: string;
  bufferSize: number;           // 发送缓冲区大小
  deliveryMode: 'at-least-once' | 'exactly-once';
  retryOnFailure: boolean;
  maxRetries: number;
}

// 输出端点状态
interface OutputSlotState {
  name: string;
  pendingCount: number;         // 待确认消息数
  failedCount: number;          // 失败消息数
  lastSentAt?: number;
}
```

---

## 4. 端点与边的连接

### 4.1 连接语法

```typescript
// 语法: graph.connect(source, target)
// source/target 格式: "<nodeId>.in:<name>" 或 "in:<name>"
const graph = new Graph();
graph.addNode('llm', new LLMNode());
graph.addNode('tool', new ToolNode());

// 显式端点连接
graph.connect('llm.out:tool', 'tool.in:request');
graph.connect('llm.out:llm', 'user.in:response');
```

### 4.2 连接验证

```typescript
// 类型安全的连接验证
interface Connection<From extends Node, To extends Node> {
  from: { node: From; endpoint: keyof From['endpoints']['out'] };
  to: { node: To; endpoint: keyof To['endpoints']['in'] };
}

// 编译时检查：输出端点类型必须与输入端点类型兼容
type CanConnect<
  FromNode extends Node,
  ToNode extends Node,
  FromEndpoint extends keyof FromNode['endpoints']['out'],
  ToEndpoint extends keyof ToNode['endpoints']['in']
> = FromNode['endpoints']['out'][FromEndpoint] extends Slot<infer T>
  ? ToNode['endpoints']['in'][ToEndpoint] extends Slot<T>
    ? true
    : false
  : false;

// 示例：类型检查
type Check1 = CanConnect<LLMNode, ToolNode, 'out:tool', 'in'>;  // true
type Check2 = CanConnect<LLMNode, ToolNode, 'out:llm', 'in'>;   // false（类型不匹配）
```

---

## 5. 端点与消息路由

### 5.1 消息结构

```typescript
interface TypedMessage<T = unknown> {
  id: string;                   // 消息唯一 ID
  sourceNodeId: string;          // 源节点 ID
  sourceEndpoint: string;        // 源端点名称
  targetNodeId: string;          // 目标节点 ID
  targetEndpoint?: string;        // 目标端点（可选，不指定则自动路由）
  payload: T;                   // 消息内容
  superstep: number;            // 发送时的超步骤
  timestamp: number;             // 发送时间戳
  deliveryMode: 'at-least-once' | 'exactly-once';
  headers?: Record<string, unknown>;  // 可选的头部信息
}
```

### 5.2 路由规则（待确认）

```typescript
// 精确路由：消息只发送到指定端点
interface ExactRoute {
  type: 'exact';
  targetEndpoint: string;
}

// 广播路由：发送到所有匹配的端点
interface BroadcastRoute {
  type: 'broadcast';
  pattern?: string;  // 如 'in:*' 或 '*:user'
}

// 条件路由：根据消息内容决定目标
interface ConditionalRoute {
  type: 'conditional';
  rules: RouteRule[];
}

interface RouteRule {
  condition: (msg: TypedMessage) => boolean;
  targetEndpoint: string;
}
```

---

## 6. 端点示例

### 6.1 LLM Agent 节点

```typescript
class LLMAgentNode implements TypedNode {
  readonly endpoints = {
    in: {
      user: { name: 'user', direction: 'in', payloadType: UserMessage },
      tool: { name: 'tool', direction: 'in', payloadType: ToolResult },
      memory: { name: 'memory', direction: 'in', payloadType: MemoryQuery },
      control: { name: 'control', direction: 'in', payloadType: ControlMessage },
    },
    out: {
      llm: { name: 'llm', direction: 'out', payloadType: LLMRequest },
      tool: { name: 'tool', direction: 'out', payloadType: ToolCall },
      memory: { name: 'memory', direction: 'out', payloadType: MemoryStore },
      error: { name: 'error', direction: 'out', payloadType: ErrorMessage },
    }
  };

  async handle(endpoint: keyof typeof this.endpoints['in'], msg: any) {
    switch (endpoint) {
      case 'user':
        return this.processUserMessage(msg);
      case 'tool':
        return this.processToolResult(msg);
      case 'memory':
        return this.processMemoryQuery(msg);
      case 'control':
        return this.processControl(msg);
    }
  }
}
```

### 6.2 工具执行节点

```typescript
class ToolNode implements TypedNode {
  readonly endpoints = {
    in: {
      request: { name: 'request', direction: 'in', payloadType: ToolCall },
      cancel: { name: 'cancel', direction: 'in', payloadType: { toolCallId: string } },
    },
    out: {
      result: { name: 'result', direction: 'out', payloadType: ToolResult },
      error: { name: 'error', direction: 'out', payloadType: ErrorMessage },
    }
  };

  async handle(endpoint: keyof typeof this.endpoints['in'], msg: any) {
    // ...
  }
}
```

---

## 7. 相关文档

- [Node 节点概念](./01-node.md)
- [Message 消息概念](./03-message.md)
- [已确认决策](../04-decisions/01-confirmed.md)
