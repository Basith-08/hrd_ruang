<template>
  <div class="flex w-full flex-col gap-4">
    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-8">
        <div class="max-w-3xl">
          <p class="app-dashboard-eyebrow">
            Administrator
          </p>
          <h1 class="app-dashboard-title mt-3">
            Role Management
          </h1>
          <p class="app-dashboard-copy mt-3 max-w-2xl">
            Manage role definitions and feature permissions for each role in the system.
          </p>
        </div>

        <AppActionButton
          class="inline-flex min-h-11 w-full items-center justify-center sm:w-auto xl:min-w-[160px] xl:flex-none"
          label="Add New Role"
          variant="primary"
          :disabled="loading"
          @click="goToCreate"
        />
      </div>
    </section>

    <AppAlert :message="error" />

    <section class="app-dashboard-panel">
      <div class="p-5">
        <div class="flex flex-col gap-5">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between xl:gap-8">
            <div class="min-w-0 max-w-2xl flex-1">
              <h2 class="app-dashboard-title !mt-0 !text-[1.15rem]">
                Role List
              </h2>
              <p class="app-dashboard-copy mt-1">
                Review permissions, search by role metadata, and keep access policies consistent.
              </p>
            </div>

            <div class="flex w-full flex-col gap-3 xl:w-auto xl:flex-row xl:items-end xl:justify-end">
              <label class="block xl:w-[420px] xl:flex-none">
                <span class="app-fieldset-label mb-1.5 block">
                  Search
                </span>
                <AppSearchInput
                  v-model="searchQuery"
                  placeholder="Search nama role, deskripsi, permission..."
                  class="w-full"
                />
              </label>

              <label class="block xl:w-[240px] xl:flex-none">
                <span class="app-fieldset-label mb-1.5 block">
                  Status
                </span>
                <SearchableSelect
                  v-model="permissionFilter"
                  :options="permissionFilterOptions"
                  placeholder="Search permission filter..."
                  show-empty-option
                  empty-label="All"
                />
              </label>

              <AppActionButton
                class="inline-flex min-h-11 w-full items-center justify-center sm:w-auto xl:min-w-[120px] xl:flex-none"
                :label="loading ? 'Loading...' : 'Refresh'"
                variant="secondary"
                :disabled="loading"
                @click="refreshRoles"
              />
            </div>
          </div>

          <RoleManagementTable
            :roles="pagedRoles"
            :loading="loading"
            :saving="saving"
            :page="page"
            :page-size="pageSize"
            :total-items="filteredRoles.length"
            @update:page="page = $event"
            @edit="goToEdit"
            @delete="handleDelete"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from '#imports'

import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import SearchableSelect from '@/presentation/components/forms/SearchableSelect.vue'
import AppSearchInput from '@/presentation/components/forms/AppSearchInput.vue'
import { useAppConfirm } from '@/presentation/components/feedback/useAppConfirm'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import { useRoleManagementViewModel } from '@/viewmodels/useRoleManagementViewModel'
import RoleManagementTable from './components/RoleManagementTable.vue'

const router = useRouter()
const { roles, loading, saving, error, refreshRoles, deleteRole } = useRoleManagementViewModel()
const appToast = useAppToast()
const appConfirm = useAppConfirm()

const searchQuery = ref('')
const permissionFilter = ref('')
const pageSize = 10
const page = ref(1)
const permissionFilterOptions = [
  { value: 'with', label: 'With permissions' },
  { value: 'without', label: 'Without permissions' },
]

function normalize(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
}

const filteredRoles = computed(() => {
  const q = normalize(searchQuery.value)
  return roles.value.filter((r) => {
    const hasPerms = (r.permissions?.length ?? 0) > 0
    if (permissionFilter.value === 'with' && !hasPerms) return false
    if (permissionFilter.value === 'without' && hasPerms) return false
    if (!q) return true

    const perms = (r.permissions ?? []).map((p) => p.name).join(' ')
    const haystack = [r.name, r.description, perms].map(normalize).join(' ')
    return haystack.includes(q)
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRoles.value.length / pageSize)))
const pagedRoles = computed(() => {
  const safePage = Math.min(Math.max(page.value, 1), totalPages.value)
  const start = (safePage - 1) * pageSize
  return filteredRoles.value.slice(start, start + pageSize)
})

function resetPage() {
  page.value = 1
}

watch([searchQuery, permissionFilter], resetPage)
watch(
  () => filteredRoles.value.length,
  () => {
    if (page.value > totalPages.value) page.value = totalPages.value
  },
)

function goToCreate() {
  router.push('/role-management/create')
}

function goToEdit(roleId: string) {
  router.push(`/role-management/${roleId}/edit`)
}

async function handleDelete(roleId: string, name: string) {
  const confirmed = await appConfirm.confirm({
    title: 'Confirmation',
    message: `Delete role "${name}"? Users assigned to this role may lose access. This action cannot be undone.`,
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    tone: 'danger',
  })
  if (!confirmed) return
  try {
    await deleteRole(roleId)
    appToast.deleted('Role')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete role.'
    appToast.error(message)
  }
}
</script>
