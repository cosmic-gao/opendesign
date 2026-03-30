<script setup lang="ts">
import {
  ArrowRight,
  Blocks,
  ChevronRight,
  Languages,
  LayoutPanelTop,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-vue-next'

const { t } = useI18n()

const metrics = [
  {
    key: 'metricLaunchSpeed',
  },
  {
    key: 'metricConsistency',
  },
  {
    key: 'metricScale',
  },
]

const workspaceCards = [
  {
    key: 'workspaceBoards',
    icon: LayoutPanelTop,
  },
  {
    key: 'workspaceSystem',
    icon: Blocks,
  },
  {
    key: 'workspaceLocale',
    icon: Languages,
  },
]
</script>

<template>
  <main class="relative min-h-screen bg-slate-50 px-6 py-6 text-foreground sm:px-8 lg:px-10">
    <!-- 简洁背景 - 去除过度装饰 -->
    <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#fff_0%,#f8fafc_100%)]" />

    <div class="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col">
      <!-- 简洁 Header -->
      <header class="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white/80 px-5 py-3.5 backdrop-blur-sm">
        <div class="flex items-center gap-3">
          <div class="flex size-9 items-center justify-center rounded-xl bg-slate-950 text-white">
            <Sparkles class="size-4" />
          </div>
          <div>
            <p class="text-sm font-semibold tracking-wider text-slate-950">{{ t('brand') }}</p>
            <p class="text-xs text-slate-400">{{ t('brandTagline') }}</p>
          </div>
        </div>

        <nav class="hidden items-center gap-8 text-sm text-slate-500 md:flex">
          <a href="#overview" class="transition-colors hover:text-slate-900">{{ t('navOverview') }}</a>
          <a href="#workspace" class="transition-colors hover:text-slate-900">{{ t('navWorkspace') }}</a>
          <a href="#system" class="transition-colors hover:text-slate-900">{{ t('navSystem') }}</a>
        </nav>

        <div class="hidden items-center gap-2 sm:flex">
          <Button variant="ghost" class="rounded-xl px-4 text-slate-600 hover:text-slate-900">
            {{ t('secondaryAction') }}
          </Button>
          <Button class="rounded-xl px-5">
            {{ t('primaryAction') }}
          </Button>
        </div>
      </header>

      <!-- 主内容区 -->
      <section
        id="overview"
        class="grid flex-1 gap-12 py-12 lg:grid-cols-[1fr_480px] lg:items-center lg:py-16"
      >
        <!-- 左侧文案区 -->
        <div class="space-y-8">
          <div class="inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white px-4 py-1.5 text-sm text-slate-600">
            <span class="flex size-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <ShieldCheck class="size-3" />
            </span>
            <span>{{ t('eyebrow') }}</span>
          </div>

          <div class="space-y-4">
            <h1 class="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-[3.5rem]">
              {{ t('title') }}
            </h1>
            <p class="max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg">
              {{ t('description') }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <Button class="group h-10 rounded-xl px-5 text-sm">
              {{ t('primaryAction') }}
              <ArrowRight class="size-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button
              variant="outline"
              class="h-10 rounded-xl border-slate-200 bg-white px-5 text-sm text-slate-600 hover:bg-slate-50"
            >
              {{ t('secondaryAction') }}
            </Button>
          </div>

          <!-- 指标卡片 - 简化 -->
          <div class="grid grid-cols-3 gap-3">
            <article
              v-for="metric in metrics"
              :key="metric.key"
              class="rounded-xl border border-slate-200/60 bg-white p-4"
            >
              <p class="text-xl font-semibold tracking-tight text-slate-950">
                {{ t(`${metric.key}.value`) }}
              </p>
              <p class="mt-1 text-xs text-slate-500">
                {{ t(`${metric.key}.label`) }}
              </p>
            </article>
          </div>
        </div>

        <!-- 右侧预览区 -->
        <div id="workspace" class="relative">
          <div class="absolute inset-x-8 -top-4 h-20 rounded-full bg-slate-200/30 blur-2xl" />
          <div class="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/90 p-4 shadow-xl shadow-slate-200/40 sm:p-5">
            <div class="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <p class="text-xs font-medium text-slate-400">{{ t('previewLabel') }}</p>
                  <h2 class="mt-0.5 text-base font-semibold text-slate-950">{{ t('previewTitle') }}</h2>
                </div>
                <div class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                  <Zap class="size-3" />
                  {{ t('previewStatus') }}
                </div>
              </div>

              <div class="mt-4 space-y-3">
                <!-- Hero Card -->
                <section class="rounded-xl border border-slate-200 bg-slate-900 p-4 text-white">
                  <div class="flex items-center justify-between">
                    <p class="text-xs text-white/50">{{ t('workspaceHeroLabel') }}</p>
                    <span class="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                      {{ t('workspaceHeroTag') }}
                    </span>
                  </div>
                  <h3 class="mt-3 text-lg font-semibold text-white">{{ t('workspaceHeroTitle') }}</h3>
                  <p class="mt-1.5 text-xs leading-5 text-white/60">
                    {{ t('workspaceHeroDescription') }}
                  </p>
                </section>

                <div class="grid gap-3 lg:grid-cols-[1fr_180px]">
                  <!-- 能力面板 -->
                  <div class="rounded-xl border border-slate-200 bg-white p-4">
                    <div class="flex items-center justify-between">
                      <h3 class="text-xs font-semibold text-slate-900">{{ t('panelTitle') }}</h3>
                      <span class="text-xs text-slate-400">{{ t('panelMeta') }}</span>
                    </div>

                    <div class="mt-3 space-y-2">
                      <article
                        v-for="card in workspaceCards"
                        :key="card.key"
                        class="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/60 p-3"
                      >
                        <div class="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-white text-slate-950">
                          <component :is="card.icon" class="size-3.5" />
                        </div>
                        <div class="min-w-0 flex-1">
                          <h4 class="text-xs font-medium text-slate-950">{{ t(`${card.key}.title`) }}</h4>
                          <p class="mt-0.5 text-xs leading-4 text-slate-400">
                            {{ t(`${card.key}.description`) }}
                          </p>
                        </div>
                      </article>
                    </div>
                  </div>

                  <!-- 技术栈面板 -->
                  <aside
                    id="system"
                    class="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <p class="text-xs font-semibold text-slate-900">{{ t('stackTitle') }}</p>
                    <div class="mt-3 space-y-1.5">
                      <div
                        v-for="item in ['Nuxt 4', 'Tailwind v4', 'shadcn', 'i18n']"
                        :key="item"
                        class="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-2.5 py-2 text-xs text-slate-500"
                      >
                        <span>{{ item }}</span>
                        <ChevronRight class="size-3 text-slate-300" />
                      </div>
                    </div>
                    <div class="mt-3 rounded-lg bg-slate-900 px-3 py-3 text-white">
                      <p class="text-[10px] uppercase tracking-widest text-white/40">{{ t('stackFootnoteLabel') }}</p>
                      <p class="mt-1.5 text-xs leading-4 text-white/60">
                        {{ t('stackFootnote') }}
                      </p>
                    </div>
                  </aside>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
