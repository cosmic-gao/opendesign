<script setup lang="ts">
import { ArrowRight, Sparkles } from 'lucide-vue-next'

const { t } = useI18n()
</script>

<template>
  <main class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a]">
    <div class="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-purple-500/30 to-blue-500/30 blur-[120px]" />

    <div class="relative z-10 px-6 text-center">
      <div class="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 backdrop-blur-xl">
        <Sparkles class="size-4 text-purple-400" />
        <span class="text-sm text-white/70">Product Canvas</span>
      </div>

      <h1 class="mt-8 text-5xl font-semibold tracking-tight text-white sm:text-7xl">
        {{ t('title') }}
      </h1>

      <p class="mx-auto mt-6 max-w-lg text-lg text-white/50">
        {{ t('description') }}
      </p>

      <div class="mt-10 flex items-center justify-center gap-4">
        <button class="group relative h-12 overflow-hidden rounded-full bg-white px-8 text-sm font-medium text-black transition-all hover:scale-105">
          <span class="relative z-10 flex items-center gap-2">
            {{ t('primaryAction') }}
            <ArrowRight class="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </button>
        <button class="h-12 rounded-full border border-white/20 px-8 text-sm font-medium text-white/70 transition-all hover:border-white/30 hover:text-white">
          {{ t('secondaryAction') }}
        </button>
      </div>
    </div>

    <div class="absolute bottom-8 left-0 right-0 text-center">
      <p class="text-xs text-white/30">Built with Nuxt 4 · Tailwind v4 · shadcn</p>
    </div>
  </main>
</template>
