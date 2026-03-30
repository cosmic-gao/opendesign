# Codex Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the `apps/codex` homepage into a lighter, more premium product landing page with a stronger SaaS-style information hierarchy.

**Architecture:** Keep the implementation scoped to the existing homepage and locale file. Replace the current hero-plus-cards layout with a product-oriented structure made of a top navigation row, a stronger hero message, compact KPI badges, and a right-side workspace preview panel built from existing utility classes and shadcn buttons.

**Tech Stack:** Nuxt 4, Vue 3, Tailwind CSS v4, shadcn-nuxt, lucide-vue-next, Nuxt i18n

---

### Task 1: Restructure the homepage layout

**Files:**
- Modify: `apps/codex/app/pages/index.vue`

- [ ] **Step 1: Replace the current centered layout with a product-style shell**

```vue
<main class="min-h-screen ...">
  <div class="mx-auto max-w-7xl">
    <header>...</header>
    <section class="grid ...">
      <div>hero copy and actions</div>
      <div>workspace preview</div>
    </section>
  </div>
</main>
```

- [ ] **Step 2: Add a compact navigation row and trust badges**

Run: update the top portion of `apps/codex/app/pages/index.vue`
Expected: page starts with a thin branded header instead of jumping directly into the hero.

- [ ] **Step 3: Replace feature cards with a workspace preview panel**

Run: update the right column in `apps/codex/app/pages/index.vue`
Expected: right side shows layered product blocks, status chips, and structure panels rather than three separate marketing cards.

### Task 2: Rewrite the Chinese product copy

**Files:**
- Modify: `apps/codex/i18n/locales/zh-CN.json`

- [ ] **Step 1: Replace setup-oriented copy with product-oriented copy**

```json
{
  "eyebrow": "...",
  "title": "...",
  "description": "...",
  "primaryAction": "...",
  "secondaryAction": "..."
}
```

- [ ] **Step 2: Add labels needed by the new shell**

Run: extend `apps/codex/i18n/locales/zh-CN.json`
Expected: locale file includes navigation labels, metrics, and workspace preview strings used by the updated page.

### Task 3: Verify the redesigned page

**Files:**
- Modify: `apps/codex/app/pages/index.vue`
- Modify: `apps/codex/i18n/locales/zh-CN.json`

- [ ] **Step 1: Run the production build**

Run: `pnpm --filter web build`
Expected: PASS with no template, import, or i18n key errors.

- [ ] **Step 2: Review final output structure**

Run: `git status --short .\apps\codex`
Expected: only the homepage and locale file are modified for this redesign step.
