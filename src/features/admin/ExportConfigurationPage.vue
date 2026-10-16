<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-3">
    <AppPanelCard container-class="gap-3 p-4 sm:p-5">
      <p class="app-section-eyebrow">
        {{ text('exportConfiguration.page.eyebrow') }}
      </p>
      <h1 class="app-page-title">
        {{ text('exportConfiguration.home.title') }}
      </h1>
      <p class="app-page-description">
        {{ text('exportConfiguration.home.description') }}
      </p>
    </AppPanelCard>

    <div
      v-if="canManageTemplates || canGenerateDocuments"
      class="grid gap-4 lg:grid-cols-2"
    >
      <NuxtLink
        v-if="canManageTemplates"
        to="/configuration-export/templates"
        class="app-surface-card group p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
      >
        <div class="flex h-full flex-col">
          <p class="app-section-eyebrow">
            {{ text('exportConfiguration.home.templates.eyebrow') }}
          </p>
          <h2 class="app-section-title mt-2">
            {{ text('exportConfiguration.home.templates.title') }}
          </h2>
          <p class="app-copy-body mt-2">
            {{ text('exportConfiguration.home.templates.description') }}
          </p>
          <div class="app-copy-strong mt-4 inline-flex items-center text-sm">
            {{ text('exportConfiguration.home.templates.cta') }}
          </div>
        </div>
      </NuxtLink>

      <NuxtLink
        v-if="canGenerateDocuments"
        to="/configuration-export/generate"
        class="app-surface-card group p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
      >
        <div class="flex h-full flex-col">
          <p class="app-section-eyebrow app-tone-success-text">
            {{ text('exportConfiguration.home.generate.eyebrow') }}
          </p>
          <h2 class="app-section-title mt-2">
            {{ text('exportConfiguration.home.generate.title') }}
          </h2>
          <p class="app-copy-body mt-2">
            {{ text('exportConfiguration.home.generate.description') }}
          </p>
          <div class="app-copy-strong mt-4 inline-flex items-center text-sm">
            {{ text('exportConfiguration.home.generate.cta') }}
          </div>
        </div>
      </NuxtLink>
    </div>

    <AppPanelCard
      v-else
      container-class="gap-2 p-4 sm:p-5"
    >
      <p class="app-copy-strong text-base">
        {{ text('exportConfiguration.home.emptyTitle') }}
      </p>
      <p class="app-copy-body">
        {{ text('exportConfiguration.home.emptyDescription') }}
      </p>
    </AppPanelCard>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useLocale } from '@/composables/useLocale'
import { useAuthViewModel } from '@/viewmodels/useAuthViewModel'
import AppPanelCard from '@/presentation/components/cards/AppPanelCard.vue'

const { text } = useLocale()
const { hasPermission } = useAuthViewModel()

const canManageTemplates = computed(() => hasPermission('export_configuration:manage'))
const canGenerateDocuments = computed(() => hasPermission('export_configuration:generate'))
</script>
