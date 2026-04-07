# Message 消息

---

## 1. 概念定义

Message（消息）是节点间通信的载体，通过端点（Endpoint）发送和接收。

---

## 2. 消息结构

```typescript
interface TypedMessage<T = unknown> {
  // 消息标识
  id: string;                         // 全局唯一消息 ID
  
  // 路由信息
  sourceNodeId: string;               // 发送节点 ID
  sourceEndpoint: string;              // 发送端点名称
  targetNodeId: string;               // 接收节点 ID
  targetEndpoint?: string;             // 接收端点（可选，不指定则自动路由）
  
  // 消息内容
  type: MessageType;                // 消息类型
  payload: T;                        // 消息内容
  
  // 执行上下文
  superstep: number;                 // 发送时的超步骤号
  timestamp: number;                  // 发送时间戳
  
  // 投递配置
  deliveryMode: DeliveryMode;         // 投递语义
  retryCount: number;                 // 重试次数
  
  // 可选信息
  headers?: Record<string, unknown>;  // 头部信息（如 tracing、correlation）
  correlationId?: string;            // 关联 ID，用于请求/响应配对
}

type MessageType = 
  | 'data'           // 数据消息
  | 'signal'         // 信号消息（如完成、失败）
  | 'command'         // 命令消息（如取消、暂停）
  | 'route'           // 路由决策消息
  | 'interrupt';      // 人机交互中断消息

type DeliveryMode = 'at-least-once' | 'exactly-once';
```

---

## 3. 消息类型详解

### 3.1 数据消息 (data)

```typescript
// 用于在节点间传递业务数据
interface DataMessage<T = unknown> {
  type: 'data';
  payload: T;
}

// 示例：LLM 请求
interface LLMRequestMessage {
  type: 'data';
  payload: {
    prompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
}
```

### 3.2 信号消息 (signal)

```typescript
// 用于通知状态变化
interface SignalMessage {
  type: 'signal';
  payload: {
    signal: 'completed' | 'failed' | 'ready' | 'timeout';
    reason?: string;
  };
}
```

### 3.3 命令消息 (command)

```typescript
// 用于控制节点行为
interface CommandMessage {
  type: 'command';
  payload: {
    command: 'cancel' | 'pause' | 'resume' | 'retry';
    args?: Record<string, unknown>;
  };
}
```

### 3.4 中断消息 (interrupt)

```typescript
// 用于 Human-in-the-loop
interface InterruptMessage {
  type: 'interrupt';
  payload: {
    question: string;
    options?: { value: string; label: string }[];
    context?: Record<string, unknown>;
    timeout?: number;  // ms
  };
}
```

---

## 4. 消息处理

### 4.1 输入缓冲区

```typescript
interface InputSlotState {
  name: string;
  queue: TypedMessage[];        // 消息队列
  queueLength: number;          // 当前队列长度
  maxQueueSize: number;         // 最大队列长度
  overflow: 'block' | 'drop' | 'reject';  // 缓冲区满时的行为
  
  // 统计
  messagesReceived: number;
  messagesProcessed: number;
  messagesDropped: number;
}
```

### 4.2 消息发送

```typescript
interface MessageRouter {
  // 发送消息
  send(msg: TypedMessage): Promise<void>;
  
  // 批量发送
  sendBatch(messages: TypedMessage[]): Promise<void>;
  
  // 发送并等待响应（请求/响应模式）
  sendAndWait(msg: TypedMessage, timeout?: number): Promise<TypedMessage>;
}
```

---

## 5. 消息语义

### 5.1 At-Least-Once

```
发送方：
1. 发送消息
2. 等待确认（ACK）
3. 如果超时未确认，重试

接收方：
1. 处理消息
2. 发送 ACK
3. 标记消息为已处理（防止重复处理）
```

**特点**:
- 可能重复投递
- 需要接收方实现幂等性
- 实现简单，性能好

### 5.2 Exactly-Once

```
发送方：
1. 预发送（prepare）
2. 等待预确认
3. 确认提交（commit）
4. 删除本地副本

接收方：
1. 接收并持久化
2. 发送预确认
3. 等待提交指令
4. 处理消息
```

**特点**:
- 无重复投递
- 需要两阶段提交
- 实现复杂，性能开销大

---

## 6. 消息关联

### 6.1 请求/响应模式

```typescript
interface RequestResponseCorrelation {
  requestId: string;           // 请求 ID
  responseId?: string;          // 响应 ID（响应时填充）
  requestMsg: TypedMessage;
  responseMsg?: TypedMessage;
  status: 'pending' | 'completed' | 'timeout';
  createdAt: number;
  timeoutAt?: number;
}
```

### 6.2 消息头示例

```typescript
const message: TypedMessage = {
  id: 'msg-001',
  sourceNodeId: 'llm-agent',
  sourceEndpoint: 'out:llm',
  targetNodeId: 'user',
  targetEndpoint: 'in',
  type: 'data',
  payload: { content: 'Hello!' },
  superstep: 5,
  timestamp: Date.now(),
  deliveryMode: 'at-least-once',
  retryCount: 0,
  headers: {
    traceId: 'trace-123',
    spanId: 'span-456',
    priority: 'normal'
  },
  correlationId: 'corr-789'
};
```

---

## 7. 相关文档

- [Endpoint 端点设计](./02-endpoint.md)
- [Node 节点](./01-node.md)
- [Superstep 超步骤](./04-superstep.md)
