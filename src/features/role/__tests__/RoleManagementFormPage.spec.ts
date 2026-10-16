import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import {
  resetNuxtNavigationMocks,
  setNuxtRouteMock,
  setNuxtRouterMock,
} from '../../../../test-utils/nuxt-imports-stub'
import type { Permission, Role } from '@/domain/entities/Role'

const routeState = {
  params: {} as Record<string, string>,
}

const routerPushMock = vi.fn()
const routerBackMock = vi.fn()

const toastCreatedMock = vi.fn()
const toastUpdatedMock = vi.fn()
const toastErrorMock = vi.fn()

const refreshRolesMock = vi.fn()
const refreshPermissionsMock = vi.fn()
const createRoleMock = vi.fn()
const updateRoleMock = vi.fn()

const rolesRef = ref<Role[]>([])
const permissionsRef = ref<Permission[]>([])
const loadingRef = ref(false)
const savingRef = ref(false)
const errorRef = ref('')

vi.mock('@/presentation/components/feedback/useAppToast', () => ({
  useAppToast: () => ({
    created: toastCreatedMock,
    updated: toastUpdatedMock,
    error: toastErrorMock,
  }),
}))

vi.mock('@/viewmodels/useRoleManagementViewModel', () => ({
  useRoleManagementViewModel: () => ({
    roles: rolesRef,
    permissions: permissionsRef,
    loading: loadingRef,
    saving: savingRef,
    error: errorRef,
    refreshRoles: refreshRolesMock,
    refreshPermissions: refreshPermissionsMock,
    createRole: createRoleMock,
    updateRole: updateRoleMock,
  }),
}))

function createPermission(overrides: Partial<Permission> = {}): Permission {
  return {
    id: 'perm-1',
    name: 'employee_request_form:create',
    description: 'Create ERF',
    created_at: '2026-03-10T08:00:00',
    ...overrides,
  }
}

function createRole(overrides: Partial<Role> = {}): Role {
  return {
    id: 'role-1',
    name: 'manager',
    description: 'Manages approvals',
    created_at: '2026-03-10T08:00:00',
    permissions: [],
    ...overrides,
  }
}

describe('RoleManagementFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeState.params = {}
    resetNuxtNavigationMocks()
    setNuxtRouteMock(routeState)
    setNuxtRouterMock({
      push: routerPushMock,
      back: routerBackMock,
    })

    permissionsRef.value = [
      createPermission(),
      createPermission({
        id: 'perm-2',
        name: 'employee_request_form:update',
        description: 'Update ERF',
      }),
      createPermission({
        id: 'perm-32',
        name: 'employee_request_form:requester_read',
        description: 'View the requester field on employee request forms',
      }),
      createPermission({
        id: 'perm-33',
        name: 'employee_request_form:requester_update',
        description: 'Update the requester field on employee request forms',
      }),
      createPermission({
        id: 'perm-22',
        name: 'employee_request_form:assign_recruiter',
        description: 'Assign recruiters to approved employee request forms',
      }),
      createPermission({
        id: 'perm-20',
        name: 'employee_request_form:close',
        description: 'Close ERF records from the Employee Request Form list',
      }),
      createPermission({
        id: 'perm-21',
        name: 'employee_request_form:export_pdf',
        description: 'Export ERF records to PDF from the Employee Request Form list',
      }),
      createPermission({
        id: 'perm-3',
        name: 'approval:read',
        description: 'Read approvals',
      }),
      createPermission({
        id: 'perm-4',
        name: 'candidate_form:create',
        description: 'Create candidate form',
      }),
      createPermission({
        id: 'perm-5',
        name: 'recruitment:read',
        description: 'View recruitment dashboard',
      }),
      createPermission({
        id: 'perm-6',
        name: 'recruitment:approved_erf_read',
        description: 'View approved employee request forms',
      }),
      createPermission({
        id: 'perm-27',
        name: 'pic_recruitment:read',
        description: 'View PIC recruitment page and approved ERF assignment queue',
      }),
      createPermission({
        id: 'perm-28',
        name: 'pic_recruitment:update',
        description: 'Assign or update recruiters from the PIC recruitment page',
      }),
      createPermission({
        id: 'perm-23',
        name: 'recruitment:vacancy_pipeline',
        description: 'View vacancy pipeline page in the recruitment module',
      }),
      createPermission({
        id: 'perm-24',
        name: 'recruitment:interview_evaluasi',
        description: 'View interview evaluasi page in the recruitment module',
      }),
      createPermission({
        id: 'perm-25',
        name: 'recruitment:candidate_database',
        description: 'View candidate database page in the recruitment module',
      }),
      createPermission({
        id: 'perm-7',
        name: 'role:update',
        description: 'Update roles',
      }),
      createPermission({
        id: 'perm-8',
        name: 'user_history:read',
        description: 'Read user history',
      }),
      createPermission({
        id: 'perm-9',
        name: 'interview_evaluation:create',
        description: 'Create interview evaluation forms',
      }),
      createPermission({
        id: 'perm-10',
        name: 'interview_evaluation:read',
        description: 'View interview evaluation forms',
      }),
      createPermission({
        id: 'perm-11',
        name: 'interview_evaluation:update',
        description: 'Update interview evaluation forms',
      }),
      createPermission({
        id: 'perm-12',
        name: 'interview_evaluation:interviewer_form',
        description: 'Access interviewer assignments and submit assigned interview evaluations',
      }),
      createPermission({
        id: 'perm-13',
        name: 'interview_evaluation:delete',
        description: 'Delete interview evaluation forms',
      }),
      createPermission({
        id: 'perm-14',
        name: 'user:switch_to_employee',
        description: 'Switch candidate portal accounts to employee mode',
      }),
      createPermission({
        id: 'perm-15',
        name: 'employee_form:create',
        description: 'Create employee forms',
      }),
      createPermission({
        id: 'perm-16',
        name: 'employee_form:read',
        description: 'View employee forms',
      }),
      createPermission({
        id: 'perm-17',
        name: 'employee_form:update',
        description: 'Update employee forms',
      }),
      createPermission({
        id: 'perm-18',
        name: 'employee_form:update_contract_documents',
        description: 'Upload Draft Employment Contract and SKB from Employee Form details',
      }),
      createPermission({
        id: 'perm-19',
        name: 'employee_form:delete',
        description: 'Delete employee forms',
      }),
      createPermission({
        id: 'perm-20',
        name: 'employee_form:export_pdf',
        description: 'Export employee forms to PDF',
      }),
      createPermission({
        id: 'perm-20',
        name: 'employee_contract_form:create',
        description: 'Create new employee contract forms (NECF)',
      }),
      createPermission({
        id: 'perm-21',
        name: 'employee_contract_form:read',
        description: 'View new employee contract forms (NECF)',
      }),
      createPermission({
        id: 'perm-22',
        name: 'employee_contract_form:update',
        description: 'Update new employee contract forms (NECF)',
      }),
      createPermission({
        id: 'perm-23',
        name: 'employee_contract_form:delete',
        description: 'Delete new employee contract forms (NECF)',
      }),
      createPermission({
        id: 'perm-24',
        name: 'employee_contract_form:export_pdf',
        description: 'Print or export new employee contract forms (NECF) to PDF',
      }),
      createPermission({
        id: 'perm-29',
        name: 'export_configuration:read',
        description: 'View export configuration menu and overview page',
      }),
      createPermission({
        id: 'perm-30',
        name: 'export_configuration:manage',
        description: 'Manage DOCX export templates and field mapping',
      }),
      createPermission({
        id: 'perm-31',
        name: 'export_configuration:generate',
        description: 'Prepare, preview, and generate export documents',
      }),
    ]
    rolesRef.value = [
      createRole({
        permissions: [
          { id: 'legacy-1', name: 'job_request:update', description: 'Legacy update', created_at: 'now' },
          { id: 'legacy-2', name: 'approval:read', description: 'Read approvals', created_at: 'now' },
        ],
      }),
    ]
    loadingRef.value = false
    savingRef.value = false
    errorRef.value = ''

    refreshRolesMock.mockResolvedValue(undefined)
    refreshPermissionsMock.mockResolvedValue(undefined)
    createRoleMock.mockResolvedValue(undefined)
    updateRoleMock.mockResolvedValue(undefined)
  })

  it('creates a new role after selecting all manageable permissions', async () => {
    const { default: RoleManagementFormPage } = await import('../RoleManagementFormPage.vue')
    const wrapper = mount(RoleManagementFormPage)

    await flushPromises()

    const textInputs = wrapper.findAll('input[type="text"]')
    await textInputs[0]!.setValue('hr_manager')
    await textInputs[1]!.setValue('Handles HR workflows')

    const selectAllButton = wrapper.findAll('button').find((button) => button.text() === 'Select All')
    await selectAllButton!.trigger('click')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(createRoleMock).toHaveBeenCalledWith(
      'hr_manager',
      'Handles HR workflows',
      permissionsRef.value.map((permission) => permission.id),
    )
    expect(toastCreatedMock).toHaveBeenCalledWith('Role hr_manager')
    expect(routerPushMock).toHaveBeenCalledWith('/role-management')
  })

  it('loads an existing role, maps legacy permissions, and updates access rights', async () => {
    routeState.params = { id: 'role-1' }
    setNuxtRouteMock(routeState)

    const { default: RoleManagementFormPage } = await import('../RoleManagementFormPage.vue')
    const wrapper = mount(RoleManagementFormPage)

    await flushPromises()

    const roleNameInput = wrapper.findAll('input[type="text"]')[0]!
    expect((roleNameInput.element as HTMLInputElement).value).toBe('manager')
    expect(roleNameInput.attributes('disabled')).toBeDefined()

    const checkedPermissions = wrapper
      .findAll('input[type="checkbox"]')
      .filter((input) => (input.element as HTMLInputElement).checked)
      .map((input) => (input.element as HTMLInputElement).value)

    expect(checkedPermissions).toEqual(expect.arrayContaining(['perm-2', 'perm-3']))

    const approvalCheckbox = wrapper
      .findAll('input[type="checkbox"]')
      .find((input) => (input.element as HTMLInputElement).value === 'perm-3')

    await approvalCheckbox!.setValue(false)
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(updateRoleMock).toHaveBeenCalledWith(
      'role-1',
      'manager',
      'Manages approvals',
      ['perm-2'],
    )
    expect(toastUpdatedMock).toHaveBeenCalledWith('Access rights for role manager')
    expect(routerPushMock).toHaveBeenCalledWith('/role-management')
  })

  it('shows split hiring permissions separately', async () => {
    const { default: RoleManagementFormPage } = await import('../RoleManagementFormPage.vue')
    const wrapper = mount(RoleManagementFormPage)

    await flushPromises()

    expect(wrapper.text()).toContain('recruitment:read')
    expect(wrapper.text()).toContain('View recruitment dashboard')
    expect(wrapper.text()).toContain('recruitment:approved_erf_read')
    expect(wrapper.text()).toContain('View approved employee request forms')
    expect(wrapper.text()).toContain('recruitment:vacancy_pipeline')
    expect(wrapper.text()).toContain('View vacancy pipeline page in the recruitment module')
    expect(wrapper.text()).toContain('recruitment:candidate_database')
    expect(wrapper.text()).toContain('View candidate database page in the recruitment module')
    expect(wrapper.text()).toContain('recruitment:interview_evaluasi')
    expect(wrapper.text()).toContain('View interview evaluasi page in the recruitment module')
  })

  it('shows only the used PIC Recruitment permissions in a dedicated group', async () => {
    const { default: RoleManagementFormPage } = await import('../RoleManagementFormPage.vue')
    const wrapper = mount(RoleManagementFormPage)

    await flushPromises()

    expect(wrapper.text()).toContain('PIC Recruitment')
    expect(wrapper.text()).toContain('Read PIC Recruitment')
    expect(wrapper.text()).toContain('pic_recruitment:read')
    expect(wrapper.text()).toContain('Update PIC Recruitment')
    expect(wrapper.text()).toContain('pic_recruitment:update')
    expect(wrapper.text()).not.toContain('recruitment:pic_recruitment_read')
    expect(wrapper.text()).not.toContain('recruitment:pic_recruitment_update')
    expect(wrapper.text()).not.toContain('Create PIC Recruitment')
    expect(wrapper.text()).not.toContain('pic_recruitment:create')
    expect(wrapper.text()).not.toContain('Delete PIC Recruitment')
    expect(wrapper.text()).not.toContain('pic_recruitment:delete')
  })

  it('shows the close ERF permission in the Employee Request Form group', async () => {
    const { default: RoleManagementFormPage } = await import('../RoleManagementFormPage.vue')
    const wrapper = mount(RoleManagementFormPage)

    await flushPromises()

    expect(wrapper.text()).toContain('Employee Request Form (ERF)')
    expect(wrapper.text()).toContain('Close ERF')
    expect(wrapper.text()).toContain('employee_request_form:close')
    expect(wrapper.text()).toContain('Close ERF records from the Employee Request Form list')
    expect(wrapper.text()).toContain('View ERF Requester')
    expect(wrapper.text()).toContain('employee_request_form:requester_read')
    expect(wrapper.text()).toContain('View the requester field on employee request forms')
    expect(wrapper.text()).toContain('Update ERF Requester')
    expect(wrapper.text()).toContain('employee_request_form:requester_update')
    expect(wrapper.text()).toContain('Update the requester field on employee request forms')
    expect(wrapper.text()).toContain('Export ERF PDF')
    expect(wrapper.text()).toContain('employee_request_form:export_pdf')
    expect(wrapper.text()).toContain('Export ERF records to PDF from the Employee Request Form list')
  })

  it('shows interview evaluation permissions in a separate group', async () => {
    const { default: RoleManagementFormPage } = await import('../RoleManagementFormPage.vue')
    const wrapper = mount(RoleManagementFormPage)

    await flushPromises()

    expect(wrapper.text()).toContain('Interview Evaluation')
    expect(wrapper.text()).toContain('interview_evaluation:create')
    expect(wrapper.text()).toContain('interview_evaluation:read')
    expect(wrapper.text()).toContain('interview_evaluation:update')
    expect(wrapper.text()).toContain('interview_evaluation:interviewer_form')
    expect(wrapper.text()).toContain('interview_evaluation:delete')
    expect(wrapper.text()).toContain('View interview evaluation forms')
  })

  it('shows the switch-to-employee permission in the System Admin group', async () => {
    const { default: RoleManagementFormPage } = await import('../RoleManagementFormPage.vue')
    const wrapper = mount(RoleManagementFormPage)

    await flushPromises()

    expect(wrapper.text()).toContain('System Admin')
    expect(wrapper.text()).toContain('user:switch_to_employee')
    expect(wrapper.text()).toContain('Switch candidate portal accounts to employee mode')
  })

  it('shows employee form permissions in a separate group', async () => {
    const { default: RoleManagementFormPage } = await import('../RoleManagementFormPage.vue')
    const wrapper = mount(RoleManagementFormPage)

    await flushPromises()

    expect(wrapper.text()).toContain('Employee Form')
    expect(wrapper.text()).toContain('employee_form:create')
    expect(wrapper.text()).toContain('employee_form:update_contract_documents')
    expect(wrapper.text()).toContain('employee_form:export_pdf')
    expect(wrapper.text()).toContain('Export employee forms to PDF')
  })

  it('shows NECF permissions in a separate group', async () => {
    const { default: RoleManagementFormPage } = await import('../RoleManagementFormPage.vue')
    const wrapper = mount(RoleManagementFormPage)

    await flushPromises()

    expect(wrapper.text()).toContain('New Employee Contract Form (NECF)')
    expect(wrapper.text()).toContain('employee_contract_form:create')
    expect(wrapper.text()).toContain('employee_contract_form:read')
    expect(wrapper.text()).toContain('employee_contract_form:update')
    expect(wrapper.text()).toContain('employee_contract_form:delete')
    expect(wrapper.text()).toContain('employee_contract_form:export_pdf')
    expect(wrapper.text()).toContain('Print or export new employee contract forms (NECF) to PDF')
  })

  it('shows export configuration permissions in a separate group', async () => {
    const { default: RoleManagementFormPage } = await import('../RoleManagementFormPage.vue')
    const wrapper = mount(RoleManagementFormPage)

    await flushPromises()

    expect(wrapper.text()).toContain('Document Export')
    expect(wrapper.text()).toContain('Open Document Export')
    expect(wrapper.text()).toContain('export_configuration:read')
    expect(wrapper.text()).toContain('Manage Export Templates')
    expect(wrapper.text()).toContain('export_configuration:manage')
    expect(wrapper.text()).toContain('Generate Export Documents')
    expect(wrapper.text()).toContain('export_configuration:generate')
    expect(wrapper.text()).toContain('Prepare, preview, and generate export documents')
  })
})
