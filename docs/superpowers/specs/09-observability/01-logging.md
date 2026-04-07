# 日志结构

---

## 1. 日志概述

结构化日志用于问题排查、审计和监控告警。

---

## 2. 日志格式

### 2.1 JSON 日志格式

```typescript
interface LogEntry {
  // 时间戳
  timestamp: string;           // ISO 8601: "2026-04-07T14:30:00.000Z"
  
  // 级别
  level: 'debug' | 'info' | 'warn' | 'error';
  
  // 服务标识
  service: string;            // "graph-runtime"
  instance: string;           // 实例 ID
  
  // 追踪信息
  traceId?: string;          // 分布式追踪 ID
  spanId?: string;           // Span ID
  
  // 图信息
  graphId?: string;
  superstep?: number;
  nodeId?: string;
  
  // 事件
  event: string;             // 事件名称
  message: string;           // 人类可读的消息
  
  // 数据
  data?: Record<string, unknown>;
  
  // 错误信息
  error?: {
    type: string;           // 错误类型
    message: string;
    stack?: string;
  };
}
```

---

## 3. 事件类型

### 3.1 图生命周期事件

| 事件 | 说明 |
|------|------|
| `graph.created` | 图创建 |
| `graph.started` | 图开始执行 |
| `graph.stopped` | 图停止 |
| `graph.paused` | 图暂停 |
| `graph.resumed` | 图恢复 |
| `graph.completed` | 图执行完成 |
| `graph.failed` | 图执行失败 |

### 3.2 超步骤事件

| 事件 | 说明 |
|------|------|
| `superstep.started` | 超步骤开始 |
| `superstep.completed` | 超步骤完成 |
| `superstep.failed` | 超步骤失败 |
| `superstep.barrier` | 同步屏障 |

### 3.3 节点事件

| 事件 | 说明 |
|------|------|
| `node.registered` | 节点注册 |
| `node.unregistered` | 节点注销 |
| `node.started` | 节点开始执行 |
| `node.completed` | 节点执行完成 |
| `node.failed` | 节点执行失败 |
| `node.waiting` | 节点等待（如人工介入） |

### 3.4 消息事件

| 事件 | 说明 |
|------|------|
| `message.sent` | 消息发送 |
| `message.delivered` | 消息投递成功 |
| `message.failed` | 消息投递失败 |
| `message.dropped` | 消息丢弃 |

### 3.5 Checkpoint 事件

| 事件 | 说明 |
|------|------|
| `checkpoint.created` | Checkpoint 创建 |
| `checkpoint.restored` | Checkpoint 恢复 |
| `checkpoint.gc` | Checkpoint 垃圾回收 |

---

## 4. 日志示例

### 4.1 图启动

```json
{
  "timestamp": "2026-04-07T14:30:00.000Z",
  "level": "info",
  "service": "graph-runtime",
  "instance": "instance-001",
  "graphId": "graph-001",
  "event": "graph.started",
  "message": "Graph execution started",
  "data": {
    "input": { "query": "..." },
    "nodeCount": 5,
    "edgeCount": 8
  }
}
```

### 4.2 超步骤完成

```json
{
  "timestamp": "2026-04-07T14:30:01.500Z",
  "level": "info",
  "service": "graph-runtime",
  "instance": "instance-001",
  "graphId": "graph-001",
  "superstep": 3,
  "event": "superstep.completed",
  "message": "Superstep completed",
  "data": {
    "duration": 150,
    "activeNodes": 5,
    "messagesProcessed": 12,
    "messagesSent": 8
  }
}
```

### 4.3 节点执行

```json
{
  "timestamp": "2026-04-07T14:30:01.200Z",
  "level": "debug",
  "service": "graph-runtime",
  "instance": "instance-001",
  "graphId": "graph-001",
  "superstep": 3,
  "nodeId": "llm-agent",
  "event": "node.completed",
  "message": "Node execution completed",
  "data": {
    "duration": 45,
    "endpoint": "user",
    "messagesReceived": 2,
    "messagesSent": 3
  }
}
```

### 4.4 错误日志

```json
{
  "timestamp": "2026-04-07T14:30:02.000Z",
  "level": "error",
  "service": "graph-runtime",
  "instance": "instance-001",
  "graphId": "graph-001",
  "superstep": 3,
  "nodeId": "llm-agent",
  "event": "node.failed",
  "message": "Node execution failed",
  "error": {
    "type": "LLMError",
    "message": "API rate limit exceeded",
    "stack": "Error: API rate limit exceeded\n    at LLMNode.handle (llm.ts:45)"
  },
  "data": {
    "retryCount": 3,
    "maxRetries": 3
  }
}
```

### 4.5 Checkpoint

```json
{
  "timestamp": "2026-04-07T14:30:05.000Z",
  "level": "info",
  "service": "graph-runtime",
  "instance": "instance-001",
  "graphId": "graph-001",
  "superstep": 5,
  "event": "checkpoint.created",
  "message": "Checkpoint created",
  "data": {
    "checkpointId": "cp-graph-001-5-1712495405000",
    "type": "incremental",
    "size": 4096,
    "duration": 120,
    "nodesCount": 5
  }
}
```

---

## 5. 日志级别使用

| 级别 | 使用场景 |
|------|---------|
| `debug` | 详细的调试信息（消息内容、状态变化） |
| `info` | 正常的业务流程事件（启动、完成、Checkpoint） |
| `warn` | 潜在问题（重试、超时、队列积压） |
| `error` | 错误（节点失败、消息投递失败） |

---

## 6. 日志采集

```yaml
# fluentd 配置示例
<source>
  @type tail
  path /var/log/graph-runtime/*.log
  pos_file /var/log/fluentd/graph-runtime.log.pos
  tag graph-runtime
  <parse>
    @type json
  </parse>
</source>

<match graph-runtime>
  @type elasticsearch
  host elasticsearch
  port 9200
  logstash_format true
  logstash_prefix graph-runtime
</match>
```

---

## 7. 相关文档

- [监控指标](./00-metrics.md)
- [Checkpoint 机制](../08-fault-tolerance/00-checkpoint.md)
