<template>
  <div class="app-pagination-bar flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <p class="app-pagination-meta">
      Showing <span class="app-pagination-strong">{{ startItem }}</span>–<span class="app-pagination-strong">{{ endItem }}</span>
      of <span class="app-pagination-strong">{{ totalItems }}</span>
    </p>

    <div class="flex items-center justify-end gap-2">
      <button
        type="button"
        class="app-pagination-button"
        :disabled="page <= 1"
        @click="emit('update:page', page - 1)"
      >
        Prev
      </button>
      <p class="app-pagination-meta">
        Page <span class="app-pagination-strong">{{ page }}</span> / <span class="app-pagination-strong">{{ totalPages }}</span>
      </p>
      <button
        type="button"
        class="app-pagination-button"
        :disabled="page >= totalPages"
        @click="emit('update:page', page + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  pageSize?: number
  totalItems: number
}>()

const emit = defineEmits<{
  (e: 'update:page', value: number): void
}>()

const pageSize = computed(() => props.pageSize ?? 10)
const totalPages = computed(() => Math.max(1, Math.ceil(props.totalItems / pageSize.value)))
const startItem = computed(() => (props.totalItems === 0 ? 0 : (props.page - 1) * pageSize.value + 1))
const endItem = computed(() => Math.min(props.totalItems, props.page * pageSize.value))
</script>
