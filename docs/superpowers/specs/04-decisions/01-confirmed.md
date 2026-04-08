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

---

## 决策 11: Endpoint 命名规则

**选项**: 复合命名

**结论**:
- 格式：`in.<name>` 或 `out.<name>`
- 支持层级结构：`in.user`, `out.llm`, `in.tool.result`, `out.agent.response`
- 点号分隔命名空间，支持分组管理

**理由**:
- 兼顾灵活性和可读性
- 支持层级结构，可分组管理
- 适合复杂项目

**示例**:
```typescript
// 节点端点定义
interface LLMAgentEndpoints {
  in: {
    user: Slot<UserMessage>;      // in.user
    tool: Slot<ToolResult>;       // in.tool
  };
  out: {
    llm: Slot<LLMRequest>;        // out.llm
    error: Slot<ErrorMessage>;    // out.error
  };
}
```

---

## 决策 12: 边的连接方式

**选项**: 显式端点连接 + 广播

**结论**:
- 显式连接：`A.out:llm -> B.in:tool`（精确指定源和目标）
- 广播连接：`A.out:events -> *`（发送到所有匹配的订阅者）
- 支持多目标：`A.out:llm -> B.in:tool, C.in:request`

**理由**:
- 显式连接：精确控制，无歧义，易于调试
- 广播：支持一对多场景，适合事件通知
- 组合使用满足大多数拓扑需求

**示例**:
```typescript
// 显式连接
graph.connect('Agent.out:llm', 'LLM.in:request');
graph.connect('Agent.out:error', 'ErrorHandler.in:error');

// 广播
graph.broadcast('Events.out:update', '*');

// 多目标
graph.connect('Agent.out:result', ['Parser.in:json', 'Validator.in:data']);
```

---

## 决策 13: 消息路由规则

**选项**: 全部支持（精确 + 广播 + 条件 + 通配符）

**结论**:
| 路由类型 | 说明 | 场景 |
|---------|------|------|
| **精确路由** | 消息只发送到指定的 Endpoint | 点对点通信 |
| **广播路由** | 消息发送到所有匹配的订阅者 | 事件通知 |
| **条件路由** | 根据消息内容决定路由目标 | 动态路由 |
| **通配符路由** | 使用 `*` 匹配任意端点名 | 批量订阅 |

**理由**:
- 不同场景需要不同的路由策略
- 精确路由：强控制、可预测
- 广播路由：解耦、事件驱动
- 条件路由：动态逻辑
- 通配符路由：简化批量连接

**路由优先级**:
1. 精确匹配 > 通配符匹配
2. 条件路由在精确/广播之后判断
3. 多个匹配时都发送（除非设置 single-target）

---

## 决策 14: 类型安全设计方案

**选项**: 泛型约束 + 运行时校验

**结论**:
- 编译时：TypeScript 泛型约束确保类型正确
- 运行时：Schema 验证确保数据有效
- 组合使用兼顾安全性和灵活性

**理由**:
- 泛型：编译时检查，IDE 补全
- 运行时校验：防御性编程，数据验证
- 组合方案适合生产级应用

**示例**:
```typescript
// 泛型约束 - 编译时类型安全
interface Node<In extends Endpoints, Out extends Endpoints> {
  handle(endpoint: keyof In, msg: In[keyof In]): Promise<Partial<Out>>;
}

// 运行时校验 - Schema 定义
const UserMessageSchema = {
  type: 'object',
  properties: {
    content: { type: 'string' },
    role: { type: 'enum', values: ['user', 'assistant'] }
  },
  required: ['content', 'role']
};

// 节点实现
class LLMAgent implements Node<
  { user: Slot<UserMessage>; tool: Slot<ToolResult> },
  { llm: Slot<LLMRequest>; error: Slot<ErrorMessage> }
> {
  async handle(endpoint, msg) {
    // 运行时校验
    validateSchema(msg, UserMessageSchema);
    // 处理逻辑...
  }
}
```
