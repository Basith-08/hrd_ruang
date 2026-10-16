<template>
  <div class="flex flex-col gap-5">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div class="max-w-2xl">
        <p class="app-dashboard-eyebrow">
          {{ filterEyebrow }}
        </p>
        <h2 class="app-dashboard-title mt-2 !text-[1.15rem]">
          {{ filterTitle }}
        </h2>
      </div>

      <AppActionButton
        class="h-11 px-4 py-0 xl:flex-none"
        variant="ghost"
        :label="resetLabel"
        :disabled="!hasActiveFilters"
        @click="$emit('reset')"
      />
    </div>

      <div class="grid gap-3 xl:grid-cols-[minmax(320px,1.45fr)_minmax(220px,0.8fr)]">
        <label class="block">
          <span class="app-fieldset-label mb-1.5 block">
            {{ searchLabel }}
          </span>
          <AppSearchInput
            :model-value="searchQuery"
            :placeholder="searchPlaceholder"
            @update:model-value="$emit('update:searchQuery', $event)"
          />
        </label>

        <label class="block">
          <span class="app-fieldset-label mb-1.5 block">
            {{ statusLabel }}
          </span>
          <SearchableSelect
            :model-value="statusFilter"
            :options="statusOptions"
            :placeholder="statusPlaceholder"
            show-empty-option
            :empty-label="allStatusesLabel"
            @update:model-value="$emit('update:statusFilter', typeof $event === 'string' ? $event : '')"
          />
        </label>

      <p class="app-helper-text mt-3">
        {{ tip }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

import type { ApprovalTrackingSelectOption } from '@/features/approvals/types/ApprovalTrackingPage.type'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppSearchInput from '@/presentation/components/forms/AppSearchInput.vue'
import SearchableSelect from '@/presentation/components/forms/SearchableSelect.vue'

defineProps({
  searchQuery: {
    type: String,
    required: true,
  },
  statusFilter: {
    type: String,
    required: true,
  },
  statusOptions: {
    type: Array as PropType<ApprovalTrackingSelectOption[]>,
    default: () => [],
  },
  searchLabel: {
    type: String,
    required: true,
  },
  statusLabel: {
    type: String,
    required: true,
  },
  searchPlaceholder: {
    type: String,
    required: true,
  },
  statusPlaceholder: {
    type: String,
    required: true,
  },
  allStatusesLabel: {
    type: String,
    required: true,
  },
  filterEyebrow: {
    type: String,
    required: true,
  },
  filterTitle: {
    type: String,
    required: true,
  },
  resetLabel: {
    type: String,
    required: true,
  },
  hasActiveFilters: {
    type: Boolean,
    required: true,
  },
  tip: {
    type: String,
    required: true,
  },
})

defineEmits<{
  (event: 'update:searchQuery', value: string): void
  (event: 'update:statusFilter', value: string): void
  (event: 'reset'): void
}>()
</script>
