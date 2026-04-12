# Graph 通用图计算框架

**通用图计算框架** - 层次化、分布式、可扩展的图计算运行时，支持代码关系分析、逻辑编排、AI Agent 工作流等多种场景。

---

## 文档索引

| 分类 | 内容 |
|------|------|
| [00-overview](00-overview/) | 项目概述、核心特性、架构总览 |
| [01-requirements](01-requirements/) | 目标场景、非功能性需求 |
| [02-concepts](02-concepts/) | 核心概念：Graph、Node、Endpoint、Message、Superstep |
| [03-decisions](03-decisions/) | 架构决策：已确认/待确认决策 |
| [04-architecture](04-architecture/) | 核心架构：组件设计、执行流程 |
| [05-scenarios](05-scenarios/) | 场景扩展：代码关系图、逻辑编排图、AI工作流图 |
| [06-fault-tolerance](06-fault-tolerance/) | 容错恢复：Checkpoint机制、故障检测与恢复 |
| [07-impl-plan](07-impl-plan/) | 实施计划：Phase 1-4 路线图 |

---

## 核心概念

| 概念 | 说明 | 文档 |
|------|------|------|
| [Graph](02-concepts/00-graph.md) | 有向图结构、节点、边 | 核心概念 |
| [Node](02-concepts/01-node.md) | 节点状态机、生命周期 | 核心概念 |
| [Endpoint](02-concepts/02-endpoint.md) | 端点设计、多端点同方向 | 核心概念 |
| [Message](02-concepts/03-message.md) | 消息结构、投递语义 | 核心概念 |
| [Superstep](02-concepts/04-superstep.md) | BSP执行模型、超步骤 | 核心概念 |

---

## 技术决策

| 决策 | 结论 |
|------|------|
| Endpoint 命名 | 复合命名 (`in.user`, `out.llm`) |
| 连接方式 | 显式 + 广播 |
| 路由规则 | 精确/广播/条件/通配符 |
| 类型安全 | 泛型 + 运行时校验 |
| 执行模型 | BSP |
| 消息语义 | At-Least-Once |

详情请查看 [03-decisions](03-decisions/)

---

## 相关链接

- [@opentunnel 路由解析器](../tunnel/00-tunnel/) - 通用 API 路由参数解析库
