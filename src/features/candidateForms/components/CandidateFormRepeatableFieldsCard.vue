<template>
  <div class="app-card-frame">
    <div
      class="app-card-frame-header sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p class="app-card-title">{{ title }}</p>
        <p v-if="description" class="app-card-copy">{{ description }}</p>
        <p v-if="helperText" class="app-card-copy italic">{{ helperText }}</p>
      </div>
      <button
        v-if="addAction && addLabel"
        type="button"
        class="app-button app-button-secondary w-full sm:w-auto"
        @click="addAction"
      >
        {{ addLabel }}
      </button>
    </div>

    <div v-if="items.length === 0" class="app-card-copy px-4 py-4">
      {{ emptyText }}
    </div>

    <div class="app-card-frame-body space-y-0">
      <div
        v-for="row in items"
        :key="row.key"
        :class="row.rowClass || defaultRowClass"
      >
        <CandidateFormObjectFields
          :class="row.fieldsWrapperClass"
          :item="row.item"
          :fields="row.fields"
          :grid-class="row.fieldsGridClass || defaultFieldsGridClass"
          :is-read-only="isReadOnly"
          :sanitize-nested-number-field="sanitizeNestedNumberField"
        />
        <button
          v-if="row.remove"
          type="button"
          class="app-action-link-danger"
          @click="row.remove()"
        >
          {{ removeLabel }}
        </button>
      </div>
    </div>

    <div v-if="footerAddAction && footerAddLabel" class="app-card-frame-footer">
      <button
        type="button"
        class="app-button app-button-secondary"
        @click="footerAddAction"
      >
        {{ footerAddLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

import CandidateFormObjectFields from '@/features/candidateForms/components/CandidateFormObjectFields.vue'
import type { CandidateFormRepeatableFieldRow } from '@/features/candidateForms/types/CandidateFormPage.type'

defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  helperText: {
    type: String,
    default: '',
  },
  items: {
    type: Array as PropType<CandidateFormRepeatableFieldRow[]>,
    default: () => [],
  },
  emptyText: {
    type: String,
    default: '',
  },
  addLabel: {
    type: String,
    default: '',
  },
  addAction: {
    type: Function as PropType<() => void>,
    default: undefined,
  },
  footerAddLabel: {
    type: String,
    default: '',
  },
  footerAddAction: {
    type: Function as PropType<() => void>,
    default: undefined,
  },
  removeLabel: {
    type: String,
    default: 'Remove item',
  },
  isReadOnly: {
    type: Boolean,
    default: false,
  },
  defaultRowClass: {
    type: String,
    default: 'app-repeatable-row md:grid-cols-2',
  },
  defaultFieldsGridClass: {
    type: String,
    default: 'grid gap-4 md:grid-cols-2',
  },
  sanitizeNestedNumberField: {
    type: Function as PropType<(target: object, key: string) => void>,
    default: undefined,
  },
})
</script>
