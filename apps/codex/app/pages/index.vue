<script setup lang="ts">
import { ArrowRight, Blocks, Languages, Sparkles } from 'lucide-vue-next'

const { t } = useI18n()

const featureCards = [
  {
    key: 'featureDesign',
    icon: Sparkles,
  },
  {
    key: 'featureSystem',
    icon: Blocks,
  },
  {
    key: 'featureI18n',
    icon: Languages,
  },
]
</script>

<template>
  <main class="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(249,115,22,0.16),_transparent_24%),linear-gradient(180deg,_#fcfcfd_0%,_#f4f7fb_52%,_#eef2f7_100%)] px-6 py-10 text-foreground">
    <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:72px_72px]" />

    <div class="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center">
      <section class="grid w-full gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-end">
        <div class="space-y-8">
          <div class="inline-flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
            <span class="h-2 w-2 rounded-full bg-emerald-500" />
            <span>{{ t('eyebrow') }}</span>
          </div>

          <div class="space-y-5">
            <p class="text-sm uppercase tracking-[0.32em] text-slate-500">apps/codex</p>
            <h1 class="max-w-4xl text-5xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-7xl">
              {{ t('title') }}
            </h1>
            <p class="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              {{ t('description') }}
            </p>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row">
            <Button class="group h-11 rounded-full px-6 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.14)]">
              {{ t('primaryAction') }}
              <ArrowRight class="size-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button variant="outline" class="h-11 rounded-full border-white/70 bg-white/70 px-6 text-sm text-slate-700 backdrop-blur hover:bg-white">
              {{ t('secondaryAction') }}
            </Button>
          </div>
        </div>

        <div class="grid gap-4">
          <article
            v-for="card in featureCards"
            :key="card.key"
            class="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur"
          >
            <div class="mb-5 inline-flex rounded-2xl bg-slate-950 p-3 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]">
              <component :is="card.icon" class="size-5" />
            </div>
            <h2 class="text-xl font-semibold tracking-tight text-slate-950">
              {{ t(`${card.key}.title`) }}
            </h2>
            <p class="mt-3 text-sm leading-7 text-slate-600">
              {{ t(`${card.key}.description`) }}
            </p>
          </article>
        </div>
      </section>
    </div>
  </main>
</template>
