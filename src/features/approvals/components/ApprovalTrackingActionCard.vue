<template>
  <div class="app-surface-card p-5">
    <h3 class="app-label-compact">
      {{ title }}
    </h3>
    <label class="mt-4 block space-y-2">
      <AppTextarea
        :model-value="noteValue"
        rows="4"
        :placeholder="notesPlaceholder"
        @update:model-value="$emit('update:noteValue', $event)"
      />
    </label>

    <div class="mt-4 flex gap-3">
      <AppActionButton
        variant="success"
        :label="approveLabel"
        :disabled="saving"
        @click="$emit('approve')"
      />
      <AppActionButton
        variant="dangerSubtle"
        :label="rejectLabel"
        :disabled="saving"
        @click="$emit('reject')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppTextarea from '@/presentation/components/forms/AppTextarea.vue'

withDefaults(
  defineProps<{
    title: string
    noteValue?: string
    notesPlaceholder: string
    approveLabel: string
    rejectLabel: string
    saving: boolean
  }>(),
  {
    noteValue: '',
  },
)

defineEmits<{
  (event: 'update:noteValue', value: string): void
  (event: 'approve'): void
  (event: 'reject'): void
}>()
</script>
