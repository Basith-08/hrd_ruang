<template>
  <AppTable
    :columns="columns"
    :items="roles"
    :loading="loading && roles.length === 0"
    loading-message="Loading roles..."
    empty-message="No matching data found."
  >
    <template #cell-number="{ index }">
      <span class="app-table-muted">{{ pageOffset + index + 1 }}</span>
    </template>

    <template #cell-name="{ item }">
      <p class="app-copy-strong whitespace-nowrap text-base">
        {{ item.name }}
      </p>
    </template>

    <template #cell-description="{ item }">
      <p v-if="item.description" class="app-helper-text">
        {{ item.description }}
      </p>
      <p v-else class="app-table-muted text-xs italic">-</p>
    </template>

    <template #cell-permissions="{ item }">
      <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <span
          v-for="permission in item.permissions"
          :key="permission.id"
          class="app-permission-chip"
          :title="permission.description"
        >
          <span class="app-permission-chip-group">
            {{ formatPermissionGroup(permission.name) }}
          </span>
          <span class="app-permission-chip-action">
            {{ formatPermissionAction(permission.name) }}
          </span>
        </span>
        <span
          v-if="!item.permissions || item.permissions.length === 0"
          class="app-table-muted text-xs italic"
        >
          No permissions configured yet
        </span>
      </div>
    </template>

    <template #cell-actions="{ item }">
      <div class="text-right">
        <RowActionsMenu :actions="buildActions(item)" />
      </div>
    </template>

    <template v-if="!loading && roles.length > 0" #pagination>
      <TablePagination
        :page="page"
        :page-size="pageSize"
        :total-items="totalItems"
        @update:page="$emit('update:page', $event)"
      />
    </template>
  </AppTable>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { Role } from '@/domain/entities/Role'
import RowActionsMenu from '@/presentation/components/menus/RowActionsMenu.vue'
import AppTable, { type AppTableColumn } from '@/presentation/components/tables/AppTable.vue'
import TablePagination from '@/presentation/components/tables/TablePagination.vue'

const props = defineProps<{
  roles: Role[]
  loading: boolean
  saving: boolean
  page: number
  pageSize: number
  totalItems: number
}>()

const emit = defineEmits<{
  (event: 'update:page', value: number): void
  (event: 'edit', roleId: string): void
  (event: 'delete', roleId: string, roleName: string): void
}>()

const columns = computed<AppTableColumn[]>(() => [
  { key: 'number', label: 'No', width: 'w-14' },
  { key: 'name', label: 'Role Name', minWidth: 'min-w-[160px]' },
  { key: 'description', label: 'Description', minWidth: 'min-w-[240px]' },
  { key: 'permissions', label: 'Permissions', minWidth: 'min-w-[520px]' },
  { key: 'actions', label: 'Actions', minWidth: 'min-w-[120px]', align: 'right' },
])

const pageOffset = computed(() => (props.page - 1) * props.pageSize)

function buildActions(role: Role) {
  return [
    {
      label: 'Edit Access',
      disabled: props.saving,
      onClick: () => emit('edit', role.id),
    },
    ...(role.name !== 'super_admin'
      ? [
          {
            label: 'Delete',
            tone: 'danger' as const,
            disabled: props.saving,
            onClick: () => emit('delete', role.id, role.name),
          },
        ]
      : []),
  ]
}

const permissionGroupLabels: Record<string, string> = {
  approval: 'Approval',
  candidate_employee: 'Candidate & Employee',
  candidate_form: 'Candidate Form',
  dashboard: 'Dashboard',
  document: 'Document',
  employee_contract_form: 'New Employee Contract Form',
  employee_form: 'Employee Form',
  employee_request_form: 'Employee Request Form',
  export_configuration: 'Document Export',
  interview_evaluation: 'Interview Evaluation',
  pic_recruitment: 'PIC Recruitment',
  recruitment: 'Recruitment',
  role: 'Role',
  user: 'User',
  user_history: 'User History',
}

const permissionActionLabels: Record<string, string> = {
  approve: 'Approve',
  assign_recruiter: 'Assign Recruiter',
  close: 'Close',
  create: 'Create',
  delete: 'Delete',
  download: 'Download',
  export_pdf: 'Export PDF',
  generate: 'Generate',
  manage: 'Manage',
  read: 'Read',
  update: 'Update',
}

function toTitleCase(value: string) {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => {
      const upper = part.toUpperCase()
      if (['ERF', 'HRD', 'NECF', 'PDF', 'PIC'].includes(upper)) return upper
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    })
    .join(' ')
}

function splitPermissionName(permissionName: string) {
  const normalized = String(permissionName ?? '').trim()

  if (!normalized) {
    return { group: '-', action: '-' }
  }

  const [group = '', ...actionParts] = normalized.split(':')
  const rawAction = actionParts.join(':')

  if (rawAction) {
    const actionWithoutGroupPrefix = rawAction.startsWith(`${group}_`)
      ? rawAction.slice(group.length + 1)
      : rawAction

    return {
      group,
      action: actionWithoutGroupPrefix || rawAction,
    }
  }

  return { group: normalized, action: normalized }
}

function formatPermissionGroup(permissionName: string) {
  const { group } = splitPermissionName(permissionName)
  return permissionGroupLabels[group] ?? toTitleCase(group)
}

function formatPermissionAction(permissionName: string) {
  const { action } = splitPermissionName(permissionName)
  return permissionActionLabels[action] ?? toTitleCase(action)
}
</script>
