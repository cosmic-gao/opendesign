# Superpowers

**通用能力平台** - 模块化图计算框架，支持代码关系、逻辑编排、AI工作流等多种场景。

---

## 功能模块索引

| 模块 | 说明 | 索引文件 |
|------|------|----------|
| [specs](specs/) | 架构设计文档 | [specs/README](specs/README.md) |
| [plans](plans/) | 实施计划文档 | (规划中) |

---

## 快速导航

### 架构设计 (specs)

- [Graph 概述](specs/graph/00-overview/) - 项目概述、核心特性
- [Graph 核心概念](specs/graph/02-concepts/) - Graph、Node、Endpoint、Message、Superstep
- [Graph 架构决策](specs/graph/03-decisions/) - 已确认/待确认决策
- [Graph 实施路线](specs/graph/07-impl-plan/) - Phase 1-4 实施计划

### 独立模块

| 模块 | 说明 |
|------|------|
| [@opentunnel](specs/tunnel/00-tunnel/) | 通用路由参数解析器 |

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
