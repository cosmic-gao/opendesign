# 架构设计文档

**版本**: v3.0
**日期**: 2026-04-12
**状态**: 进行中

---

## 文档索引（按功能分类）

### Graph 框架

| 分类 | 内容 | 索引 |
|------|------|------|
| [Graph 概述](graph/00-overview/) | 项目概述、核心特性、架构总览 | [README](graph/00-overview/README.md) |
| [Graph 需求分析](graph/01-requirements/) | 目标场景、非功能性需求 | [README](graph/01-requirements/README.md) |
| [Graph 核心概念](graph/02-concepts/) | Graph、Node、Endpoint、Message、Superstep | [README](graph/02-concepts/README.md) |
| [Graph 架构决策](graph/03-decisions/) | 已确认/待确认决策 | [README](graph/03-decisions/README.md) |
| [Graph 核心架构](graph/04-architecture/) | 组件设计、执行流程 | [README](graph/04-architecture/README.md) |
| [Graph 场景扩展](graph/05-scenarios/) | 代码关系图、逻辑编排图、AI工作流图 | [README](graph/05-scenarios/README.md) |
| [Graph 容错恢复](graph/06-fault-tolerance/) | Checkpoint机制、故障检测与恢复 | [README](graph/06-fault-tolerance/README.md) |
| [Graph 实施计划](graph/07-impl-plan/) | Phase 1-4 路线图 | [README](graph/07-impl-plan/README.md) |
---

## 已确认设计决策

| # | 决策 | 结论 |
|---|------|------|
| 1 | Endpoint 命名 | 复合命名 (`in.user`, `out.llm`) |
| 2 | 连接方式 | 显式 + 广播 |
| 3 | 路由规则 | 全部支持 |
| 4 | 类型安全 | 泛型 + 运行时校验 |
| 5 | 状态管理 | 混合模式 |
| 6 | 消息队列 | Redis（开发）+ Kafka（生产） |
| 7 | Checkpoint | 增量 Checkpoint |
| 8 | 消息语义 | At-Least-Once |
| 9 | 故障处理 | 重启恢复 + 隔离 |
| 10 | 图动态性 | 动态图 |
| 11 | Endpoint 类型安全 | TypeScript 泛型约束 |
| 12 | 多 Endpoint 同方向 | 支持 |
| 13 | 执行模型 | BSP |
| 14 | 技术栈 | TypeScript/Node.js + Redis + Kafka |

详情请查看 [Graph 架构决策](graph/03-decisions/01-confirmed.md)

---

## 待确认决策

| # | 决策 | 状态 |
|---|------|------|
| 5 | 流控/背压 | ⏳ 待讨论 |
| 6 | 优先级队列 | ⏳ 待讨论 |
| 7 | 死信队列 | ⏳ 待讨论 |
| 8 | 消息转换 | ⏳ 待讨论 |
| 9 | 端点元数据 | ⏳ 待讨论 |
| 10 | 默认命名约定 | ⏳ 待讨论 |

详情请查看 [Graph 待确认决策](graph/03-decisions/00-pending.md)

---

## 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2026-04-13 | v3.1 | 重新设计 @opentunnel 方案 (v0.2.0)：声明式平铺路由、自动序列化、零中间件 |
| 2026-04-12 | v3.0 | 重组文档结构，按功能分类（graph + tunnel） |
| 2026-04-12 | v2.0 | 重组文档结构，按功能分类，添加 @opentunnel 模块 |
| 2026-04-08 | v1.1 | 确认决策 1-4，移除监控部署文档，添加分类索引 |
| 2026-04-07 | v1.0 | 初始文档 |
