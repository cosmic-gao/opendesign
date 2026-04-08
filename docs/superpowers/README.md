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

- [设计决策](specs/04-decisions/01-confirmed.md) - 已确认的架构决策
- [核心概念](specs/03-concepts/) - Graph、Node、Endpoint、Message、Superstep
- [实施路线](specs/10-impl-plan/00-roadmap.md) - Phase 1-4 实施计划

### 核心概念

| 概念 | 说明 |
|------|------|
| [Graph](specs/03-concepts/00-graph.md) | 有向图结构 |
| [Node](specs/03-concepts/01-node.md) | 节点、状态机 |
| [Endpoint](specs/03-concepts/02-endpoint.md) | 端点、Slot、类型安全 |
| [Message](specs/03-concepts/03-message.md) | 消息、投递语义 |
| [Superstep](specs/03-concepts/04-superstep.md) | BSP 执行模型 |

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
