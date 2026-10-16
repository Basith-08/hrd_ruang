<template>
  <div class="flex w-full flex-col gap-4">
    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div class="max-w-3xl">
          <p class="app-dashboard-eyebrow">
          {{ text('candidateForms.list.eyebrow') }}
        </p>
          <h1 class="app-dashboard-title mt-3">
          {{ text('candidateForms.list.title') }}
        </h1>
          <p class="app-dashboard-copy mt-3 max-w-2xl">
          {{ text('candidateForms.list.description') }}
        </p>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row xl:flex-none">
          <AppActionButton
            class="inline-flex min-h-11 min-w-[120px] items-center justify-center"
            variant="secondary"
            :loading="candidateLoading"
            :label="text('common.actions.refresh')"
            :loading-label="text('common.loading')"
            @click="refreshCandidates"
          />
        </div>
      </div>
    </section>

    <AppAlert :message="candidateError" />

    <section class="app-dashboard-panel">
      <div class="p-5">
        <div class="flex flex-col gap-5">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div class="max-w-2xl">
              <p class="app-dashboard-eyebrow">
                {{ text('candidateForms.list.filters.title') }}
              </p>
              <h2 class="app-dashboard-title mt-2 !text-[1.15rem]">
                {{ text('candidateForms.list.filters.subtitle') }}
              </h2>
            </div>

            <AppActionButton
              class="h-11 px-4 py-0 xl:flex-none"
              variant="ghost"
              :label="text('candidateForms.list.filters.reset')"
              :disabled="!hasActiveFilters"
              @click="resetFilters"
            />
          </div>

          <div class="grid gap-3 xl:grid-cols-[minmax(280px,1.4fr)_repeat(2,minmax(180px,1fr))]">
            <label class="block">
              <span class="app-fieldset-label mb-1.5 block">
                {{ text('common.labels.search') }}
              </span>
              <AppSearchInput
                v-model="searchQuery"
                :placeholder="text('candidateForms.list.filters.searchPlaceholder')"
                class="w-full"
              />
            </label>
            <label class="block min-w-0">
              <span class="app-fieldset-label mb-1.5 block">
                {{ text('common.labels.formStatus') }}
              </span>
              <SearchableSelect
                v-model="completionStatusFilter"
                :options="completionStatusSelectOptions"
                :placeholder="text('candidateForms.list.filters.formStatusPlaceholder')"
                show-empty-option
                :empty-label="text('common.status.all')"
              />
            </label>
            <label class="block min-w-0">
              <span class="app-fieldset-label mb-1.5 block">
                {{ text('common.labels.employeeRequestForm') }}
              </span>
              <SearchableSelect
                v-model="employeeRequestFormFilter"
                :options="employeeRequestFormSelectOptions"
                :placeholder="text('candidateForms.list.filters.erfPlaceholder')"
                show-empty-option
                :empty-label="text('candidateForms.list.filters.allErf')"
              />
            </label>
          </div>
        </div>
      </div>

      <CandidateFormListTable
        v-model:page="page"
        :items="pagedCandidates"
        :loading="candidateLoading"
        :page-size="pageSize"
        :total-items="sortedCandidates.length"
        :text="text"
        :role-label="candidateRoleLabel"
        :role-badge="candidateRoleBadge"
        :status-label="candidateStatusLabel"
        :status-badge="candidateStatusBadge"
        :get-row-actions="getRowActions"
        :sort-indicator="sortIndicator"
        @sort="toggleSort"
      />
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

import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import AppSearchInput from '@/presentation/components/forms/AppSearchInput.vue'
import CandidateFormListTable from '@/features/candidateForms/components/CandidateFormListTable.vue'
import SearchableSelect from '@/presentation/components/forms/SearchableSelect.vue'
import {
  candidateStatusBadge,
  candidateStatusLabel as resolveCandidateStatusLabel,
} from '@/features/candidateForms/candidateFormStatus'
import {
  candidateRoleBadge as resolveCandidateRoleBadge,
  candidateRoleLabel as resolveCandidateRoleLabel,
} from '@/features/candidateForms/candidateFormRole'
import { createCandidateFormListFilterState } from '@/features/candidateForms/CandidateFormList.state'
import type { CandidateFormListSelectOption } from '@/features/candidateForms/types/CandidateFormList.type'
import AppLoadingOverlay from '@/presentation/components/feedback/AppLoadingOverlay.vue'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import { exportCandidateFormPdf } from '@/presentation/utils/candidateFormPdfTemplate'
import { closePdfPreviewWindow, openPdfPreviewWindow } from '@/presentation/utils/pdfPreviewWindow'
import { compareNullableValues, type TableSortDirection } from '@/presentation/utils/tableSort'
import { useLocale } from '@/composables/useLocale'
import { useAuthViewModel } from '@/viewmodels/useAuthViewModel'
import { useCandidateFormViewModel } from '@/viewmodels/useCandidateFormViewModel'

const router = useRouter()
const {
  candidates,
  loading: candidateLoading,
  error: candidateError,
  refresh: refreshCandidates,
  getById: getCandidateFormById,
} = useCandidateFormViewModel()

const appToast = useAppToast()
const { text } = useLocale()
const { hasAnyPermission } = useAuthViewModel()

const initialFilterState = createCandidateFormListFilterState()
const searchQuery = ref(initialFilterState.searchQuery)
const completionStatusFilter = ref(initialFilterState.completionStatusFilter)
const employeeRequestFormFilter = ref(initialFilterState.employeeRequestFormFilter)
const sortKey = ref<CandidateListSortKey | ''>('')
const sortDirection = ref<TableSortDirection>('asc')
const pageSize = 10
const page = ref(initialFilterState.page)
const pdfActionLoading = ref(false)

type CandidateListSortKey =
  | 'name'
  | 'role'
  | 'personal_email'
  | 'phone_number'
  | 'employee_request_form'
  | 'completion_status'

const canExportCandidateFormPdf = computed(() =>
  hasAnyPermission(['candidate_form:export_pdf', 'employee_form:export_pdf']),
)
const hasActiveFilters = computed(() =>
  Boolean(searchQuery.value.trim() || completionStatusFilter.value || employeeRequestFormFilter.value),
)

function normalize(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
}

const employeeRequestFormOptions = computed(() => {
  const set = new Set<string>()
  for (const a of candidates.value) {
    const label = a.employee_request_form?.main_position
    if (label) set.add(label)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

const employeeRequestFormSelectOptions = computed<CandidateFormListSelectOption[]>(() =>
  employeeRequestFormOptions.value.map((opt) => ({ value: opt, label: opt })),
)

const completionStatusSelectOptions = computed<CandidateFormListSelectOption[]>(() => [
  { value: 'in_progress', label: resolveCandidateStatusLabel(text, 'in_progress') },
  { value: 'completed', label: resolveCandidateStatusLabel(text, 'completed') },
])

const filteredCandidates = computed(() => {
  const q = normalize(searchQuery.value)
  return candidates.value.filter((a) => {
    if (completionStatusFilter.value && a.completion_status !== completionStatusFilter.value) return false
    const jobLabel = a.employee_request_form?.main_position ?? ''
    if (employeeRequestFormFilter.value && jobLabel !== employeeRequestFormFilter.value) return false
    if (!q) return true

    const fullName = a.full_name || [a.first_name, a.middle_name, a.last_name].filter(Boolean).join(' ')
    const haystack = [fullName, a.personal_email, a.phone_number, jobLabel].map(normalize).join(' ')

    return haystack.includes(q)
  })
})

function candidateName(candidate: (typeof candidates.value)[number]) {
  return (
    candidate.full_name
    || [candidate.first_name, candidate.middle_name, candidate.last_name].filter(Boolean).join(' ')
    || '-'
  )
}

function compareCandidates(
  left: (typeof candidates.value)[number],
  right: (typeof candidates.value)[number],
  activeSortKey: CandidateListSortKey,
  direction: TableSortDirection,
) {
  switch (activeSortKey) {
    case 'name':
      return compareNullableValues(candidateName(left), candidateName(right), direction)
    case 'role':
      return compareNullableValues(candidateRoleLabel(left), candidateRoleLabel(right), direction)
    case 'employee_request_form':
      return compareNullableValues(
        left.employee_request_form?.main_position,
        right.employee_request_form?.main_position,
        direction,
      )
    case 'completion_status':
      return compareNullableValues(
        candidateStatusLabel(left.completion_status),
        candidateStatusLabel(right.completion_status),
        direction,
      )
    default:
      return compareNullableValues(left[activeSortKey], right[activeSortKey], direction)
  }
}

const sortedCandidates = computed(() => {
  const activeSortKey = sortKey.value
  if (!activeSortKey) return filteredCandidates.value

  return [...filteredCandidates.value].sort((left, right) =>
    compareCandidates(left, right, activeSortKey, sortDirection.value))
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedCandidates.value.length / pageSize)),
)
const pagedCandidates = computed(() => {
  const safePage = Math.min(Math.max(page.value, 1), totalPages.value)
  const start = (safePage - 1) * pageSize
  return sortedCandidates.value.slice(start, start + pageSize)
})

function resetPage() {
  page.value = 1
}

function resetFilters() {
  searchQuery.value = ''
  completionStatusFilter.value = ''
  employeeRequestFormFilter.value = ''
  resetPage()
}

watch([searchQuery, completionStatusFilter, employeeRequestFormFilter], resetPage)
watch(
  () => filteredCandidates.value.length,
  () => {
    if (page.value > totalPages.value) page.value = totalPages.value
  },
)

function goToDetail(id: string) {
  router.push(`/candidate-forms/${id}`)
}

function candidateStatusLabel(status: string | null | undefined) {
  return resolveCandidateStatusLabel(text, status)
}

function candidateRoleLabel(candidate: (typeof candidates.value)[number]) {
  return resolveCandidateRoleLabel(candidate)
}

function candidateRoleBadge(candidate: (typeof candidates.value)[number]) {
  return resolveCandidateRoleBadge(candidate)
}

function toggleSort(key: string) {
  const nextKey = key as CandidateListSortKey
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

function getRowActions(candidate: (typeof candidates.value)[number]) {
  return [
    { label: text('common.actions.detail'), onClick: () => goToDetail(candidate.id) },
    {
      label: text('common.actions.exportPdf'),
      disabled: !canExportCandidateFormPdf.value,
      onClick: () => handleExportPdf(candidate),
    },
  ]
}

async function handleExportPdf(candidate: (typeof candidates.value)[number]) {
  if (!canExportCandidateFormPdf.value) {
    appToast.error(text('candidateForms.list.toasts.exportPermissionDenied'))
    return
  }

  let previewWindow: Window | null = null
  pdfActionLoading.value = true

  try {
    previewWindow = openPdfPreviewWindow('The PDF preview window could not be opened.')
    const fullCandidate = await getCandidateFormById(candidate.id)
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

</script>
