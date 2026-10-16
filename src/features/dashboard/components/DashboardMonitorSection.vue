<template>
  <section class="app-section-panel">
    <div
      class="app-dashboard-panel-header flex-col items-start gap-4 xl:flex-row xl:justify-between"
    >
      <div class="max-w-3xl">
        <p class="app-dashboard-eyebrow">
          {{ eyebrow }}
        </p>
        <h2 class="app-dashboard-title mt-2 !text-[1.3rem]">
          {{ title }}
        </h2>
        <p class="app-dashboard-copy mt-2">
          {{ description }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2 xl:max-w-sm xl:justify-end">
        <span
          v-for="module in sourceModules"
          :key="module"
          class="app-status-chip app-status-chip-neutral"
        >
          {{ module }}
        </span>
      </div>
    </div>

    <div
      class="grid gap-5 p-5"
      :class="links.length > 0 ? 'lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]' : ''"
    >
      <div class="app-dashboard-subpanel">
        <p class="app-fieldset-label">
          {{ signalsLabel }}
        </p>
        <div v-if="signalItems.length > 0" class="mt-3 space-y-3">
          <article
            v-for="signal in signalItems"
            :key="`${signal.title}-${signal.value ?? signal.copy ?? ''}`"
            class="app-dashboard-card px-4 py-3"
          >
            <div class="flex items-start justify-between gap-4">
              <p class="app-copy-strong text-sm leading-6">
                {{ signal.title }}
              </p>
              <p v-if="signal.value" class="app-copy-strong shrink-0 text-sm">
                {{ signal.value }}
              </p>
            </div>
            <p v-if="signal.copy" class="app-copy-body mt-1">
              {{ signal.copy }}
            </p>
          </article>
        </div>
        <ul v-else class="mt-3 space-y-2">
          <li
            v-for="signal in plannedSignals"
            :key="signal"
            class="flex items-start gap-2 text-sm leading-6 text-[var(--app-color-text-muted)]"
          >
            <span class="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--app-color-accent)]" />
            <span>{{ signal }}</span>
          </li>
        </ul>
      </div>

      <div v-if="links.length > 0" class="app-dashboard-subpanel border-dashed">
        <p class="app-fieldset-label">
          {{ linksLabel }}
        </p>
        <div class="mt-3 flex flex-col gap-2">
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="inline-flex items-center justify-between rounded-2xl bg-[var(--app-color-surface-muted)] px-4 py-3 text-sm font-medium text-[var(--app-color-text-muted)] transition hover:bg-[var(--app-color-surface-subtle)] hover:text-[var(--app-color-text)]"
          >
            <span>{{ link.label }}</span>
            <span aria-hidden="true">→</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    signalItems?: Array<{
      title: string
      value?: string
      copy?: string
    }>
    eyebrow: string
    title: string
    description: string
    signalsLabel: string
    linksLabel: string
    sourceModules: string[]
    plannedSignals: string[]
    links: Array<{ label: string; to: string }>
  }>(),
  {
    signalItems: () => [],
  },
)
</script>
