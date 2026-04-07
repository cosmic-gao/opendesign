# 故障检测与恢复

本文档定义框架的故障检测和恢复机制。

---

## 1. 故障类型

### 1.1 故障分类

| 类型 | 说明 | 检测方式 |
|------|------|---------|
| 节点故障 | 节点进程崩溃 | 心跳超时 |
| 网络分区 | 节点间网络断开 | 探测 |
| 消息丢失 | 消息投递失败 | ACK 超时 |
| 资源耗尽 | CPU/内存/磁盘满 | 资源监控 |

### 1.2 故障处理策略

```typescript
interface FailurePolicy {
  // 节点故障
  nodeFailure: 'restart' | 'isolate' | 'fail_graph';
  
  // 网络分区
  networkPartition: 'wait' | 'proceed_without' | 'fail_graph';
  
  // 消息丢失
  messageLoss: 'resend' | 'skip' | 'fail';
  
  // 资源耗尽
  resourceExhaustion: 'throttle' | 'reject' | 'fail_node';
}
```

---

## 2. 故障检测

### 2.1 心跳机制

```typescript
interface HeartbeatConfig {
  interval: number;           // 心跳间隔（ms）
  timeout: number;           // 超时时间（ms）
  maxMissed: number;           // 最大连续未收到心跳次数
}

// 节点心跳
interface Heartbeat {
  nodeId: string;
  timestamp: number;
  status: 'alive' | 'suspected' | 'dead';
  load: {
    cpu: number;
    memory: number;
  };
}

// 定期发送心跳
async function sendHeartbeat(nodeId: string): Promise<void> {
  await redis.publish(`heartbeat:${nodeId}`, JSON.stringify({
    nodeId,
    timestamp: Date.now(),
    status: 'alive',
    load: await getSystemLoad()
  }));
}
```

### 2.2 故障检测器

```typescript
class FailureDetector {
  private suspects = new Map<string, number>();  // 疑似故障节点
  
  async checkHealth(nodeId: string): Promise<HealthStatus> {
    const lastHeartbeat = await this.getLastHeartbeat(nodeId);
    const missedCount = this.countMissedHeartbeats(nodeId);
    
    if (missedCount >= this.config.maxMissed) {
      return { status: 'dead', reason: 'heartbeat_timeout' };
    }
    
    if (missedCount > 0) {
      return { status: 'suspected', reason: 'missed_heartbeats' };
    }
    
    return { status: 'healthy' };
  }
  
  async handleNodeFailure(nodeId: string): Promise<void> {
    const policy = this.getPolicy(nodeId);
    
    switch (policy.nodeFailure) {
      case 'restart':
        await this.restartNode(nodeId);
        break;
      case 'isolate':
        await this.isolateNode(nodeId);
        break;
      case 'fail_graph':
        await this.failGraph(nodeId);
        break;
    }
  }
}
```

---

## 3. 恢复流程

### 3.1 节点恢复

```typescript
class NodeRecovery {
  async recover(nodeId: string): Promise<void> {
    // 1. 从 Checkpoint 恢复节点状态
    const checkpoint = await this.checkpointManager.getLatest(nodeId);
    if (checkpoint) {
      await this.restoreNodeState(nodeId, checkpoint);
    }
    
    // 2. 重新订阅消息
    await this.resubscribe(nodeId);
    
    // 3. 发送恢复信号
    await this.router.send({
      type: 'node:recovered',
      targetNodeId: nodeId
    });
  }
}
```

### 3.2 图恢复

```typescript
class GraphRecovery {
  async recoverGraph(graphId: string): Promise<void> {
    // 1. 暂停图执行
    await this.graphManager.pause(graphId);
    
    // 2. 获取最近的 Checkpoint
    const checkpoint = await this.checkpointManager.getLatest(graphId);
    if (!checkpoint) {
      throw new Error(`No checkpoint found for graph ${graphId}`);
    }
    
    // 3. 恢复所有节点状态
    for (const [nodeId, state] of checkpoint.nodeStates) {
      await this.nodeRegistry.restoreState(nodeId, state);
    }
    
    // 4. 获取增量 Checkpoint 并应用
    const incrementals = await this.getIncrementalsAfter(graphId, checkpoint.superstep);
    for (const inc of incrementals) {
      await this.applyIncremental(graphId, inc);
    }
    
    // 5. 恢复超步骤计数器
    const nextSuperstep = checkpoint.superstep + 1;
    
    // 6. 重播消息
    const messages = await this.replayMessages(graphId, checkpoint.superstep);
    for (const msg of messages) {
      await this.router.send(msg);
    }
    
    // 7. 恢复执行
    await this.graphManager.resume(graphId, nextSuperstep);
  }
}
```

---

## 4. 隔离机制

```typescript
class IsolationManager {
  async isolateNode(nodeId: string): Promise<void> {
    // 1. 从路由表中移除
    await this.router.unregister(nodeId);
    
    // 2. 标记节点为隔离状态
    await this.nodeRegistry.updateStatus(nodeId, 'isolated');
    
    // 3. 记录隔离原因
    await this.log({
      event: 'node.isolated',
      nodeId,
      reason: 'failure_detected'
    });
  }
  
  async restoreNode(nodeId: string): Promise<void> {
    // 1. 恢复节点状态
    await this.nodeRegistry.updateStatus(nodeId, 'idle');
    
    // 2. 重新注册到路由
    await this.router.register(nodeId);
    
    // 3. 通知其他节点
    await this.broadcast({
      type: 'node:available',
      nodeId
    });
  }
}
```

---

## 5. 故障处理流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    故障检测与处理流程                               │
│                                                                  │
│  ┌──────────┐                                                   │
│  │ 正常执行  │                                                   │
│  └────┬─────┘                                                   │
│       │                                                           │
│       ▼                                                           │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐              │
│  │ 检测异常  │────►│ 判定故障  │────►│ 触发策略  │              │
│  └──────────┘     └──────────┘     └────┬─────┘              │
│                                          │                        │
│       ┌──────────────────────────────────┼────────────────────┐ │
│       │                                  ▼                     │ │
│       │                          ┌──────────────┐             │ │
│       │                          │   节点隔离   │             │ │
│       │                          └──────┬───────┘             │ │
│       │                                 │                     │ │
│       │     ┌─────────────────────────┼────────────────────┐ │ │
│       │     │                         ▼                      │ │ │
│       │     │               ┌──────────────┐              │ │ │
│       │     │               │ 继续其他节点  │              │ │ │
│       │     │               └──────────────┘              │ │ │
│       │     │                                             │ │ │
│       │     │  ┌─────────────────────────────────────────┐ │ │ │
│       │     │  │ 故障节点重启/恢复                         │ │ │
│       │     │  └─────────────────┬───────────────────────┘ │ │ │
│       │     │                    │                         │ │ │
│       │     │                    ▼                         │ │ │
│       │     │           ┌──────────────┐                │ │ │
│       │     │           │ 重新加入集群  │                │ │ │
│       │     │           └──────┬───────┘                │ │ │
│       │     │                  │                         │ │ │
│       │     └──────────────────┼─────────────────────────┘ │ │
│       │                         │                           │ │
│       └─────────────────────────┼───────────────────────────┘ │
│                                 ▼                               │
│                          ┌──────────────┐                        │
│                          │ 恢复执行     │                        │
│                          └──────────────┘                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 相关文档

- [Checkpoint 机制](./00-checkpoint.md)
- [已确认决策](../04-decisions/01-confirmed.md)
