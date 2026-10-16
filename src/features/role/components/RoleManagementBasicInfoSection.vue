<template>
  <AppPanelCard>
    <template #header>
      <h2 class="text-xl font-semibold">Role Information</h2>
    </template>

    <div class="grid gap-4 md:grid-cols-2">
      <label class="space-y-2">
        <span class="app-field-label">Role Name *</span>
        <AppFormInput
          v-model="formData.name"
          type="text"
          required
          :disabled="isEdit"
          placeholder="e.g., HR Manager"
        />
        <p v-if="isEdit" class="app-helper-text mt-1">
          The role name cannot be changed. Only its access settings can be updated.
        </p>
      </label>
      <label class="space-y-2">
        <span class="app-field-label">Short Description</span>
        <AppFormInput
          v-model="formData.description"
          type="text"
          :disabled="isEdit"
          placeholder="e.g., Full access to the staff module"
        />
      </label>
    </div>
  </AppPanelCard>
</template>

<script setup lang="ts">
import AppPanelCard from '@/presentation/components/cards/AppPanelCard.vue'
import AppFormInput from '@/presentation/components/forms/AppFormInput.vue'

defineProps<{
  formData: {
    name: string
    description: string
  }
  isEdit: boolean
}>()
</script>
