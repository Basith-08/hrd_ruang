<template>
  <div class="flex w-full flex-col gap-4">
    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-8">
        <div class="flex items-start gap-4">
          <AppActionButton label="Back" variant="icon" @click="router.back()">
            <span aria-hidden="true">←</span>
          </AppActionButton>

          <div class="max-w-3xl">
            <p class="app-dashboard-eyebrow">
              Administrator
            </p>
            <h1 class="app-dashboard-title mt-3">
              {{ isEdit ? `Edit Role Access: ${formData.name}` : 'Add New Role' }}
            </h1>
            <p class="app-dashboard-copy mt-3 max-w-2xl">
              Configure role metadata and module access in one place so permission policy stays explicit.
            </p>
          </div>
        </div>
      </div>
    </section>

    <AppAlert :message="error" />

    <AppLoadingState v-if="loading" message="Loading configuration..." />

    <form v-else class="space-y-6" @submit.prevent="handleSubmit">
      <RoleManagementBasicInfoSection :form-data="formData" :is-edit="isEdit" />

      <section class="app-dashboard-panel">
        <div class="p-5">
          <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between xl:gap-8">
              <div class="min-w-0 max-w-2xl flex-1">
                <h2 class="app-dashboard-title !mt-0 !text-[1.15rem]">
                  Permission Settings
                </h2>
                <p class="app-dashboard-copy mt-1">
                  Select which modules and actions can be accessed by this role.
                </p>
              </div>

              <AppActionButton
                class="inline-flex min-h-11 w-full items-center justify-center sm:w-auto xl:min-w-[120px] xl:flex-none"
                :label="isAllSelected ? 'Clear All' : 'Select All'"
                variant="secondary"
                @click="toggleAllPermissions"
              />
            </div>

            <div class="grid gap-6 sm:grid-cols-2">
              <RolePermissionGroupCard
                v-for="section in permissionSections"
                :key="section.key"
                :title="section.title"
                :description="section.description"
                :permissions="section.permissions"
                :model-value="selectedPermissionIds"
                :title-class="section.titleClass"
                @update:model-value="selectedPermissionIds = $event"
              />
            </div>
          </div>
        </div>
      </section>

      <div class="app-table-divider flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
        <AppActionButton label="Cancel" variant="ghost" :disabled="saving" @click="router.back()" />
        <AppActionButton
          type="submit"
          variant="primary"
          :loading="saving"
          :loading-label="'Saving...'"
          :label="isEdit ? 'Save Access Changes' : 'Create Role'"
          :disabled="saving"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from '#imports'

import type { Permission } from '@/domain/entities/Role'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import AppLoadingState from '@/presentation/components/feedback/AppLoadingState.vue'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import { useRoleManagementViewModel } from '@/viewmodels/useRoleManagementViewModel'
import RoleManagementBasicInfoSection from './components/RoleManagementBasicInfoSection.vue'
import RolePermissionGroupCard from './components/RolePermissionGroupCard.vue'

const route = useRoute()
const router = useRouter()
const {
  roles,
  permissions,
  loading,
  saving,
  error,
  refreshRoles,
  refreshPermissions,
  createRole,
  updateRole,
} = useRoleManagementViewModel()

const appToast = useAppToast()

const roleId = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => !!roleId.value)

const formData = reactive({
  name: '',
  description: '',
})

const selectedPermissionIds = ref<string[]>([])

const legacyPermissionMap: Record<string, string[]> = {
  'job_request:create': ['employee_request_form:create'],
  'job_request:read': ['employee_request_form:read'],
  'job_request:update': ['employee_request_form:update'],
  'job_request:delete': ['employee_request_form:delete'],
  'job_request:close': ['employee_request_form:close'],
  'recruitment:pic_recruitment_read': ['pic_recruitment:read'],
  'recruitment:pic_recruitment_update': ['pic_recruitment:update'],
  'candidate:create': ['candidate_form:create'],
  'candidate:read': ['candidate_form:read'],
  'candidate:update': ['candidate_form:update'],
  'candidate:delete': ['candidate_form:delete'],
  'candidate_data:create': ['candidate_form:create'],
  'candidate_data:read': ['candidate_form:read'],
  'candidate_data:update': ['candidate_form:update'],
  'candidate_data:delete': ['candidate_form:delete'],
}

function getManageablePermissions() {
  return permissions.value
}

const isAllSelected = computed({
  get: () => {
    const manageablePermissions = getManageablePermissions()
    return (
      manageablePermissions.length > 0 &&
      manageablePermissions.every((permission) =>
        selectedPermissionIds.value.includes(permission.id),
      )
    )
  },
  set: (val) => {
    if (val) {
      selectedPermissionIds.value = getManageablePermissions().map((permission) => permission.id)
    } else {
      selectedPermissionIds.value = []
    }
  },
})

function toggleAllPermissions() {
  isAllSelected.value = !isAllSelected.value
}

function getPermissionsByPrefix(prefix: string) {
  return permissions.value.filter((p) => p.name.startsWith(`${prefix}:`))
}

function getSystemAdminPermissions() {
  return permissions.value.filter((p) => {
    return (
      p.name.startsWith('user:')
      || p.name.startsWith('role:')
      || p.name.startsWith('document:')
      || p.name.startsWith('candidate_employee:')
    )
  })
}

function getHiringPermissions() {
  return permissions.value.filter((p) => {
    return p.name.startsWith('recruitment:') && !p.name.startsWith('recruitment:pic_recruitment_')
  })
}

function getPicRecruitmentPermissions() {
  const allowedPermissionNames = new Set([
    'pic_recruitment:read',
    'pic_recruitment:update',
  ])

  return permissions.value.filter((p) => allowedPermissionNames.has(p.name))
}

function getExportConfigurationPermissions() {
  return permissions.value.filter((p) => p.name.startsWith('export_configuration:'))
}

const permissionSections = computed<
  Array<{
    key: string
    title: string
    description: string
    permissions: Permission[]
    titleClass?: string
  }>
>(() => [
  {
    key: 'dashboard',
    title: 'Dashboard',
    description: 'Access to the main dashboard overview page.',
    permissions: getPermissionsByPrefix('dashboard'),
  },
  {
    key: 'employee_request_form',
    title: 'Employee Request Form (ERF)',
    description: 'Access to ERF submission, creation, update, close action, and follow-up.',
    permissions: getPermissionsByPrefix('employee_request_form'),
    titleClass: 'app-copy-strong app-role-permission-title-accent',
  },
  {
    key: 'approval',
    title: 'Approval',
    description: 'Access to approval tracking, approval flow monitoring, and approver configuration.',
    permissions: getPermissionsByPrefix('approval'),
  },
  {
    key: 'hiring',
    title: 'Hiring',
    description: 'Access to the recruitment dashboard, approved employee request form queue, and related recruitment tools.',
    permissions: getHiringPermissions(),
  },
  {
    key: 'pic_recruitment',
    title: 'PIC Recruitment',
    description: 'Access to PIC Recruitment menu and recruiter assignment actions for approved ERFs.',
    permissions: getPicRecruitmentPermissions(),
  },
  {
    key: 'candidate_form',
    title: 'Candidate Form',
    description: 'Access to candidate form records and candidate profile updates.',
    permissions: getPermissionsByPrefix('candidate_form'),
  },
  {
    key: 'employee_form',
    title: 'Employee Form',
    description: 'Access to employee form records, employee onboarding data, and employee contract document uploads.',
    permissions: getPermissionsByPrefix('employee_form'),
  },
  {
    key: 'employee_contract_form',
    title: 'New Employee Contract Form (NECF)',
    description: 'Access to NECF records, contract printing, and SKB export.',
    permissions: getPermissionsByPrefix('employee_contract_form'),
  },
  {
    key: 'export_configuration',
    title: 'Document Export Configuration',
    description: 'Access to export configuration overview, template management, and document generation.',
    permissions: getExportConfigurationPermissions(),
  },
  {
    key: 'interview_evaluation',
    title: 'Interview Evaluation',
    description: 'Access to interview evaluation forms, interviewer scoring, and interview recommendations.',
    permissions: getPermissionsByPrefix('interview_evaluation'),
  },
  {
    key: 'system_admin',
    title: 'System Admin',
    description: 'Access to user management, role management, and other administrative settings.',
    permissions: getSystemAdminPermissions(),
  },
  {
    key: 'user_history',
    title: 'User History',
    description: 'Access to the inactive user module sourced from `profiles.is_active = false`.',
    permissions: getPermissionsByPrefix('user_history'),
  },
])

function mapLegacyPermissionsToCurrentIds(permissionNames: string[]) {
  const selectedIds = new Set<string>()

  for (const permissionName of permissionNames) {
    const mappedNames = legacyPermissionMap[permissionName]

    if (!mappedNames) {
      const directPermission = permissions.value.find(
        (permission) => permission.name === permissionName,
      )
      if (directPermission) {
        selectedIds.add(directPermission.id)
      }
    }

    for (const mappedName of mappedNames || []) {
      const mappedPermission = permissions.value.find(
        (permission) => permission.name === mappedName,
      )
      if (mappedPermission) {
        selectedIds.add(mappedPermission.id)
      }
    }
  }

  return Array.from(selectedIds)
}

// Load initial data
onMounted(async () => {
  // ensure roles and permissions are loaded
  if (permissions.value.length === 0) {
    await refreshPermissions()
  }
  if (roles.value.length === 0) {
    await refreshRoles()
  }

  setupFormData()
})

// watch roles if they get fetched late
watch(
  () => roles.value,
  () => {
    setupFormData()
  },
  { deep: true },
)

watch(
  () => permissions.value,
  () => {
    setupFormData()
  },
  { deep: true },
)

function setupFormData() {
  if (isEdit.value && roles.value.length > 0) {
    const role = roles.value.find((r) => r.id === roleId.value)
    if (role) {
      formData.name = role.name
      formData.description = role.description || ''
      selectedPermissionIds.value = mapLegacyPermissionsToCurrentIds(
        (role.permissions || []).map((p) => p.name),
      )
    }
  }
}

async function handleSubmit() {
  try {
    if (isEdit.value && roleId.value) {
      await updateRole(
        roleId.value,
        formData.name,
        formData.description,
        selectedPermissionIds.value,
      )
      appToast.updated(`Access rights for role ${formData.name}`)
    } else {
      await createRole(formData.name, formData.description, selectedPermissionIds.value)
      appToast.created(`Role ${formData.name}`)
    }
    router.push('/role-management')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save role.'
    appToast.error(message)
  }
}
</script>
