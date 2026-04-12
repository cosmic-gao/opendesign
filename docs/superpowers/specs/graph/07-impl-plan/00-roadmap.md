# 实施路线图

---

## 1. Phase 1: 核心原型（4-6 周）

**目标**: 验证核心概念，单进程运行

### 1.1 任务清单

| 任务 | 产出 | 时间 | 优先级 |
|------|------|------|--------|
| 核心接口定义 | `Graph`, `Node`, `Endpoint`, `Router` 接口 | 1 周 | P0 |
| 单进程执行引擎 | Superstep 循环实现 | 2 周 | P0 |
| 内存 Checkpoint | 状态保存/恢复 | 1 周 | P1 |
| 基础节点实现 | 代码节点、逻辑节点 | 1 周 | P1 |
| 单元测试 | >80% 覆盖率 | 1 周 | P2 |

### 1.2 核心接口定义

```typescript
// 核心类型定义
interface Graph<In extends Endpoints, Out extends Endpoints> {
  id: string;
  addNode(node: NodeDefinition): void;
  addEdge(edge: Edge): void;
  connect(source: NodeEndpoint, target: NodeEndpoint): void;
  compile(options?: CompileOptions): CompiledGraph;
}

interface NodeDefinition {
  id: string;
  type: string;
  endpoints: NodeEndpoints;
  handler: NodeHandler;
}

interface NodeEndpoints {
  in: Record<string, Slot>;
  out: Record<string, Slot>;
}
```

### 1.3 交付标准

- [ ] 单进程可以启动和执行图
- [ ] 节点可以收发消息
- [ ] 超步骤按 BSP 模型执行
- [ ] Checkpoint 可以保存和恢复
- [ ] 单元测试覆盖率 > 80%

---

## 2. Phase 2: 分布式支持（6-8 周）

**目标**: 多进程/多机部署

### 2.1 任务清单

| 任务 | 产出 | 时间 | 优先级 |
|------|------|------|--------|
| Redis 消息路由 | Pub/Sub 实现 | 2 周 | P0 |
| Kafka 集成 | 生产级消息队列 | 2 周 | P0 |
| 分布式 Checkpoint | PostgreSQL + S3 | 2 周 | P0 |
| 服务发现 | Consul/K8s 集成 | 1 周 | P1 |
| 故障恢复测试 | 容错验证 | 1 周 | P1 |

### 2.2 Redis 消息路由实现

```typescript
class RedisMessageRouter implements MessageRouter {
  private publisher: RedisClient;
  private subscriber: RedisClient;
  private subscriptions: Map<string, Set<Handler>>;
  
  async send(msg: TypedMessage): Promise<void> {
    const channel = `node:${msg.targetNodeId}:${msg.targetEndpoint || 'default'}`;
    await this.publisher.publish(channel, JSON.stringify(msg));
  }
  
  async subscribe(
    nodeId: string, 
    endpoint: string, 
    handler: Handler
  ): Promise<Unsubscribe> {
    const channel = `node:${nodeId}:${endpoint}`;
    await this.subscriber.subscribe(channel);
    // ...
  }
}
```

### 2.3 交付标准

- [ ] 多进程可以组成集群
- [ ] 消息可以跨进程传递
- [ ] Checkpoint 可以在集群中共享
- [ ] 节点故障可以被检测和处理

---

## 3. Phase 3: 场景扩展（4-6 周）

**目标**: 完善各场景支持

### 3.1 任务清单

| 任务 | 产出 | 时间 | 优先级 |
|------|------|------|--------|
| AI Agent 节点 | LLM、Tool、Memory 节点 | 2 周 | P0 |
| Human-in-the-loop | interrupt/resume 机制 | 1 周 | P1 |
| 可视化调试 | Graph 调试 UI | 2 周 | P2 |
| 性能优化 | Profiling + 调优 | 1 周 | P2 |

### 3.2 AI 节点接口

```typescript
interface AINodeConfig {
  model: string;
  provider: 'openai' | 'anthropic' | 'ollama';
  tools?: ToolDefinition[];
}

// LLM 节点
class LLMNode implements NodeDefinition {
  async handle(msg: LLMMessage): Promise<NodeResponse> {
    // 调用 LLM
    const response = await this.llm.invoke({
      model: this.config.model,
      messages: msg.context,
      tools: this.config.tools
    });
    
    return {
      messages: response.toolCalls 
        ? { tool: response.toolCalls }
        : { output: response.content }
    };
  }
}
```

### 3.3 交付标准

- [ ] LLM 节点可以调用 OpenAI/Anthropic API
- [ ] Tool 节点可以执行工具
- [ ] Human 节点可以暂停和恢复执行
- [ ] 提供基础的调试 UI

---

## 4. Phase 4: 生产就绪（4 周）

**目标**: 监控、运维、安全

### 4.1 任务清单

| 任务 | 产出 | 时间 | 优先级 |
|------|------|------|--------|
| 监控告警 | Prometheus + Grafana | 1 周 | P1 |
| 日志系统 | Loki/ELK 集成 | 1 周 | P1 |
| 安全加固 | TLS、Auth、RBAC | 1 周 | P1 |
| 文档 | API 文档 + 教程 | 1 周 | P2 |

### 4.2 监控指标

```typescript
const metrics = {
  // 执行指标
  'graph.superstep.duration': { type: 'histogram' },
  'graph.node.messages': { type: 'counter' },
  
  // 资源指标
  'node.memory.usage': { type: 'gauge' },
  'node.cpu.usage': { type: 'gauge' },
  
  // 队列指标
  'router.queue.size': { type: 'gauge' },
  'router.message.latency': { type: 'histogram' }
};
```

### 4.3 交付标准

- [ ] Prometheus 可以采集指标
- [ ] Grafana 可以展示 Dashboard
- [ ] 日志可以集中查询
- [ ] 支持 RBAC 权限控制

---

## 5. 时间线总览

```
Phase 1: 核心原型        ████████████                     (4-6 周)
Phase 2: 分布式支持        █████████████████████             (6-8 周)
Phase 3: 场景扩展                  ████████████████           (4-6 周)
Phase 4: 生产就绪                           ████████████       (4 周)
                                                            
Total:                                            18-24 周
```

---

## 6. 里程碑

| 里程碑 | 时间 | 交付物 |
|--------|------|--------|
| M1 | 第 4 周 | 核心原型，可执行简单图 |
| M2 | 第 10 周 | 分布式版本，可跨进程通信 |
| M3 | 第 16 周 | 完整 AI 工作流支持 |
| M4 | 第 20 周 | 生产就绪版本 |

---

## 7. 风险与缓解

| 风险 | 严重性 | 缓解策略 |
|------|--------|---------|
| 分布式状态一致性 | 高 | 超步骤边界同步 + 乐观锁 |
| Checkpoint 性能 | 中 | 增量 checkpoint + 异步写入 |
| 调试复杂 | 中 | 可视化工具 + 结构化日志 |
| 运维复杂度 | 中 | Kubernetes 抽象 + IaC |

---

## 8. 相关文档

- [待确认决策](../03-decisions/00-pending.md)
- [已确认决策](../03-decisions/01-confirmed.md)
