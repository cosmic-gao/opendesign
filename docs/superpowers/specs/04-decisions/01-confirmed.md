# 已确认的设计决策

本文档记录已确认的架构设计决策。

---

## 决策 1: 状态管理模型

**选项**: 混合模式

**结论**:
- 子图内：集中式 State
- 跨子图：消息传递

**理由**:
- AI 工作流：子图内集中式（简化编程），跨子图消息传递（解耦）
- 代码关系：天然层次化（包/模块/文件），适合混合模式
- 逻辑编排：需要灵活的条件分支，混合模式最合适

**参考**: [Pregel BSP 模型](../03-concepts/04-superstep.md)

---

## 决策 2: 消息队列

**选项**: 场景适配混合模式

**结论**:
- 开发/测试环境：Redis Pub/Sub（轻量、低延迟）
- 生产环境：Kafka（高可靠、可扩展）

**理由**:
- 统一接口，通过配置切换
- 减少开发环境依赖
- 生产环境保证高可靠性

---

## 决策 3: Checkpoint 策略

**选项**: 增量 Checkpoint

**结论**:
- 每个 superstep 边界保存状态 diff
- 每 N 个 superstep 保存一次全量 base
- 结合消息日志支持 replay
- 可配置 checkpoint 频率

**理由**:
- 存储效率高
- checkpoint 操作快
- 适合 Long-running 任务

---

## 决策 4: 消息传递语义

**选项**: At-Least-Once

**结论**:
- AI 工作流节点通常幂等
- 配合节点内部去重/幂等设计
- 降低系统复杂度

**理由**:
- Exactly-Once 实现复杂，性能开销大（2-3 倍）
- 大多数 AI 工作流场景可以接受少量重复

---

## 决策 5: 节点故障处理

**选项**: 重启恢复 + 隔离机制

**结论**:
- 默认策略：重启恢复
- 可配置隔离机制（关键节点）
- 流程：故障检测 → 隔离故障节点 → 继续其他节点 → 故障节点重启 → 从 checkpoint 恢复

**理由**:
- 实现简单
- 状态完整
- 不阻塞整体执行

---

## 决策 6: 图结构的动态性

**选项**: 动态图

**结论**:
- 运行时可添加/删除节点
- 节点可动态连接到其他节点
- 通过版本号管理一致性

**理由**:
- AI Agent 场景需要动态添加/删除节点
- 适应复杂的工作流需求

---

## 决策 7: Endpoint 类型安全

**选项**: TypeScript 泛型约束

**结论**:
```typescript
interface Node<In extends Endpoints, Out extends Endpoints> {
  handle(endpoint: keyof In, msg: In[keyof In]): Out[keyof Out];
}
```

**理由**:
- 编译时类型检查
- 防止错误类型的消息发送到错误的端点
- IDE 支持好

---

## 决策 8: 多 Endpoint 同方向

**选项**: 支持多个同方向 Endpoint

**结论**:
- 一个节点可以有多个输入端点（如 `in:user`, `in:tool`, `in:memory`）
- 一个节点可以有多个输出端点（如 `out:llm`, `out:tool`, `out:error`）

**理由**:
- 区分不同类型的消息
- 更清晰的关注点分离
- 适合复杂节点的职责划分

---

## 决策 9: 执行模型

**选项**: BSP (Bulk Synchronous Parallel)

**结论**:
- Superstep = 本地计算 + 通信 + 同步屏障
- 简化并行编程模型
- 避免死锁/竞态条件

**理由**:
- 强一致性保证
- 易于理解和调试
- 适合图计算场景

---

## 决策 10: 技术栈

**选项**: TypeScript/Node.js + Redis + PostgreSQL + Kafka

**结论**:

| 组件 | 推荐技术 |
|------|---------|
| Runtime | Node.js + TypeScript |
| 消息队列 | Kafka / Redis Streams |
| 状态存储 | Redis + PostgreSQL |
| Checkpoint | S3/MinIO |
| 服务发现 | Consul / Kubernetes DNS |
| 容器化 | Docker + Kubernetes |
| 监控 | Prometheus + Grafana |

**理由**:
- TypeScript：统一前端/后端生态，AI 场景集成方便
- Redis/Kafka：成熟的分布式基础设施
