# 通用图计算框架架构设计文档

**版本**: v1.0  
**日期**: 2026-04-07  
**状态**: 进行中（设计决策待确认）

---

## 文档索引

### 第一部分：概述

| 文档 | 内容 |
|------|------|
| [00-overview](01-summary/00-overview.md) | 执行摘要、项目概述、核心特性 |

### 第二部分：需求分析

| 文档 | 内容 |
|------|------|
| [00-scenarios](02-requirements/00-scenarios.md) | 目标场景（代码关系、逻辑编排、AI工作流） |
| [01-nfr](02-requirements/01-nfr.md) | 非功能性需求（性能、可用性、扩展性） |

### 第三部分：核心概念

| 文档 | 内容 |
|------|------|
| [00-graph](03-concepts/00-graph.md) | Graph 图、有向图定义 |
| [01-node](03-concepts/01-node.md) | Node 节点、节点状态、节点类型 |
| [02-endpoint](03-concepts/02-endpoint.md) | **Endpoint/Slot 端点设计**（多端点同方向、类型安全）|
| [03-message](03-concepts/03-message.md) | Message 消息、消息类型、投递语义 |
| [04-superstep](03-concepts/04-superstep.md) | Superstep 超步骤、BSP 模型 |

### 第四部分：架构决策

| 文档 | 内容 |
|------|------|
| [00-pending](04-decisions/00-pending.md) | **待确认决策**（命名规则、连接方式、路由规则） |
| [01-confirmed](04-decisions/01-confirmed.md) | 已确认决策（混合状态管理、增量Checkpoint等） |

### 第五部分：核心架构

| 文档 | 内容 |
|------|------|
| [00-overview](05-architecture/00-overview.md) | 整体架构图、组件关系 |
| [01-core-components](05-architecture/01-core-components.md) | 核心组件详细设计 |
| [02-execution-flow](05-architecture/02-execution-flow.md) | 超步骤执行流程、状态合并 |

### 第六部分：分布式部署

| 文档 | 内容 |
|------|------|
| [00-k8s](06-deployment/00-k8s.md) | Kubernetes 部署架构 |

### 第七部分：场景扩展

| 文档 | 内容 |
|------|------|
| [00-code-graph](07-scenarios/00-code-graph.md) | 代码关系图扩展 |
| [01-logic-graph](07-scenarios/01-logic-graph.md) | 逻辑编排图扩展 |
| [02-ai-graph](07-scenarios/02-ai-graph.md) | AI 工作流图扩展 |

### 第八部分：容错与恢复

| 文档 | 内容 |
|------|------|
| [00-checkpoint](08-fault-tolerance/00-checkpoint.md) | Checkpoint 机制 |
| [01-recovery](08-fault-tolerance/01-recovery.md) | 故障检测与恢复 |

### 第九部分：可观测性

| 文档 | 内容 |
|------|------|
| [00-metrics](09-observability/00-metrics.md) | 监控指标定义 |
| [01-logging](09-observability/01-logging.md) | 日志结构设计 |

### 第十部分：实施计划

| 文档 | 内容 |
|------|------|
| [00-roadmap](10-impl-plan/00-roadmap.md) | 实施路线图、Phase 规划 |

---

## 待确认决策清单

### 关键决策（影响架构）

| # | 决策点 | 状态 | 参考文档 |
|---|--------|------|----------|
| 1 | Endpoint 命名规则 | **待确认** | [04-decisions/00-pending](04-decisions/00-pending.md) |
| 2 | 边的连接方式 | **待确认** | [04-decisions/00-pending](04-decisions/00-pending.md) |
| 3 | 消息路由规则 | **待确认** | [04-decisions/00-pending](04-decisions/00-pending.md) |
| 4 | 类型安全设计方案 | **待确认** | [04-decisions/00-pending](04-decisions/00-pending.md) |
| 5 | 高级特性（流控、死信等） | **待确认** | [04-decisions/00-pending](04-decisions/00-pending.md) |

### 已确认决策

| # | 决策点 | 结论 | 参考文档 |
|---|--------|------|----------|
| 1 | 状态管理模型 | 混合模式（子图内集中式 + 跨子图消息传递） | [04-decisions/01-confirmed](04-decisions/01-confirmed.md) |
| 2 | 消息队列 | Redis（开发）+ Kafka（生产） | [04-decisions/01-confirmed](04-decisions/01-confirmed.md) |
| 3 | Checkpoint 策略 | 增量 Checkpoint | [04-decisions/01-confirmed](04-decisions/01-confirmed.md) |
| 4 | 消息语义 | At-Least-Once | [04-decisions/01-confirmed](04-decisions/01-confirmed.md) |
| 5 | 节点故障处理 | 重启恢复 + 隔离机制 | [04-decisions/01-confirmed](04-decisions/01-confirmed.md) |
| 6 | 图动态性 | 动态图（运行时可修改） | [04-decisions/01-confirmed](04-decisions/01-confirmed.md) |
| 7 | Endpoint 类型安全 | **已确定需要** | [03-concepts/02-endpoint](03-concepts/02-endpoint.md) |
| 8 | 多 Endpoint 同方向 | **已确定** | [03-concepts/02-endpoint](03-concepts/02-endpoint.md) |

---

## 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2026-04-07 | v1.0 | 初始文档，引入 Endpoint/Slot 概念，拆分文档结构 |
