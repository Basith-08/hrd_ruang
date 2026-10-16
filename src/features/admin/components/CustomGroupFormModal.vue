<template>
  <div v-if="open" class="app-modal-overlay">
    <div class="app-modal-card max-w-md p-6">
      <h3 class="app-modal-title">{{ title }}</h3>
      <form class="mt-6 space-y-5" @submit.prevent="$emit('submit')">
        <div class="space-y-2">
          <AppFieldLabel>{{ nameLabel }}</AppFieldLabel>
          <AppFormInput
            :model-value="name"
            type="text"
            required
            :placeholder="namePlaceholder"
            @update:model-value="$emit('update:name', $event)"
          />
        </div>
        <div class="space-y-2">
          <AppFieldLabel>{{ descriptionLabel }}</AppFieldLabel>
          <AppTextarea
            :model-value="description"
            rows="4"
            :placeholder="descriptionPlaceholder"
            @update:model-value="$emit('update:description', $event)"
          />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <AppActionButton :label="cancelLabel" variant="ghost" @click="$emit('cancel')" />
          <AppActionButton
            type="submit"
            variant="primary"
            :label="saveLabel"
            :loading-label="savingLabel"
            :loading="saving"
            :disabled="saving"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppFieldLabel from '@/presentation/components/forms/AppFieldLabel.vue'
import AppFormInput from '@/presentation/components/forms/AppFormInput.vue'
import AppTextarea from '@/presentation/components/forms/AppTextarea.vue'

defineProps<{
  open: boolean
  title: string
  name: string
  description: string
  saving: boolean
  nameLabel: string
  namePlaceholder: string
  descriptionLabel: string
  descriptionPlaceholder: string
  cancelLabel: string
  saveLabel: string
  savingLabel: string
}>()

defineEmits<{
  (event: 'update:name', value: string): void
  (event: 'update:description', value: string): void
  (event: 'cancel'): void
  (event: 'submit'): void
}>()
</script>
