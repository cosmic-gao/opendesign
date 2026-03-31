# Codex 首页光影流动效果设计规范

## 概述

为 codex 首页添加**鼠标跟随光晕效果**，增强视觉层次感和交互体验。

## 设计目标

- 光晕柔和地跟随鼠标移动
- 营造聚焦感和沉浸式体验
- 保持现有深色主题一致性

## 技术方案

### 组件结构

```
app/components/ui/glow-orb/
├── GlowOrb.vue      # 光晕组件
└── index.ts         # 导出
```

### GlowOrb 组件规格

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `size` | `number` | `400` | 光晕直径 (px) |
| `blur` | `number` | `120` | 模糊程度 (px) |
| `colorFrom` | `string` | `'rgba(168,85,247,0.5)'` | 渐变起始色 (紫色) |
| `colorTo` | `string` | `'rgba(59,130,246,0.3)'` | 渐变结束色 (蓝色) |
| `transitionDuration` | `number` | `150` | 过渡时长 (ms) |

### 光晕样式

- **尺寸**: 400px × 400px 圆形
- **模糊**: 120px 高斯模糊
- **渐变**: 径向渐变从中心紫色到边缘蓝色渐隐
- **层级**: `pointer-events: none`, `z-index: 0`
- **位置**: `position: fixed` 全屏覆盖

### 动画行为

1. 鼠标移动时，光晕通过 `transform: translate()` 跟随
2. 使用 CSS `transition: transform 150ms ease-out` 实现平滑移动
3. GPU 加速: `will-change: transform`

## 集成方式

在 `app/pages/index.vue` 中引入 GlowOrb 组件：

```vue
<template>
  <main class="relative ...">
    <GlowOrb />
    <!-- 其他内容 -->
  </main>
</template>
```

## 性能考虑

- 光晕不拦截鼠标事件
- 使用 `will-change: transform` 启用 GPU 加速
- 避免频繁重绘

## 兼容性

- 现代浏览器 (Chrome, Firefox, Safari, Edge)
- 移动端触摸设备暂不跟随 (touchmove 事件)
