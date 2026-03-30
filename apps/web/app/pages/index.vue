<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
    <section class="space-y-6 text-center">
      <p class="text-sm uppercase tracking-[0.24em] text-muted-foreground">apps/web</p>
      <h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">{{ t('title') }}</h1>
      <p class="mx-auto max-w-xl text-base leading-7 text-muted-foreground">
        {{ t('description') }}
      </p>
      <div class="flex items-center justify-center gap-3">
        <Button>{{ t('primaryAction') }}</Button>
        <Button variant="outline">{{ t('secondaryAction') }}</Button>
      </div>
    </section>
  </main>
</template>
