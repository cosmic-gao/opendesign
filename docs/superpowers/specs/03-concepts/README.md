# 核心概念

本部分定义图计算框架的核心概念。

## 文档

| 文档 | 内容 |
|------|------|
| [00-graph](./00-graph.md) | Graph 图、有向图定义 |
| [01-node](./01-node.md) | Node 节点、节点状态、节点类型 |
| [02-endpoint](./02-endpoint.md) | **Endpoint/Slot 端点设计**（多端点同方向、类型安全）|
| [03-message](./03-message.md) | Message 消息、消息类型、投递语义 |
| [04-superstep](./04-superstep.md) | Superstep 超步骤、BSP 模型 |

## 核心概念索引

### Graph（图）
- 有向图结构
- 节点和边的定义
- 子图支持

### Node（节点）
- 节点状态机
- 节点类型分类
- 节点生命周期

### Endpoint（端点）
- 复合命名：`in.user`, `out.llm`
- Slot 槽位定义
- 多端点同方向支持
- 类型安全（泛型 + 运行时校验）

### Message（消息）
- 消息结构
- 消息类型
- 投递语义（At-Least-Once）

### Superstep（超步骤）
- BSP 执行模型
- 同步屏障
- 消息传递

## 相关链接

- [核心架构](../05-architecture/) - 基于核心概念的架构设计
- [已确认决策](../04-decisions/01-confirmed.md) - 概念相关的架构决策
