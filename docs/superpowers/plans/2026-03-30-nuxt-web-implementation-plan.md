# Nuxt Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `apps/web` as a Nuxt 4 application inside the existing pnpm monorepo with Tailwind CSS v4, `@nuxtjs/i18n`, and `shadcn-vue` wired with default settings and `zh-CN` as the default locale.

**Architecture:** Extend the root workspace to include `apps/**`, scaffold a Nuxt app in `apps/web`, then add Tailwind v4, i18n, and shadcn-vue in place. Keep all generated UI files inside `apps/web` so the setup stays isolated from existing packages.

**Tech Stack:** pnpm workspace, Nuxt 4, Vue 3, Tailwind CSS v4, `@tailwindcss/vite`, `@nuxtjs/i18n`, `shadcn-vue`

---

### Task 1: Prepare the monorepo for an app package

**Files:**
- Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: Add the apps workspace glob**

```yaml
packages:
  - 'apps/**'
  - 'packages/**'
  - 'configs/**'
```

- [ ] **Step 2: Verify the workspace file is readable**

Run: `Get-Content .\pnpm-workspace.yaml`
Expected: Output includes `apps/**` as the first workspace glob.

### Task 2: Scaffold the Nuxt application

**Files:**
- Create: `apps/web/*`

- [ ] **Step 1: Create the Nuxt app with pnpm**

```powershell
pnpm dlx nuxi@latest init apps/web
```

- [ ] **Step 2: Install the new app dependencies**

```powershell
pnpm install
```

- [ ] **Step 3: Verify the new package exists**

Run: `Get-ChildItem .\apps\web`
Expected: Output includes `package.json`, `app`, and Nuxt config files.

### Task 3: Add Tailwind v4 and i18n

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/nuxt.config.ts`
- Create: `apps/web/app/assets/css/tailwind.css`
- Create: `apps/web/locales/zh-CN.json`

- [ ] **Step 1: Add runtime and build dependencies**

```powershell
pnpm --filter web add @nuxtjs/i18n
pnpm --filter web add -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Register Tailwind and i18n in Nuxt**

```ts
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  css: ['~/app/assets/css/tailwind.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  modules: ['@nuxtjs/i18n'],
  i18n: {
    defaultLocale: 'zh-CN',
    locales: [
      {
        code: 'zh-CN',
        language: 'zh-CN',
        name: '简体中文',
        file: 'zh-CN.json',
      },
    ],
    lazy: true,
    langDir: 'locales',
  },
})
```

- [ ] **Step 3: Add Tailwind and locale source files**

```css
@import "tailwindcss";
```

```json
{
  "title": "OpenDesign",
  "description": "Nuxt 4 初始化完成"
}
```

- [ ] **Step 4: Verify dependency installation**

Run: `pnpm --filter web list --depth 0`
Expected: Output includes `@nuxtjs/i18n`, `tailwindcss`, and `@tailwindcss/vite`.

### Task 4: Initialize shadcn-vue and wire a basic screen

**Files:**
- Create: `apps/web/components.json`
- Create: `apps/web/components/ui/*`
- Create: `apps/web/lib/utils.ts`
- Modify: `apps/web/app/app.vue` or page files

- [ ] **Step 1: Run the shadcn-vue initializer**

```powershell
pnpm --filter web dlx shadcn-vue@latest init
```

- [ ] **Step 2: Generate a base button component**

```powershell
pnpm --filter web dlx shadcn-vue@latest add button
```

- [ ] **Step 3: Render a minimal localized home screen**

```vue
<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-white px-6">
    <section class="space-y-4 text-center">
      <h1 class="text-3xl font-semibold">{{ t('title') }}</h1>
      <p class="text-muted-foreground">{{ t('description') }}</p>
      <Button>开始使用</Button>
    </section>
  </main>
</template>
```

- [ ] **Step 4: Verify the app starts**

Run: `pnpm --filter web dev`
Expected: Nuxt dev server starts without module resolution or CSS errors.
