<template>
  <AppPanelCard container-class="app-surface-card-muted space-y-2 border-transparent p-2">
    <template #header>
      <div class="space-y-3">
        <h3 :class="titleClass">
          {{ title }}
        </h3>
        <p class="app-helper-text">
          {{ description }}
        </p>
      </div>
    </template>

    <div class="space-y-2">
      <label
        v-for="permission in permissions"
        :key="permission.id"
        class="flex cursor-pointer items-start gap-3"
      >
        <input
          type="checkbox"
          :value="permission.id"
          :checked="modelValue.includes(permission.id)"
          class="app-checkbox-accent"
          @change="togglePermission(permission.id, ($event.target as HTMLInputElement).checked)"
        />
        <div>
          <p class="app-copy-strong text-sm">{{ getPermissionDisplayName(permission) }}</p>
          <p
            v-if="getPermissionDisplayName(permission) !== permission.name"
            class="app-table-muted text-[11px]"
          >
            {{ permission.name }}
          </p>
          <p class="app-helper-text">{{ permission.description }}</p>
        </div>
      </label>
    </div>
  </AppPanelCard>
</template>

<script setup lang="ts">
import type { Permission } from '@/domain/entities/Role'
import AppPanelCard from '@/presentation/components/cards/AppPanelCard.vue'

const props = withDefaults(defineProps<{
  title: string
  description: string
  permissions: Permission[]
  modelValue: string[]
  titleClass?: string
}>(), {
  titleClass: 'app-copy-strong app-table-divider border-b pb-2',
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string[]): void
}>()

function togglePermission(permissionId: string, checked: boolean) {
  const current = new Set(props.modelValue)

  if (checked) {
    current.add(permissionId)
  } else {
    current.delete(permissionId)
  }

  emit('update:modelValue', Array.from(current))
}

function getPermissionDisplayName(permission: Permission) {
  const displayNames: Record<string, string> = {
    'employee_request_form:requester_read': 'View ERF Requester',
    'employee_request_form:requester_update': 'Update ERF Requester',
    'employee_request_form:close': 'Close ERF',
    'employee_request_form:export_pdf': 'Export ERF PDF',
    'pic_recruitment:read': 'Read PIC Recruitment',
    'pic_recruitment:update': 'Update PIC Recruitment',
    'export_configuration:read': 'Open Document Export',
    'export_configuration:manage': 'Manage Export Templates',
    'export_configuration:generate': 'Generate Export Documents',
  }

  return displayNames[permission.name] ?? permission.name
}
</script>
