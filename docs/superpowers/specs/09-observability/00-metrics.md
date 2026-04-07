# 监控指标

---

## 1. 指标概述

监控指标用于实时了解系统运行状态，支持性能优化和故障排查。

---

## 2. 执行指标

### 2.1 超步骤指标

```typescript
const superstepMetrics = {
  // 超步骤执行时长
  'graph.superstep.duration': {
    type: 'histogram',
    description: 'Superstep execution duration in milliseconds',
    labels: ['graph_id'],
    buckets: [10, 50, 100, 200, 500, 1000, 5000],
    unit: 'ms'
  },
  
  // 超步骤消息数
  'graph.superstep.messages': {
    type: 'counter',
    description: 'Total messages processed in superstep',
    labels: ['graph_id']
  },
  
  // 超步骤活跃节点数
  'graph.superstep.active_nodes': {
    type: 'gauge',
    description: 'Number of active nodes in superstep',
    labels: ['graph_id']
  }
};
```

### 2.2 节点指标

```typescript
const nodeMetrics = {
  // 节点执行时长
  'graph.node.execution.duration': {
    type: 'histogram',
    description: 'Node execution duration',
    labels: ['graph_id', 'node_id', 'node_type'],
    unit: 'ms'
  },
  
  // 节点消息处理数
  'graph.node.messages.processed': {
    type: 'counter',
    description: 'Number of messages processed by node',
    labels: ['graph_id', 'node_id', 'node_type', 'endpoint']
  },
  
  // 节点消息发送数
  'graph.node.messages.sent': {
    type: 'counter',
    description: 'Number of messages sent by node',
    labels: ['graph_id', 'node_id', 'node_type', 'endpoint']
  },
  
  // 节点状态
  'graph.node.status': {
    type: 'gauge',
    description: 'Node status (1=running, 0=stopped)',
    labels: ['graph_id', 'node_id', 'node_type', 'status']
  }
};
```

---

## 3. 消息路由指标

```typescript
const routerMetrics = {
  // 消息延迟（端到端）
  'router.message.latency': {
    type: 'histogram',
    description: 'End-to-end message latency',
    labels: ['graph_id'],
    unit: 'ms'
  },
  
  // 队列大小
  'router.queue.size': {
    type: 'gauge',
    description: 'Message queue size per endpoint',
    labels: ['graph_id', 'node_id', 'endpoint']
  },
  
  // 消息投递数
  'router.messages.delivered': {
    type: 'counter',
    description: 'Number of messages successfully delivered',
    labels: ['graph_id']
  },
  
  // 消息投递失败数
  'router.messages.failed': {
    type: 'counter',
    description: 'Number of message delivery failures',
    labels: ['graph_id', 'error_type']
  }
};
```

---

## 4. Checkpoint 指标

```typescript
const checkpointMetrics = {
  // Checkpoint 大小
  'graph.checkpoint.size': {
    type: 'gauge',
    description: 'Checkpoint size in bytes',
    labels: ['graph_id'],
    unit: 'bytes'
  },
  
  // Checkpoint 保存时长
  'graph.checkpoint.duration': {
    type: 'histogram',
    description: 'Time to save checkpoint',
    labels: ['graph_id', 'type'],  // type: full | incremental
    unit: 'ms'
  },
  
  // Checkpoint 保存数
  'graph.checkpoint.count': {
    type: 'counter',
    description: 'Number of checkpoints saved',
    labels: ['graph_id', 'type']
  },
  
  // Checkpoint 恢复数
  'graph.checkpoint.restore_count': {
    type: 'counter',
    description: 'Number of checkpoints restored',
    labels: ['graph_id']
  }
};
```

---

## 5. 资源指标

```typescript
const resourceMetrics = {
  // 节点内存使用
  'node.memory.usage': {
    type: 'gauge',
    description: 'Node memory usage in bytes',
    labels: ['node_id', 'node_type'],
    unit: 'bytes'
  },
  
  // 节点内存限制
  'node.memory.limit': {
    type: 'gauge',
    description: 'Node memory limit in bytes',
    labels: ['node_id', 'node_type'],
    unit: 'bytes'
  },
  
  // 节点 CPU 使用
  'node.cpu.usage': {
    type: 'gauge',
    description: 'Node CPU usage percentage',
    labels: ['node_id', 'node_type'],
    unit: 'percent'
  },
  
  // Go 运行时指标
  'node.runtime.go goroutines': {
    type: 'gauge',
    description: 'Number of goroutines',
    labels: ['node_id']
  }
};
```

---

## 6. 业务指标

```typescript
const businessMetrics = {
  // AI LLM 调用次数
  'ai.llm.calls': {
    type: 'counter',
    description: 'Number of LLM API calls',
    labels: ['model', 'provider', 'status']
  },
  
  // AI LLM 调用延迟
  'ai.llm.duration': {
    type: 'histogram',
    description: 'LLM API call duration',
    labels: ['model', 'provider'],
    unit: 'ms'
  },
  
  // AI 工具调用次数
  'ai.tool.calls': {
    type: 'counter',
    description: 'Number of tool executions',
    labels: ['tool_name', 'status']
  },
  
  // 人工介入次数
  'ai.human.interruptions': {
    type: 'counter',
    description: 'Number of human interventions',
    labels: ['node_id']
  },
  
  // 人工介入响应时间
  'ai.human.response_time': {
    type: 'histogram',
    description: 'Human response time',
    labels: ['node_id'],
    unit: 'ms'
  }
};
```

---

## 7. Prometheus 配置示例

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'graph-runtime'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

---

## 8. Grafana Dashboard

关键 Dashboard 面板：

1. **执行概览**
   - 活跃图数量
   - 超步骤/秒
   - 消息/秒

2. **节点详情**
   - 各节点执行时长分布
   - 节点消息队列深度
   - 节点状态分布

3. **消息路由**
   - 消息延迟 P50/P90/P99
   - 投递失败率
   - 队列积压

4. **Checkpoint**
   - Checkpoint 大小趋势
   - Checkpoint 频率
   - 恢复次数

5. **资源**
   - CPU 使用率
   - 内存使用率
   - Goroutine 数量

---

## 9. 相关文档

- [日志结构](./01-logging.md)
- [Checkpoint 机制](../08-fault-tolerance/00-checkpoint.md)
