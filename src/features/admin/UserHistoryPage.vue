<template>
  <div class="flex w-full flex-col gap-4">
    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between xl:gap-8">
        <div class="max-w-3xl">
          <p class="app-dashboard-eyebrow">
            {{ text('userManagement.history.eyebrow') }}
          </p>
          <h1 class="app-dashboard-title mt-3">
            {{ text('userManagement.history.title') }}
          </h1>
          <p class="app-dashboard-copy mt-3 max-w-2xl">
            {{ text('userManagement.history.description') }}
          </p>
        </div>

        <AppActionButton
          class="inline-flex min-h-11 w-full items-center justify-center sm:w-auto xl:min-w-[120px] xl:flex-none"
          :label="text('userManagement.shared.refresh')"
          :loading-label="text('userManagement.shared.loading')"
          :loading="loading"
          :disabled="loading"
          variant="secondary"
          @click="refreshUserHistory"
        />
      </div>
    </section>

    <AppAlert :message="error" />

    <section class="app-dashboard-panel">
      <div class="p-5">
        <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-8">
          <div class="min-w-0 flex-1 max-w-2xl">
            <h2 class="app-dashboard-title !mt-0 !text-[1.15rem]">
              {{ text('userManagement.history.title') }}
            </h2>
            <p class="app-dashboard-copy mt-1">
              {{ text('userManagement.history.listDescription') }}
            </p>
          </div>

          <div class="flex w-full flex-col gap-3 xl:w-auto xl:flex-row xl:items-end xl:justify-end">
            <label class="block xl:w-[420px] xl:flex-none">
              <span class="app-fieldset-label mb-1.5 block">
                {{ text('common.labels.search') }}
              </span>
              <AppSearchInput
                v-model="searchQuery"
                :placeholder="text('userManagement.history.searchPlaceholder')"
                class="w-full"
              />
            </label>
          </div>
        </div>
      </div>

        <UserHistoryTable
          :items="pagedHistory"
          :loading="loading"
          :loading-message="text('userManagement.shared.loading')"
          :empty-message="text('userManagement.history.empty')"
          :no-role-label="text('userManagement.shared.noRole')"
          :active-label="text('userManagement.shared.active')"
          :inactive-label="text('userManagement.shared.inactive')"
          :page="page"
          :page-size="pageSize"
          :total-items="filteredHistory.length"
          :format-history-reference-date="formatHistoryReferenceDate"
          :can-switch-to-employee="canSwitchToEmployee"
          :build-actions="buildActions"
          @update:page="page = $event"
        />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { useLocale } from '@/composables/useLocale'
import type { UserHistoryEntry } from '@/domain/entities/UserHistory'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import AppSearchInput from '@/presentation/components/forms/AppSearchInput.vue'
import { useAppConfirm } from '@/presentation/components/feedback/useAppConfirm'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import { formatDateTimeDisplay } from '@/presentation/utils/dateFormat'
import { useAuthViewModel } from '@/viewmodels/useAuthViewModel'
import { useUserManagementViewModel } from '@/viewmodels/useUserManagementViewModel'
import UserHistoryTable from './components/UserHistoryTable.vue'

const { userHistory, loading, saving, error, refreshUserHistory, setUserActiveStatus, switchToEmployee } = useUserManagementViewModel({
  autoLoadUsers: false,
  autoLoadRoles: false,
})
const { hasPermission } = useAuthViewModel()
const appToast = useAppToast()
const appConfirm = useAppConfirm()
const { text } = useLocale()

const searchQuery = ref('')
const pageSize = 10
const page = ref(1)
function normalize(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
}

const filteredHistory = computed(() => {
  const q = normalize(searchQuery.value)
  return userHistory.value.filter((entry) => {
    if (!q) return true

    const haystack = [
      entry.full_name,
      entry.email,
      entry.username,
      entry.role,
      entry.main_position,
    ]
      .map(normalize)
      .join(' ')

    return haystack.includes(q)
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredHistory.value.length / pageSize)))
const pagedHistory = computed(() => {
  const safePage = Math.min(Math.max(page.value, 1), totalPages.value)
  const start = (safePage - 1) * pageSize
  return filteredHistory.value.slice(start, start + pageSize)
})

watch(searchQuery, () => {
  page.value = 1
})

watch(
  () => filteredHistory.value.length,
  () => {
    if (page.value > totalPages.value) page.value = totalPages.value
  },
)

async function handleActivate(entry: UserHistoryEntry) {
  const confirmed = await appConfirm.confirm({
    title: text('common.actions.confirm'),
    message: text('userManagement.history.confirm.activate', { target: entry.email || entry.full_name || entry.id }),
    confirmLabel: text('common.actions.yes'),
    cancelLabel: text('common.actions.cancel'),
  })
  if (!confirmed) {
    return
  }

  try {
    await setUserActiveStatus(entry.id, true)
    appToast.success(text('userManagement.history.toast.activated'))
  } catch (err) {
    const message = err instanceof Error ? err.message : text('userManagement.history.errors.activate')
    appToast.error(message)
  }
}

function buildActions(entry: UserHistoryEntry) {
  return [
    ...(canSwitchToEmployee(entry)
      ? [
          {
            label: text('userManagement.history.actions.switchToEmployee'),
            disabled: saving.value || !hasPermission('user:switch_to_employee'),
            onClick: () => handleSwitchToEmployee(entry),
          },
        ]
      : []),
    {
      label: text('userManagement.history.actions.activate'),
      disabled: saving.value || !hasPermission('user:update'),
      onClick: () => handleActivate(entry),
    },
  ]
}

function canSwitchToEmployee(entry: UserHistoryEntry) {
  return (
    entry.account_source === 'candidate_service' &&
    normalize(entry.role) === 'candidate'
  )
}

async function handleSwitchToEmployee(entry: UserHistoryEntry) {
  const confirmed = await appConfirm.confirm({
    title: text('common.actions.confirm'),
    message: text('userManagement.history.confirm.switchToEmployee', { target: entry.email || entry.full_name || entry.id }),
    confirmLabel: text('common.actions.yes'),
    cancelLabel: text('common.actions.cancel'),
  })
  if (!confirmed) {
    return
  }

  try {
    await switchToEmployee(entry.id)
    appToast.success(text('userManagement.history.toast.switchSuccess'))
  } catch (err) {
    const message = err instanceof Error ? err.message : text('userManagement.history.errors.switchToEmployee')
    appToast.error(message)
  }
}

function formatHistoryReferenceDate(entry: UserHistoryEntry) {
  const referenceDate =
    entry.role === 'candidate'
      ? (entry.activated_at ?? entry.created_at)
      : entry.created_at

  return formatDateTimeDisplay(referenceDate)
}
</script>
