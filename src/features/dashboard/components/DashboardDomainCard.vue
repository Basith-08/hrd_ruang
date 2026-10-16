<template>
  <article class="app-section-panel p-5">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="app-dashboard-eyebrow">
          {{ eyebrow }}
        </p>
        <h3 class="app-section-panel-title mt-2 !text-base">
          {{ title }}
        </h3>
      </div>
      <div class="app-kpi-icon-wrap" :class="toneClass">
        <component :is="icon" class="h-5 w-5" />
      </div>
    </div>

    <p class="app-dashboard-copy mt-3">
      {{ description }}
    </p>

    <NuxtLink :to="to" class="app-link-accent mt-4 inline-flex font-medium">
      {{ ctaLabel }} →
    </NuxtLink>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  description: string
  ctaLabel: string
  to: string
  icon: unknown
  toneClass: string
}>()
</script>
