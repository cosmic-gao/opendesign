# Checkpoint 机制

本文档定义框架的 Checkpoint 机制，用于容错和状态恢复。

---

## 1. 概述

Checkpoint 是在特定时间点保存的系统状态快照，支持故障恢复和时间旅行。

```
┌─────────────────────────────────────────────────────────────────┐
│                    Checkpoint 机制                                │
│                                                                  │
│  Superstep 0: ──► [Checkpoint 0] ──►                              │
│  Superstep 1: ──► [Delta 1] ──►                                  │
│  Superstep 2: ──► [Delta 2] ──►                                  │
│  Superstep 3: ──► [Checkpoint 3] ──►                             │
│  ...                                                             │
│                                                                  │
│  恢复时: 从最近的 Checkpoint + Delta 重建状态                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Checkpoint 类型

### 2.1 全量 Checkpoint

```typescript
interface FullCheckpoint {
  id: string;
  graphId: string;
  superstep: number;
  
  // 状态快照
  nodeStates: Map<string, NodeStateSnapshot>;
  edgeStates: Map<string, EdgeState>;
  
  // 元数据
  timestamp: number;
  checksum: string;
  size: number;                    // 字节大小
}
```

### 2.2 增量 Checkpoint

```typescript
interface IncrementalCheckpoint {
  id: string;
  baseCheckpointId: string;      // 基础 Checkpoint ID
  superstep: number;
  
  // 增量更新
  deltas: {
    nodeId: string;
    stateDiff: Partial<NodeState>;  // 状态 diff
    messageDeltas: TypedMessage[];   // 新增消息
  }[];
  
  timestamp: number;
}
```

---

## 3. Checkpoint Manager

```typescript
interface CheckpointManager {
  // 保存全量 Checkpoint
  saveFull(checkpoint: FullCheckpoint): Promise<string>;
  
  // 保存增量 Checkpoint
  saveIncremental(checkpoint: IncrementalCheckpoint): Promise<string>;
  
  // 恢复
  restore(checkpointId: string): Promise<FullCheckpoint>;
  
  // 恢复增量
  restoreIncremental(
    baseId: string,
    incrementalIds: string[]
  ): Promise<FullCheckpoint>;
  
  // 获取最近 Checkpoint
  getLatest(graphId: string): Promise<FullCheckpoint | null>;
  
  // 获取指定超步骤的 Checkpoint
  getBySuperstep(
    graphId: string, 
    superstep: number
  ): Promise<FullCheckpoint | null>;
  
  // 垃圾回收
  gc(graphId: string, keepCount: number): Promise<void>;
  
  // 获取历史
  getHistory(
    graphId: string, 
    limit?: number
  ): Promise<CheckpointMetadata[]>;
}
```

---

## 4. 实现示例

```typescript
class DistributedCheckpointManager implements CheckpointManager {
  private redis: RedisClient;
  private postgres: PostgresClient;
  private s3: S3Client;
  
  async saveFull(checkpoint: FullCheckpoint): Promise<string> {
    const id = `cp-${checkpoint.graphId}-${checkpoint.superstep}-${Date.now()}`;
    
    // 1. 保存到 PostgreSQL（索引和元数据）
    await this.postgres.query(
      `INSERT INTO checkpoints (id, graph_id, superstep, timestamp, checksum, size)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, checkpoint.graphId, checkpoint.superstep, checkpoint.timestamp, 
       checkpoint.checksum, checkpoint.size]
    );
    
    // 2. 保存状态到 S3（大型数据）
    const stateKey = `checkpoints/${checkpoint.graphId}/${id}/state.json`;
    await this.s3.putObject(stateKey, JSON.stringify({
      nodeStates: Array.from(checkpoint.nodeStates.entries()),
      edgeStates: Array.from(checkpoint.edgeStates.entries())
    }));
    
    // 3. Redis 缓存最近 Checkpoint 索引
    await this.redis.set(`latest:${checkpoint.graphId}`, id, 'EX', 86400);
    
    return id;
  }
  
  async restore(checkpointId: string): Promise<FullCheckpoint> {
    // 1. 获取元数据
    const meta = await this.postgres.query(
      'SELECT * FROM checkpoints WHERE id = $1',
      [checkpointId]
    );
    
    // 2. 从 S3 恢复状态
    const stateKey = `checkpoints/${meta.graph_id}/${checkpointId}/state.json`;
    const stateData = await this.s3.getObject(stateKey);
    
    return {
      id: checkpointId,
      graphId: meta.graph_id,
      superstep: meta.superstep,
      nodeStates: new Map(stateData.nodeStates),
      edgeStates: new Map(stateData.edgeStates),
      timestamp: meta.timestamp,
      checksum: meta.checksum,
      size: meta.size
    };
  }
}
```

---

## 5. Checkpoint 策略

### 5.1 基于频率

```typescript
interface CheckpointPolicy {
  // 每 N 个超步骤保存一次
  frequency: number;
  
  // 或基于时间
  intervalMs?: number;
  
  // 或基于状态变化
  onStateChangeThreshold?: number;
}

// 默认策略
const defaultPolicy: CheckpointPolicy = {
  frequency: 5,              // 每 5 个超步骤
  intervalMs: 60000,        // 或每分钟
  onStateChangeThreshold: 1000  // 或状态变化超过 1000 次
};
```

### 5.2 增量策略

```typescript
class IncrementalCheckpointStrategy {
  private baseEvery = 10;  // 每 10 个超步骤保存一次全量
  private pendingDeltas: IncrementalCheckpoint[] = [];
  
  shouldSaveFull(superstep: number): boolean {
    return superstep % this.baseEvery === 0;
  }
  
  addDelta(delta: IncrementalCheckpoint): void {
    this.pendingDeltas.push(delta);
    
    // 积累一定数量的增量后，强制保存全量
    if (this.pendingDeltas.length >= 5) {
      this.pendingDeltas = [];
      return true;  // 触发全量保存
    }
    return false;
  }
}
```

---

## 6. 消息日志

除了状态 Checkpoint，还需要保存消息日志用于 replay：

```typescript
interface MessageLog {
  superstep: number;
  messages: TypedMessage[];
  timestamp: number;
}

// 保存消息日志
async saveMessageLog(log: MessageLog): Promise<void> {
  // 消息日志单独存储，用于恢复时 replay
  const key = `logs/${log.graphId}/${log.superstep}`;
  await this.redis.rpush(key, JSON.stringify(log.messages));
}

// Replay 消息
async replayMessages(
  graphId: string,
  fromSuperstep: number,
  toSuperstep: number
): Promise<TypedMessage[]> {
  const messages: TypedMessage[] = [];
  
  for (let s = fromSuperstep; s <= toSuperstep; s++) {
    const key = `logs/${graphId}/${s}`;
    const msgs = await this.redis.lrange(key, 0, -1);
    messages.push(...msgs.map(m => JSON.parse(m)));
  }
  
  return messages;
}
```

---

## 7. 恢复流程

```typescript
class RecoveryManager {
  async recover(graphId: string): Promise<void> {
    // 1. 获取最近的 Checkpoint
    const latest = await this.checkpointManager.getLatest(graphId);
    if (!latest) {
      throw new Error(`No checkpoint found for graph ${graphId}`);
    }
    
    // 2. 恢复所有节点状态
    for (const [nodeId, state] of latest.nodeStates) {
      await this.nodeRegistry.restoreState(nodeId, state);
    }
    
    // 3. 获取增量 Checkpoint
    const incrementals = await this.getIncrementalsAfter(latest.id);
    
    // 4. 应用增量
    for (const inc of incrementals) {
      await this.applyIncremental(inc);
    }
    
    // 5. Replay 消息
    const messages = await this.replayMessages(
      graphId,
      latest.superstep,
      this.currentSuperstep
    );
    
    // 6. 继续执行
    await this.executor.continueFrom(messages);
  }
}
```

---

## 8. 相关文档

- [故障检测与恢复](./01-recovery.md)
- [已确认决策](../04-decisions/01-confirmed.md)
