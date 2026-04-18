# Tunnel 跨框架路由适配器

**版本**: v3.0

---

## 概述

`@opendesign/tunnel` 是一个极致轻量、高性能、框架无关的路由代理层中间件。

## 核心能力

| 能力 | 说明 |
|------|------|
| **零代价热更新 (HMR)** | FNV-1a 哈希 + 内存 Map，O(1) 路由热替换 |
| **13 个响应函数** | 统一 Hono 风格签名 `(data, status?, headers?)` |
| **Reply<T> = T \| Response** | 普通对象兜底 JSON / 响应函数直接透传 |
| **前缀 `**` 通配符** | 批量卸载路由 |
| **操作结果明确** | `register`/`unregister`/`has` 返回语义清晰 |
| **reply 二分支** | Response 透传 / T 兜底 json |
| **无 update** | register 注册时直接替换旧 handler |

## 文档

- [详细设计文档](./00-tunnel/00-tunnel-design.md)
