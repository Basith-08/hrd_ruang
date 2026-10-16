<template>
  <div class="flex w-full flex-col gap-4">
    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div class="max-w-3xl">
          <p class="app-dashboard-eyebrow">
            {{ isStaffUser ? text('userManagement.page.eyebrow.staff') : text('userManagement.page.eyebrow.admin') }}
          </p>
          <h1 class="app-dashboard-title mt-3">{{ pageTitle }}</h1>
          <p class="app-dashboard-copy mt-3 max-w-2xl">
            {{ pageDescription }}
          </p>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row xl:flex-none">
          <AppActionButton class="inline-flex min-h-11 min-w-[120px] items-center justify-center" variant="secondary"
            :loading="loading" :label="text('userManagement.shared.refresh')"
            :loading-label="text('userManagement.shared.loading')" @click="refreshUsers" />
          <AppActionButton class="inline-flex min-h-11 min-w-[140px] items-center justify-center" variant="primary"
            :label="addButtonLabel" @click="goToCreate" />
        </div>
      </div>
    </section>

    <AppAlert :message="error" />

    <div v-if="candidateAccessModalUser && candidateAccessModalInfo" class="app-modal-overlay"
      @click.self="closeCandidateAccessModal">
      <div class="app-modal-card max-w-md p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="app-section-eyebrow">
              {{ text('userManagement.page.access.title') }}
            </p>
            <h2 class="app-modal-title mt-2">
              {{ getDisplayName(candidateAccessModalUser) }}
            </h2>
            <p class="app-modal-description mt-2">
              {{ text('userManagement.page.access.description') }}
            </p>
          </div>
          <button type="button" class="app-button app-button-secondary px-3 py-2" @click="closeCandidateAccessModal">
            {{ text('userManagement.shared.close') }}
          </button>
        </div>

        <div class="app-state-card mt-5 p-4" :class="candidateAccessModalInfo.accentClass">
          <p class="text-sm font-semibold">{{ candidateAccessModalInfo.summary }}</p>
          <p class="mt-1 text-sm">{{ candidateAccessModalInfo.detail }}</p>
        </div>

        <dl class="app-copy-body mt-5 space-y-3">
          <div class="flex items-start justify-between gap-4">
            <dt class="app-table-muted font-medium">{{ text('userManagement.page.access.registeredDate') }}</dt>
            <dd class="text-right">{{ candidateAccessModalInfo.registeredAtLabel }}</dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="app-table-muted font-medium">{{ text('userManagement.page.access.lastActivatedDate') }}</dt>
            <dd class="text-right">{{ candidateAccessModalInfo.activatedAtLabel }}</dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="app-table-muted font-medium">{{ text('userManagement.page.access.autoDeactivateDate') }}</dt>
            <dd class="text-right">{{ candidateAccessModalInfo.expiryAtLabel }}</dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="app-table-muted font-medium">{{ text('userManagement.page.access.daysRemaining') }}</dt>
            <dd class="text-right">{{ candidateAccessModalInfo.remainingDaysLabel }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <section class="app-dashboard-panel">
      <div class="p-5">
        <div
          v-if="effectiveScope === 'candidateEmployee'"
          class="flex flex-col gap-5"
        >
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div class="min-w-0 flex-1 max-w-2xl">
              <h2 class="app-dashboard-title !mt-0 !text-[1.15rem]">{{ listTitle }}</h2>
              <p v-if="listDescription" class="app-dashboard-copy mt-1">
                {{ listDescription }}
              </p>
            </div>

            <div class="flex flex-col gap-2 sm:flex-row xl:flex-none">
              <AppActionButton class="h-11 px-4 py-0 xl:flex-none" variant="ghost"
                :label="text('userManagement.page.filters.reset')" :disabled="!hasActiveFilters"
                @click="resetFilters" />
            </div>
          </div>

          <div class="grid gap-3 xl:grid-cols-2 2xl:grid-cols-[minmax(280px,1.2fr)_repeat(3,minmax(180px,0.7fr))]">
            <label class="block">
              <span class="app-fieldset-label mb-1.5 block">
                {{ text('common.labels.search') }}
              </span>
              <AppSearchInput v-model="searchQuery" :placeholder="searchPlaceholder" class="w-full" />
            </label>
            <label class="block min-w-0">
              <span class="app-fieldset-label mb-1.5 block">
                {{ text('userManagement.page.table.role') }}
              </span>
              <SearchableSelect v-model="roleFilter" :options="roleFilterSelectOptions"
                :placeholder="text('userManagement.page.roleSearchPlaceholder')" show-empty-option
                :empty-label="text('userManagement.page.allRoles')" />
            </label>
            <label class="block min-w-0">
              <span class="app-fieldset-label mb-1.5 block">
                {{ text('common.labels.status') }}
              </span>
              <SearchableSelect v-model="accountStatusFilter" :options="accountStatusFilterSelectOptions"
                :placeholder="text('userManagement.page.statusSearchPlaceholder')" show-empty-option
                :empty-label="text('common.status.all')" />
            </label>
            <label class="block min-w-0">
              <span class="app-fieldset-label mb-1.5 block">
                {{ text('common.labels.formStatus') }}
              </span>
              <SearchableSelect v-model="formStatusFilter" :options="formStatusFilterSelectOptions"
                :placeholder="text('candidateForms.list.filters.formStatusPlaceholder')" show-empty-option
                :empty-label="text('common.status.all')" />
            </label>
          </div>
        </div>

        <div v-else class="flex flex-col gap-5">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div class="max-w-2xl">
              <h2 class="app-dashboard-title !mt-0 !text-[1.15rem]">{{ listTitle }}</h2>
              <p v-if="listDescription" class="app-dashboard-copy mt-1">
                {{ listDescription }}
              </p>
            </div>
            <div class="flex flex-col gap-2 sm:flex-row xl:flex-none">
              <AppActionButton class="h-11 px-4 py-0 xl:flex-none" variant="ghost"
                :label="text('userManagement.page.filters.reset')" :disabled="!hasActiveFilters"
                @click="resetFilters" />
            </div>
          </div>

          <div class="grid gap-3" :class="filterGridClass">
            <label class="block">
              <span class="app-fieldset-label mb-1.5 block">
                {{ text('common.labels.search') }}
              </span>
              <AppSearchInput v-model="searchQuery" :placeholder="searchPlaceholder" class="w-full" />
            </label>
            <label v-if="showRoleFilter" class="block min-w-0">
              <span class="app-fieldset-label mb-1.5 block">
                {{ text('userManagement.page.table.role') }}
              </span>
              <SearchableSelect v-model="roleFilter" :options="roleFilterSelectOptions"
                :placeholder="text('userManagement.page.roleSearchPlaceholder')" show-empty-option
                :empty-label="text('userManagement.page.allRoles')" />
            </label>
          </div>
        </div>
      </div>

      <CandidateEmployeeTable v-if="effectiveScope === 'candidateEmployee'" v-model:page="page" :items="pagedUsers"
        :loading="loading" :page-size="pageSize" :total-items="sortedUsers.length" :text="text"
        :get-display-name="getDisplayName" :get-department-label="getDepartmentLabel"
        :get-designation-label="getDesignationLabel" :role-badge="roleBadge" :build-row-actions="buildRowActions"
        :format-date-time-display="formatDateTimeDisplay" :sort-indicator="sortIndicator" @sort="toggleSort" />

      <div v-else class="px-5 pb-5">
        <AppTable :columns="userTableColumns" :items="pagedUsers" :loading="loading"
          :loading-message="text('userManagement.shared.loading')" :empty-message="text('userManagement.page.empty')">
          <template #cell-number="{ index }">
            <span class="app-table-muted">{{ (page - 1) * pageSize + index + 1 }}</span>
          </template>

          <template #cell-name="{ item: u }">
            <p class="app-copy-strong whitespace-nowrap">
              {{ getDisplayName(u) }}
            </p>
          </template>

          <template #cell-email="{ item: u }">
            <p class="whitespace-nowrap">{{ u.email || '-' }}</p>
          </template>

          <template #cell-username="{ item: u }">
            <p class="whitespace-nowrap">{{ u.username ? `@${u.username}` : '-' }}</p>
          </template>

          <template #cell-phone="{ item: u }">
            <p class="whitespace-nowrap">{{ u.phone || '-' }}</p>
          </template>

          <template #cell-department="{ item: u }">
            <p>{{ getDepartmentLabel(u) }}</p>
          </template>

          <template #cell-designation="{ item: u }">
            <p>{{ getDesignationLabel(u) }}</p>
          </template>

          <template #cell-mainPosition="{ item: u }">
            <p>{{ u.main_position || '-' }}</p>
          </template>

          <template #cell-status="{ item: u }">
            <span class="app-status-chip"
              :class="u.is_active === false ? 'app-status-chip-danger' : 'app-status-chip-success'">
              {{ u.is_active === false ? text('userManagement.shared.inactive') : text('userManagement.shared.active')
              }}
            </span>
          </template>

          <template #cell-role="{ item: u }">
            <div class="flex flex-col items-start gap-2">
              <span class="app-status-chip" :class="roleBadge(u.role)">
                {{ u.role || text('userManagement.shared.noRole') }}
              </span>
              <div v-if="!isStaffUser && u.account_source !== 'candidate_service'" class="flex items-center gap-1">
                <div class="min-w-[150px]">
                  <SearchableSelect :model-value="roleChanges[u.id] ?? ''" :options="roleAssignmentOptions"
                    :placeholder="text('userManagement.page.changeRolePlaceholder')" show-empty-option
                    :empty-label="text('userManagement.page.changeRolePlaceholder')" size="compact"
                    @update:model-value="setRoleChange(u.id, $event)" />
                </div>
                <button v-if="roleChanges[u.id]" type="button"
                  class="app-button app-button-primary min-h-0 rounded px-2 py-0.5 text-xs disabled:opacity-60"
                  :disabled="saving" @click="handleRoleChange(u.id)">
                  {{ text('userManagement.shared.ok') }}
                </button>
              </div>
            </div>
          </template>

          <template #cell-registeredDate="{ item: u }">
            <span class="whitespace-nowrap">{{ formatDateTimeDisplay(u.created_at) }}</span>
          </template>

          <template #cell-actions="{ item: u }">
            <RowActionsMenu :actions="buildRowActions(u)" />
          </template>

          <template v-if="!loading && sortedUsers.length > 0" #pagination>
            <TablePagination v-model:page="page" :page-size="pageSize" :total-items="sortedUsers.length" />
          </template>
        </AppTable>
      </div>
    </section>
  </div>

  <AppLoadingOverlay
    v-if="pdfActionLoading"
    :message="text('common.preparingPdf')"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from '#imports'

import { useLocale } from '@/composables/useLocale'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import CandidateEmployeeTable from '@/features/admin/components/CandidateEmployeeTable.vue'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import AppSearchInput from '@/presentation/components/forms/AppSearchInput.vue'
import SearchableSelect from '@/presentation/components/forms/SearchableSelect.vue'
import RowActionsMenu, { type RowAction } from '@/presentation/components/menus/RowActionsMenu.vue'
import AppTable, { type AppTableColumn } from '@/presentation/components/tables/AppTable.vue'
import TablePagination from '@/presentation/components/tables/TablePagination.vue'
import type { UserRole } from '@/domain/entities/User'
import type { ManagedUser } from '@/domain/entities/ManagedUser'
import {
  getCandidateAccessExpiryTime,
  getCandidateAccessRemainingDays,
} from '@/domain/utils/candidateAccess'
import {
  createUserManagementPageFilterState,
  type UserManagementRoleChangesState,
} from '@/features/admin/UserManagementPage.state'
import type { UserManagementPageSelectOption } from '@/features/admin/types/UserManagementPage.type'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import { useAppConfirm } from '@/presentation/components/feedback/useAppConfirm'
import { formatDateTimeDisplay } from '@/presentation/utils/dateFormat'
import AppLoadingOverlay from '@/presentation/components/feedback/AppLoadingOverlay.vue'
import { candidateStatusLabel as resolveCandidateStatusLabel } from '@/features/candidateForms/candidateFormStatus'
import { exportCandidateFormPdf } from '@/presentation/utils/candidateFormPdfTemplate'
import { closePdfPreviewWindow, openPdfPreviewWindow } from '@/presentation/utils/pdfPreviewWindow'
import { compareNullableValues, parseSortDate, type TableSortDirection } from '@/presentation/utils/tableSort'
import { useAuthViewModel } from '@/viewmodels/useAuthViewModel'
import { useCandidateFormViewModel } from '@/viewmodels/useCandidateFormViewModel'
import { useUserManagementViewModel } from '@/viewmodels/useUserManagementViewModel'

type UserListScope = 'users' | 'candidate' | 'employee' | 'candidateEmployee' | 'all'
type CandidateEmployeeSortKey =
  | 'name'
  | 'email'
  | 'phone'
  | 'department'
  | 'designation'
  | 'main_position'
  | 'candidate_form_completion_status'
  | 'status'
  | 'role'
  | 'created_at'

const props = withDefaults(defineProps<{
  scope?: UserListScope
}>(), {
  scope: 'all',
})

const router = useRouter()
const { users, roles, loading, saving, error, refreshUsers, deleteUser, updateUserRole, switchToEmployee, setUserActiveStatus } =
  useUserManagementViewModel({ autoLoadHistory: false, scope: props.scope })
const { getById: getCandidateFormById } = useCandidateFormViewModel({ autoLoad: false })
const { hasAnyPermission, hasPermission, userRole, user } = useAuthViewModel()
const appToast = useAppToast()
const appConfirm = useAppConfirm()
const { text } = useLocale()

const initialFilterState = createUserManagementPageFilterState()
const roleChanges = ref<UserManagementRoleChangesState>({})
const searchQuery = ref(initialFilterState.searchQuery)
const roleFilter = ref(initialFilterState.roleFilter)
const accountStatusFilter = ref('')
const formStatusFilter = ref('')
const sortKey = ref<CandidateEmployeeSortKey | ''>('')
const sortDirection = ref<TableSortDirection>('asc')
const pageSize = 10
const page = ref(initialFilterState.page)
const pdfActionLoading = ref(false)
const isStaffUser = computed(() => normalize(userRole.value).startsWith('staff'))
const effectiveScope = computed<UserListScope>(() =>
  isStaffUser.value && props.scope === 'users' ? 'candidate' : props.scope,
)
const currentUserId = computed(() => String(user.value?.id ?? ''))
const candidateAccessModalUser = ref<ManagedUser | null>(null)
const candidateAccessModalInfo = computed(() =>
  candidateAccessModalUser.value ? getCandidateAccessInfo(candidateAccessModalUser.value) : null,
)
const showRoleFilter = computed(() =>
  effectiveScope.value === 'users'
  || effectiveScope.value === 'all',
)
const canOpenCandidateForm = computed(() =>
  hasAnyPermission(['candidate_form:read', 'employee_form:read']),
)
const canExportCandidateFormPdf = computed(() =>
  hasAnyPermission(['candidate_form:export_pdf', 'employee_form:export_pdf']),
)
const hasActiveFilters = computed(() =>
  Boolean(
    searchQuery.value.trim()
    || roleFilter.value
    || accountStatusFilter.value
    || formStatusFilter.value,
  ),
)
const filterGridClass = computed(() => {
  if (showRoleFilter.value) {
    return 'xl:grid-cols-[minmax(300px,1.5fr)_minmax(220px,0.8fr)]'
  }

  return 'xl:grid-cols-[minmax(320px,1.5fr)]'
})

const pageTitle = computed(() => {
  if (effectiveScope.value === 'candidateEmployee') return text('userManagement.page.title.candidateEmployee')
  if (effectiveScope.value === 'candidate') return text('userManagement.page.title.candidate')
  if (effectiveScope.value === 'employee') return text('userManagement.page.title.employee')
  return text('userManagement.page.title')
})

const pageDescription = computed(() => {
  if (effectiveScope.value === 'candidateEmployee') return text('userManagement.page.description.candidateEmployee')
  if (effectiveScope.value === 'candidate') return text('userManagement.page.description.candidate')
  if (effectiveScope.value === 'employee') return text('userManagement.page.description.employee')
  return isStaffUser.value
    ? text('userManagement.page.description.staff')
    : text('userManagement.page.description.admin')
})

const addButtonLabel = computed(() => {
  if (effectiveScope.value === 'candidateEmployee') return text('userManagement.page.addCandidate')
  if (effectiveScope.value === 'candidate') return text('userManagement.page.addCandidate')
  if (effectiveScope.value === 'employee') return text('userManagement.page.addEmployee')
  return isStaffUser.value ? text('userManagement.page.addCandidate') : text('userManagement.page.addUser')
})

const listTitle = computed(() => {
  if (effectiveScope.value === 'candidateEmployee') return text('userManagement.page.listTitle.candidateEmployee')
  if (effectiveScope.value === 'candidate') return text('userManagement.page.listTitle.candidate')
  if (effectiveScope.value === 'employee') return text('userManagement.page.listTitle.employee')
  return text('userManagement.page.listTitle')
})

const listDescription = computed(() => {
  if (effectiveScope.value === 'candidateEmployee') {
    return text('userManagement.page.listDescription.candidateEmployee')
  }

  return ''
})

const searchPlaceholder = computed(() => {
  if (effectiveScope.value === 'candidateEmployee') return text('userManagement.page.searchPlaceholder.candidateEmployee')
  if (effectiveScope.value === 'candidate') return text('userManagement.page.searchPlaceholder.candidate')
  if (effectiveScope.value === 'employee') return text('userManagement.page.searchPlaceholder.employee')
  return text('userManagement.page.searchPlaceholder')
})

const userTableColumns = computed<AppTableColumn[]>(() => {
  const columns: AppTableColumn[] = [
    { key: 'number', label: text('userManagement.page.table.number'), kind: 'number' },
    { key: 'name', label: text('userManagement.page.table.name'), kind: 'name', minWidth: 'min-w-[200px]' },
    { key: 'email', label: text('userManagement.page.table.email'), kind: 'email' },
    { key: 'username', label: text('userManagement.page.table.username'), minWidth: 'min-w-[160px]' },
    { key: 'phone', label: text('userManagement.page.table.phone'), kind: 'phone', minWidth: 'min-w-[140px]' },
    { key: 'department', label: text('userManagement.page.table.department'), kind: 'department', minWidth: 'min-w-[180px]' },
    { key: 'designation', label: text('userManagement.page.table.designation'), minWidth: 'min-w-[180px]' },
    { key: 'mainPosition', label: text('userManagement.page.table.mainPosition'), kind: 'position', minWidth: 'min-w-[180px]' },
    { key: 'status', label: text('userManagement.page.table.status'), kind: 'status', minWidth: 'min-w-[140px]' },
    { key: 'role', label: text('userManagement.page.table.role'), kind: 'role', minWidth: 'min-w-[190px]' },
    { key: 'registeredDate', label: text('userManagement.page.table.registeredDate'), kind: 'date', minWidth: 'min-w-[170px]' },
    { key: 'actions', label: text('userManagement.page.table.actions'), kind: 'actions', align: 'right' },
  ]

  if (effectiveScope.value === 'candidateEmployee') {
    return columns.filter((column) => column.key !== 'username')
  }

  return columns
})

function normalize(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
}

function getDisplayName(user: ManagedUser) {
  if (user.full_name?.trim()) {
    return user.full_name.trim()
  }

  const fullName = [user.first_name, user.middle_name, user.last_name]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(' ')

  return fullName || '-'
}

function getDepartmentLabel(user: ManagedUser) {
  return user.department?.trim() || user.department_id || '-'
}

function getDesignationLabel(user: ManagedUser) {
  return user.designation?.trim() || user.master_designation_id || '-'
}

const roleOptions = computed(() => {
  const set = new Set<string>()
  for (const u of scopedUsers.value) {
    set.add(u.role || text('userManagement.shared.noRole'))
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

const roleFilterSelectOptions = computed<UserManagementPageSelectOption[]>(() =>
  roleOptions.value.map((opt) => ({ value: opt, label: opt })),
)
const roleAssignmentOptions = computed<UserManagementPageSelectOption[]>(() =>
  roles.value.map((role) => ({ value: role.id, label: role.name })),
)
const formStatusFilterSelectOptions = computed<UserManagementPageSelectOption[]>(() => [
  { value: 'in_progress', label: resolveCandidateStatusLabel(text, 'in_progress') },
  { value: 'completed', label: resolveCandidateStatusLabel(text, 'completed') },
])
const accountStatusFilterSelectOptions = computed<UserManagementPageSelectOption[]>(() => [
  { value: 'active', label: text('userManagement.shared.active') },
  { value: 'inactive', label: text('userManagement.shared.inactive') },
])

function matchesScope(user: ManagedUser) {
  const role = normalize(user.role)

  if (effectiveScope.value === 'all') return true
  if (effectiveScope.value === 'candidate') return role === 'candidate'
  if (effectiveScope.value === 'employee') return role === 'employee'
  if (effectiveScope.value === 'candidateEmployee') return role === 'candidate' || role === 'employee'

  return role !== 'candidate' && role !== 'employee'
}

const scopedUsers = computed(() => users.value.filter(matchesScope))

const filteredUsers = computed(() => {
  const q = normalize(searchQuery.value)
  return scopedUsers.value.filter((u) => {
    if (effectiveScope.value !== 'candidateEmployee' && u.is_active === false) {
      return false
    }

    const roleLabel = u.role || text('userManagement.shared.noRole')
    if (roleFilter.value && roleLabel !== roleFilter.value) return false
    if (
      effectiveScope.value === 'candidateEmployee' &&
      accountStatusFilter.value &&
      (u.is_active === false ? 'inactive' : 'active') !== accountStatusFilter.value
    ) {
      return false
    }
    if (
      effectiveScope.value === 'candidateEmployee' &&
      formStatusFilter.value &&
      String(u.candidate_form_completion_status ?? '').trim() !== formStatusFilter.value
    ) {
      return false
    }
    if (!q) return true

    const haystack = [
      getDisplayName(u),
      u.email,
      u.username ? `@${u.username}` : '',
      u.phone ?? '',
      getDepartmentLabel(u),
      getDesignationLabel(u),
      u.main_position ?? '',
      u.employee_request_form_id ?? '',
      u.candidate_form_completion_status ?? '',
      accountSourceLabel(u.account_source),
      u.is_active ? text('userManagement.shared.active') : text('userManagement.shared.inactive'),
      roleLabel,
    ]
      .map(normalize)
      .join(' ')

    return haystack.includes(q)
  })
})

function compareCandidateEmployeeUsers(
  left: ManagedUser,
  right: ManagedUser,
  activeSortKey: CandidateEmployeeSortKey,
  direction: TableSortDirection,
) {
  switch (activeSortKey) {
    case 'name':
      return compareNullableValues(getDisplayName(left), getDisplayName(right), direction)
    case 'department':
      return compareNullableValues(getDepartmentLabel(left), getDepartmentLabel(right), direction)
    case 'designation':
      return compareNullableValues(getDesignationLabel(left), getDesignationLabel(right), direction)
    case 'candidate_form_completion_status':
      return compareNullableValues(
        resolveCandidateStatusLabel(text, left.candidate_form_completion_status),
        resolveCandidateStatusLabel(text, right.candidate_form_completion_status),
        direction,
      )
    case 'status':
      return compareNullableValues(
        left.is_active === false ? text('userManagement.shared.inactive') : text('userManagement.shared.active'),
        right.is_active === false ? text('userManagement.shared.inactive') : text('userManagement.shared.active'),
        direction,
      )
    case 'role':
      return compareNullableValues(
        left.role || text('userManagement.shared.noRole'),
        right.role || text('userManagement.shared.noRole'),
        direction,
      )
    case 'created_at':
      return compareNullableValues(parseSortDate(left.created_at), parseSortDate(right.created_at), direction)
    default:
      return compareNullableValues(left[activeSortKey], right[activeSortKey], direction)
  }
}

const sortedUsers = computed(() => {
  const activeSortKey = sortKey.value
  if (effectiveScope.value !== 'candidateEmployee' || !activeSortKey) {
    return filteredUsers.value
  }

  return [...filteredUsers.value].sort((left, right) =>
    compareCandidateEmployeeUsers(left, right, activeSortKey, sortDirection.value))
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedUsers.value.length / pageSize)))
const pagedUsers = computed(() => {
  const safePage = Math.min(Math.max(page.value, 1), totalPages.value)
  const start = (safePage - 1) * pageSize
  return sortedUsers.value.slice(start, start + pageSize)
})

function resetPage() {
  page.value = 1
}

function resetFilters() {
  searchQuery.value = ''
  roleFilter.value = ''
  accountStatusFilter.value = ''
  formStatusFilter.value = ''
  resetPage()
}

function toggleSort(key: string) {
  const nextKey = key as CandidateEmployeeSortKey
  if (sortKey.value === nextKey) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }

  sortKey.value = nextKey
  sortDirection.value = nextKey === 'created_at' ? 'desc' : 'asc'
}

function sortIndicator(key: string) {
  if (sortKey.value !== key) return '↑↓'
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

watch([searchQuery, roleFilter, accountStatusFilter, formStatusFilter], resetPage)
watch(
  () => filteredUsers.value.length,
  () => {
    if (page.value > totalPages.value) page.value = totalPages.value
  },
)

function goToCreate() {
  if (effectiveScope.value === 'candidate' || effectiveScope.value === 'candidateEmployee') {
    router.push({
      path: '/user-management/create',
      query: {
        type: 'candidate',
        scope: effectiveScope.value,
      },
    })
    return
  }

  if (effectiveScope.value === 'employee') {
    router.push({
      path: '/user-management/create',
      query: {
        role: 'employee',
        scope: effectiveScope.value,
      },
    })
    return
  }

  router.push('/user-management/create')
}

function goToEdit(userId: string) {
  if (effectiveScope.value !== 'all' && effectiveScope.value !== 'users') {
    router.push({
      path: `/user-management/${userId}/edit`,
      query: {
        scope: effectiveScope.value,
      },
    })
    return
  }

  router.push(`/user-management/${userId}/edit`)
}

function goToCandidateFormDetail(candidateFormId: string) {
  router.push(`/candidate-forms/${candidateFormId}`)
}

function roleBadge(role: UserRole | null) {
  const map: Record<string, string> = {
    admin: 'app-status-chip-danger',
    manager: 'app-tone-violet-surface app-tone-violet-text',
    staff: 'app-status-chip-accent',
    candidate: 'app-status-chip-success',
    employee: 'app-status-chip-warning',
  }
  return role ? map[role] || 'app-status-chip-neutral' : 'app-status-chip-neutral'
}

function normalizeAccountSource(source: ManagedUser['account_source']) {
  return source === 'candidate_service' ? 'candidate_service' : 'internal'
}

function accountSourceLabel(source: ManagedUser['account_source']) {
  return normalizeAccountSource(source) === 'candidate_service'
    ? text('userManagement.page.filters.source.candidateService')
    : text('userManagement.page.filters.source.internal')
}


function buildRowActions(user: ManagedUser): RowAction[] {
  const actions: RowAction[] = []

  if (effectiveScope.value === 'candidateEmployee') {
    actions.push({
      label: text('common.actions.detail'),
      disabled: !canOpenCandidateForm.value || !user.candidate_form_id,
      onClick: () => {
        if (!user.candidate_form_id) return
        goToCandidateFormDetail(user.candidate_form_id)
      },
    })
    actions.push({
      label: text('common.actions.exportPdf'),
      disabled: !canExportCandidateFormPdf.value || !user.candidate_form_id,
      onClick: () => handleExportCandidateForm(user),
    })
  }

  actions.push(
    {
      label: text('userManagement.page.actions.edit'),
      disabled: saving.value || !hasPermission('user:update'),
      onClick: () => goToEdit(user.id),
    },
  )

  if (canSwitchToEmployee(user)) {
    actions.push({
      label: text('userManagement.page.actions.switchToEmployee'),
      disabled: saving.value || !hasPermission('user:switch_to_employee'),
      onClick: () => handleSwitchToEmployee(user),
    })
  }

  if (normalize(user.role) === 'candidate') {
    actions.push({
      label: text('userManagement.page.actions.infoDeactivated'),
      disabled: !getCandidateAccessInfo(user),
      onClick: () => openCandidateAccessModal(user),
    })
  }

  actions.push(
    {
      label:
        user.is_active === false
          ? text('userManagement.page.actions.activate')
          : text('userManagement.page.actions.deactivate'),
      disabled:
        saving.value
        || !hasPermission('user:update')
        || user.id === currentUserId.value,
      onClick: () => handleToggleActiveStatus(user),
    },
    {
      label:
        user.account_source === 'candidate_service'
          ? text('userManagement.page.actions.revoke')
          : text('userManagement.page.actions.delete'),
      tone: 'danger',
      disabled: saving.value,
      onClick: () => handleDelete(user),
    },
  )

  return actions
}

async function handleExportCandidateForm(user: ManagedUser) {
  if (!canExportCandidateFormPdf.value) {
    appToast.error(text('candidateForms.list.toasts.exportPermissionDenied'))
    return
  }

  if (!user.candidate_form_id) {
    appToast.error(text('candidateForms.list.errors.exportFailed'))
    return
  }

  let previewWindow: Window | null = null
  pdfActionLoading.value = true

  try {
    previewWindow = openPdfPreviewWindow('The PDF preview window could not be opened.')
    const fullCandidate = await getCandidateFormById(user.candidate_form_id)
    if (!fullCandidate) {
      throw new Error(text('candidateForms.list.errors.exportFailed'))
    }

    await exportCandidateFormPdf(fullCandidate, { previewWindow })
    appToast.success(text('candidateForms.list.toasts.exported'))
  } catch (err) {
    closePdfPreviewWindow(previewWindow)
    const message = err instanceof Error ? err.message : text('candidateForms.list.errors.exportFailed')
    appToast.error(message)
  } finally {
    pdfActionLoading.value = false
  }
}

function canSwitchToEmployee(user: ManagedUser) {
  return (
    user.account_source === 'candidate_service' &&
    normalize(user.role) === 'candidate'
  )
}

function getCandidateAccessInfo(user: ManagedUser) {
  if (normalize(user.role) !== 'candidate') {
    return null
  }

  const expiresAt = getCandidateAccessExpiryTime(user.activated_at, user.created_at)
  const remainingDays = getCandidateAccessRemainingDays(user.activated_at, user.created_at)
  const registeredAtLabel = formatDateTimeDisplay(user.created_at)
  const activatedAtLabel = formatDateTimeDisplay(user.activated_at ?? user.created_at)

  if (expiresAt === null || remainingDays === null) {
    return null
  }

  const expiryLabel = formatDateTimeDisplay(new Date(expiresAt).toISOString())

  if (remainingDays <= 0) {
    return {
      registeredAtLabel,
      activatedAtLabel,
      expiryAtLabel: expiryLabel,
      remainingDaysLabel: text('userManagement.page.access.day.multiple', { count: 0 }),
      accentClass: 'app-state-card-danger app-tone-danger-text',
      summary: text('userManagement.page.access.summary.expired'),
      detail: text('userManagement.page.access.detail.expired', { date: expiryLabel }),
    }
  }

  return {
    registeredAtLabel,
    activatedAtLabel,
    expiryAtLabel: expiryLabel,
    remainingDaysLabel:
      remainingDays === 1
        ? text('userManagement.page.access.day.single', { count: remainingDays })
        : text('userManagement.page.access.day.multiple', { count: remainingDays }),
    accentClass: 'app-state-card-warning app-tone-warning-text',
    summary:
      remainingDays === 1
        ? text('userManagement.page.access.summary.scheduled.single', { count: remainingDays })
        : text('userManagement.page.access.summary.scheduled.multiple', { count: remainingDays }),
    detail: text('userManagement.page.access.detail.scheduled', { date: expiryLabel }),
  }
}

function openCandidateAccessModal(user: ManagedUser) {
  candidateAccessModalUser.value = user
}

function closeCandidateAccessModal() {
  candidateAccessModalUser.value = null
}


async function handleDelete(user: ManagedUser) {
  const isCandidateServiceAccount = user.account_source === 'candidate_service'
  const prompt = isCandidateServiceAccount
    ? text('userManagement.page.confirm.revoke', { email: user.email || '-' })
    : text('userManagement.page.confirm.delete', { email: user.email || '-' })

  const confirmed = await appConfirm.confirm({
    title: text('common.actions.confirm'),
    message: prompt,
    confirmLabel: isCandidateServiceAccount ? text('common.actions.confirm') : text('common.actions.delete'),
    cancelLabel: text('common.actions.cancel'),
    tone: isCandidateServiceAccount ? 'primary' : 'danger',
  })
  if (!confirmed) return

  try {
    await deleteUser(user.id)
    if (isCandidateServiceAccount) {
      appToast.success(text('userManagement.page.toast.revokeSuccess'))
      return
    }

    appToast.success(text('userManagement.page.toast.deleteSuccess'))
  } catch (err) {
    const message = err instanceof Error ? err.message : text('userManagement.page.errors.deleteUser')
    appToast.error(message)
  }
}

async function handleRoleChange(userId: string) {
  const newRoleId = roleChanges.value[userId]
  if (!newRoleId) return
  try {
    await updateUserRole(userId, newRoleId)
    appToast.success(text('userManagement.page.toast.roleUpdated'))
    roleChanges.value[userId] = ''
  } catch (err) {
    const message = err instanceof Error ? err.message : text('userManagement.page.errors.updateRole')
    appToast.error(message)
  }
}

async function handleSwitchToEmployee(user: ManagedUser) {
  const confirmed = await appConfirm.confirm({
    title: text('common.actions.confirm'),
    message: text('userManagement.page.confirm.switchToEmployee', { email: user.email || '-' }),
    confirmLabel: text('common.actions.yes'),
    cancelLabel: text('common.actions.cancel'),
  })
  if (!confirmed) {
    return
  }

  try {
    await switchToEmployee(user.id)
    appToast.success(text('userManagement.page.toast.switchSuccess'))
  } catch (err) {
    const message = err instanceof Error ? err.message : text('userManagement.page.errors.switchToEmployee')
    appToast.error(message)
  }
}

function setRoleChange(userId: string, value: string | number | null) {
  roleChanges.value[userId] = typeof value === 'string' ? value : ''
}

async function handleToggleActiveStatus(user: ManagedUser) {
  const shouldActivate = user.is_active === false
  const prompt = shouldActivate
    ? text('userManagement.page.confirm.activate', { email: user.email || '-' })
    : text('userManagement.page.confirm.deactivate', { email: user.email || '-' })

  const confirmed = await appConfirm.confirm({
    title: text('common.actions.confirm'),
    message: prompt,
    confirmLabel: text('common.actions.yes'),
    cancelLabel: text('common.actions.cancel'),
    tone: shouldActivate ? 'primary' : 'danger',
  })
  if (!confirmed) {
    return
  }

  try {
    await setUserActiveStatus(user.id, shouldActivate)
    appToast.success(
      shouldActivate
        ? text('userManagement.page.toast.activated')
        : text('userManagement.page.toast.deactivated'),
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : text('userManagement.page.errors.updateStatus')
    appToast.error(message)
  }
}
</script>
