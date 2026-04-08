# 通用图计算框架架构设计文档

**版本**: v1.1  
**日期**: 2026-04-08  
**状态**: 进行中

---

## 文档索引

| 目录 | 内容 | 本地索引 |
|------|------|----------|
| [01-summary](01-summary/) | 概述 | [README](01-summary/README.md) |
| [02-requirements](02-requirements/) | 需求分析 | [README](02-requirements/README.md) |
| [03-concepts](03-concepts/) | 核心概念 | [README](03-concepts/README.md) |
| [04-decisions](04-decisions/) | 架构决策 | [README](04-decisions/README.md) |
| [05-architecture](05-architecture/) | 核心架构 | [README](05-architecture/README.md) |
| [07-scenarios](07-scenarios/) | 场景扩展 | [README](07-scenarios/README.md) |
| [08-fault-tolerance](08-fault-tolerance/) | 容错与恢复 | [README](08-fault-tolerance/README.md) |
| [10-impl-plan](10-impl-plan/) | 实施计划 | [README](10-impl-plan/README.md) |

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

详情请查看 [04-decisions/01-confirmed](04-decisions/01-confirmed.md)

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

详情请查看 [04-decisions/00-pending](04-decisions/00-pending.md)

---

## 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2026-04-08 | v1.1 | 确认决策 1-4，移除监控部署文档，添加分类索引 |
| 2026-04-07 | v1.0 | 初始文档 |
