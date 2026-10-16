<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[1660px] border-separate border-spacing-0 text-left text-sm">
      <thead class="app-dashboard-table-head">
        <tr>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[56px]">
            {{ text('userManagement.page.table.number') }}
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[220px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'name')">
              <span>{{ text('userManagement.page.table.name') }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('name') }}</span>
            </button>
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[220px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'email')">
              <span>{{ text('userManagement.page.table.email') }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('email') }}</span>
            </button>
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[160px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'phone')">
              <span>{{ text('userManagement.page.table.phone') }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('phone') }}</span>
            </button>
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[180px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'department')">
              <span>{{ text('userManagement.page.table.department') }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('department') }}</span>
            </button>
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[180px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'designation')">
              <span>{{ text('userManagement.page.table.designation') }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('designation') }}</span>
            </button>
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[180px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'main_position')">
              <span>{{ text('userManagement.page.table.mainPosition') }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('main_position') }}</span>
            </button>
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[140px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'candidate_form_completion_status')">
              <span>{{ text('common.labels.formStatus') }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('candidate_form_completion_status') }}</span>
            </button>
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[140px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'status')">
              <span>{{ text('userManagement.page.table.status') }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('status') }}</span>
            </button>
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[140px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'role')">
              <span>{{ text('userManagement.page.table.role') }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('role') }}</span>
            </button>
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[170px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'created_at')">
              <span>{{ text('userManagement.page.table.registeredDate') }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('created_at') }}</span>
            </button>
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[180px]">
            {{ text('userManagement.page.table.actions') }}
          </th>
        </tr>
      </thead>

      <tbody>
        <template v-if="!loading && items.length > 0">
          <tr
            v-for="(user, index) in items"
            :key="user.id || index"
            class="transition hover:bg-sky-50/40"
          >
            <td class="border-b border-slate-200 px-4 py-4 text-sm text-slate-400 align-middle whitespace-nowrap">
              {{ pageOffset + index + 1 }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span class="app-copy-strong">{{ getDisplayName(user) }}</span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ user.email || '-' }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ user.phone || '-' }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ getDepartmentLabel(user) }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ getDesignationLabel(user) }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ user.main_position || '-' }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span :class="formStatusBadge(user.candidate_form_completion_status)">
                {{ formStatusLabel(user.candidate_form_completion_status) }}
              </span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span
                class="app-status-chip"
                :class="user.is_active === false ? 'app-status-chip-danger' : 'app-status-chip-success'"
              >
                {{ user.is_active === false ? text('userManagement.shared.inactive') : text('userManagement.shared.active') }}
              </span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span class="app-status-chip" :class="roleBadge(user.role)">
                {{ user.role || text('userManagement.shared.noRole') }}
              </span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ formatDateTimeDisplay(user.created_at) }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 text-right align-middle whitespace-nowrap">
              <RowActionsMenu :actions="buildRowActions(user)" />
            </td>
          </tr>
        </template>

        <tr v-else-if="loading">
          <td colspan="12" class="px-6 py-20 text-center">
            <div class="app-table-muted flex flex-col items-center justify-center gap-3">
              <svg class="h-8 w-8 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p class="text-xs font-medium">
                {{ text('userManagement.shared.loading') }}
              </p>
            </div>
          </td>
        </tr>

        <tr v-else>
          <td colspan="12" class="px-6 py-10">
            <div class="app-dashboard-empty">
              {{ text('userManagement.page.empty') }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div
    v-if="!loading && totalItems > 0"
    class="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/80 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
  >
    <div class="text-sm text-slate-500">
      <strong class="font-semibold text-slate-800">{{ pageStart }}</strong>
      -
      <strong class="font-semibold text-slate-800">{{ pageEnd }}</strong>
      /
      <strong class="font-semibold text-slate-800">{{ totalItems }}</strong>
    </div>

    <TablePagination
      :page="page"
      :page-size="pageSize"
      :total-items="totalItems"
      @update:page="$emit('update:page', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'

import type { ManagedUser } from '@/domain/entities/ManagedUser'
import type { UserRole } from '@/domain/entities/User'
import { candidateStatusBadge, candidateStatusLabel } from '@/features/candidateForms/candidateFormStatus'
import RowActionsMenu, { type RowAction } from '@/presentation/components/menus/RowActionsMenu.vue'
import TablePagination from '@/presentation/components/tables/TablePagination.vue'

const props = defineProps({
  items: {
    type: Array as PropType<ManagedUser[]>,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  page: {
    type: Number,
    required: true,
  },
  pageSize: {
    type: Number,
    required: true,
  },
  totalItems: {
    type: Number,
    required: true,
  },
  text: {
    type: Function as PropType<(key: string) => string>,
    required: true,
  },
  getDisplayName: {
    type: Function as PropType<(user: ManagedUser) => string>,
    required: true,
  },
  getDepartmentLabel: {
    type: Function as PropType<(user: ManagedUser) => string>,
    required: true,
  },
  getDesignationLabel: {
    type: Function as PropType<(user: ManagedUser) => string>,
    required: true,
  },
  roleBadge: {
    type: Function as PropType<(role: UserRole | null) => string>,
    required: true,
  },
  buildRowActions: {
    type: Function as PropType<(user: ManagedUser) => RowAction[]>,
    required: true,
  },
  formatDateTimeDisplay: {
    type: Function as PropType<(value: string | null | undefined) => string>,
    required: true,
  },
  sortIndicator: {
    type: Function as PropType<(key: string) => string>,
    required: true,
  },
})

defineEmits<{
  (event: 'update:page', value: number): void
  (event: 'sort', value: string): void
}>()

const pageOffset = computed(() => (props.page - 1) * props.pageSize)
const pageStart = computed(() => {
  if (props.totalItems === 0) return 0
  return (props.page - 1) * props.pageSize + 1
})
const pageEnd = computed(() => {
  if (props.totalItems === 0) return 0
  return Math.min(props.page * props.pageSize, props.totalItems)
})

function formStatusLabel(status: string | null | undefined) {
  return candidateStatusLabel(props.text, status)
}

function formStatusBadge(status: string | null | undefined) {
  return candidateStatusBadge(status)
}
</script>
