<template>
  <div class="flex w-full flex-col gap-4">
    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div class="max-w-3xl">
          <p class="app-dashboard-eyebrow">
          {{ text('recruitment.contractForms.list.eyebrow') }}
        </p>
          <h1 class="app-dashboard-title mt-3">
          {{ text('recruitment.contractForms.list.title') }}
        </h1>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row xl:flex-none">
          <AppActionButton
            class="inline-flex min-h-11 min-w-[120px] items-center justify-center"
            variant="secondary"
            :loading="loading"
            :label="text('common.actions.refresh')"
            :loading-label="text('common.loading')"
            @click="loadForms"
          />
          <AppActionButton
            v-if="canCreate"
            class="inline-flex min-h-11 min-w-[120px] items-center justify-center"
            variant="primary"
            :label="text('recruitment.contractForms.list.actions.add')"
            @click="router.push('/recruitment/new-employee-contract-forms/create')"
          />
        </div>
      </div>
    </section>

    <AppAlert :message="error" />

    <section class="app-dashboard-panel">
      <div class="p-5">
        <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-8">
          <div class="min-w-0 flex-1 max-w-2xl">
            <h2 class="app-dashboard-title !mt-0 !text-[1.15rem]">
              {{ text('recruitment.contractForms.list.tableTitle') }}
            </h2>
          </div>

          <label class="block xl:w-[420px] xl:flex-none">
            <span class="app-fieldset-label mb-1.5 block">
              {{ text('common.labels.search') }}
            </span>
            <AppSearchInput
              v-model="searchQuery"
              :placeholder="text('recruitment.contractForms.list.searchPlaceholder')"
              class="w-full"
            />
          </label>
        </div>
      </div>

      <EmployeeContractFormListTable
        v-model:page="page"
        :items="pagedItems"
        :loading="loading"
        :page-size="pageSize"
        :total-items="sortedItems.length"
        :department-label="text('common.labels.department')"
        :main-position-label="text('common.labels.mainPosition')"
        :position-label="text('recruitment.contractForms.fields.position')"
        :employment-status-label="text('common.labels.employmentStatus')"
        :candidate-name-label="text('recruitment.contractForms.fields.candidateName')"
        :actions-label="text('common.labels.actions')"
        :empty-message="text('common.noMatchingData')"
        :build-row-actions="buildRowActions"
        :sort-indicator="sortIndicator"
        @sort="toggleSort"
      />
    </section>
  </div>

</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from '#imports'

import {
  deleteEmployeeContractForm,
  getEmployeeContractForms,
} from '@/features/recruitment/employeeContractFormApi'
import EmployeeContractFormListTable from '@/features/recruitment/components/EmployeeContractFormListTable.vue'
import type { EmployeeContractFormRecord } from '@/features/recruitment/types/EmployeeContractForm.type'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import { useAppConfirm } from '@/presentation/components/feedback/useAppConfirm'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import AppSearchInput from '@/presentation/components/forms/AppSearchInput.vue'
import { type RowAction } from '@/presentation/components/menus/RowActionsMenu.vue'
import { compareNullableValues, type TableSortDirection } from '@/presentation/utils/tableSort'
import { useLocale } from '@/composables/useLocale'
import { useAuthViewModel } from '@/viewmodels/useAuthViewModel'

const router = useRouter()
const { text } = useLocale()
const appToast = useAppToast()
const appConfirm = useAppConfirm()
const { hasPermission } = useAuthViewModel()

const items = ref<EmployeeContractFormRecord[]>([])
const loading = ref(false)
const deletingId = ref('')
const error = ref('')
const searchQuery = ref('')
const sortKey = ref<EmployeeContractFormSortKey | ''>('')
const sortDirection = ref<TableSortDirection>('asc')
const page = ref(1)
const pageSize = 10

const canCreate = computed(() => hasPermission('employee_contract_form:create'))
const canUpdate = computed(() => hasPermission('employee_contract_form:update'))
const canDelete = computed(() => hasPermission('employee_contract_form:delete'))

type EmployeeContractFormSortKey =
  | 'department'
  | 'main_position'
  | 'position'
  | 'employment_status'
  | 'candidate_name'

function normalize(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
}

const filteredItems = computed(() => {
  const query = normalize(searchQuery.value)
  if (!query) {
    return items.value
  }

  return items.value.filter((item) =>
    [
      item.candidate_name,
      item.candidate_email,
      item.contract_number,
      item.employee_code,
      item.employee_request_form?.department,
      item.employee_request_form?.main_position,
      item.employee_request_form?.position,
      item.employee_request_form?.employment_status,
    ]
      .map(normalize)
      .join(' ')
      .includes(query),
  )
})

function compareItems(
  left: EmployeeContractFormRecord,
  right: EmployeeContractFormRecord,
  activeSortKey: EmployeeContractFormSortKey,
  direction: TableSortDirection,
) {
  switch (activeSortKey) {
    case 'candidate_name':
      return compareNullableValues(
        left.candidate_name || left.candidate_email,
        right.candidate_name || right.candidate_email,
        direction,
      )
    default:
      return compareNullableValues(
        left.employee_request_form?.[activeSortKey],
        right.employee_request_form?.[activeSortKey],
        direction,
      )
  }
}

const sortedItems = computed(() => {
  const activeSortKey = sortKey.value
  if (!activeSortKey) return filteredItems.value

  return [...filteredItems.value].sort((left, right) =>
    compareItems(left, right, activeSortKey, sortDirection.value))
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedItems.value.length / pageSize)))
const pagedItems = computed(() => {
  const safePage = Math.min(Math.max(page.value, 1), totalPages.value)
  const start = (safePage - 1) * pageSize
  return sortedItems.value.slice(start, start + pageSize)
})

watch(searchQuery, () => {
  page.value = 1
})

watch(
  () => filteredItems.value.length,
  () => {
    if (page.value > totalPages.value) {
      page.value = totalPages.value
    }
  },
)

function toggleSort(key: string) {
  const nextKey = key as EmployeeContractFormSortKey
  if (sortKey.value === nextKey) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }

  sortKey.value = nextKey
  sortDirection.value = 'asc'
}

function sortIndicator(key: string) {
  if (sortKey.value !== key) return '↑↓'
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

function buildRowActions(item: EmployeeContractFormRecord): RowAction[] {
  const actions: RowAction[] = []

  if (canUpdate.value) {
    actions.push({
      label: text('common.actions.edit'),
      onClick: () => router.push(`/recruitment/new-employee-contract-forms/${item.id}/edit`),
    })
  }

  if (canDelete.value) {
    actions.push({
      label: text('common.actions.delete'),
      onClick: () => handleDelete(item),
      disabled: deletingId.value === item.id,
      tone: 'danger',
    })
  }

  return actions
}

async function loadForms() {
  loading.value = true
  error.value = ''

  try {
    items.value = await getEmployeeContractForms()
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : text('recruitment.contractForms.list.errors.loadFailed')
  } finally {
    loading.value = false
  }
}

async function handleDelete(item: EmployeeContractFormRecord) {
  const target = item.candidate_name || item.candidate_email || item.contract_number || item.id
  const confirmed = await appConfirm.confirm({
    title: text('common.actions.confirm'),
    message: text('recruitment.contractForms.list.confirm.delete', { target }),
    confirmLabel: text('common.actions.delete'),
    cancelLabel: text('common.actions.cancel'),
    tone: 'danger',
  })
  if (!confirmed) {
    return
  }

  deletingId.value = item.id

  try {
    await deleteEmployeeContractForm(item.id)
    items.value = items.value.filter((entry) => entry.id !== item.id)
    appToast.success(text('recruitment.contractForms.list.toasts.deleted'))
  } catch (err) {
    appToast.error(
      err instanceof Error
        ? err.message
        : text('recruitment.contractForms.list.errors.deleteFailed'),
    )
  } finally {
    deletingId.value = ''
  }
}

onMounted(() => {
  void loadForms()
})
</script>
