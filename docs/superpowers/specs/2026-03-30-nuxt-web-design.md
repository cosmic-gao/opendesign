# Nuxt Web App Design

**Date:** 2026-03-30

## Goal

在 `apps/web` 初始化一个符合当前 `pnpm monorepo` 结构的 Nuxt 4 应用，并完成 Tailwind CSS v4、`@nuxtjs/i18n` 与 `shadcn-vue` 的默认接入，默认语言为 `zh-CN`。

## Decisions

- 应用目录固定为 `apps/web`
- 保持现有 `pnpm monorepo`，在 workspace 中加入 `apps/**`
- 样式层使用 Tailwind CSS v4
- 国际化先只配置 `zh-CN`
- UI 组件路线使用 `shadcn-vue`，按 Nuxt 场景接入其默认配置
- 先生成一个最小首页与基础组件，确认工程和样式系统可用

## Architecture

根目录继续作为 monorepo 入口，`apps/web` 作为前端应用子包。Nuxt 配置负责组合 Tailwind、i18n 与组件别名；国际化文案放在应用内的 `locales` 目录；`shadcn-vue` 组件和工具文件保留在应用目录内，避免影响其他包。

## File Outline

- `pnpm-workspace.yaml`: 纳入 `apps/**`
- `apps/web/package.json`: Nuxt 应用依赖与脚本
- `apps/web/nuxt.config.ts`: 注册 `@nuxtjs/i18n`
- `apps/web/app/assets/css/tailwind.css`: Tailwind v4 入口
- `apps/web/locales/zh-CN.json`: 默认中文文案
- `apps/web/components/ui/*`: `shadcn-vue` 生成组件
- `apps/web/lib/utils.ts`: `shadcn-vue` 默认工具文件
- `apps/web/app/app.vue` 或页面文件: 最小可运行界面

## Validation

- `pnpm --filter web dev` 可以启动 Nuxt 应用
- 首页能显示中文文案
- 已生成至少一个 `shadcn-vue` 基础组件并能正常渲染
