# 容错与恢复

本部分描述图计算框架的容错机制和恢复策略。

## 文档

| 文档 | 内容 |
|------|------|
| [00-checkpoint](./00-checkpoint.md) | Checkpoint 机制 |
| [01-recovery](./01-recovery.md) | 故障检测与恢复 |

## 核心机制

### Checkpoint 策略
- 增量 Checkpoint（每个 superstep 边界保存 diff）
- 全量 base（每 N 个 superstep）
- 消息日志支持 replay

### 故障恢复
- 故障检测 → 隔离故障节点 → 继续其他节点 → 故障节点重启 → 从 checkpoint 恢复

### 消息语义
- At-Least-Once 投递
- 配合节点内部去重/幂等设计

## 相关链接

- [核心架构](../05-architecture/) - 容错机制在架构中的位置
- [已确认决策](../04-decisions/01-confirmed.md) - Checkpoint 和故障处理的决策
