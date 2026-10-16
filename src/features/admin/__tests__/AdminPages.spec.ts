import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import {
  resetNuxtNavigationMocks,
  setNuxtRouteMock,
  setNuxtRouterMock,
} from '../../../../test-utils/nuxt-imports-stub'

const routeState = {
  params: {} as Record<string, string>,
  query: {} as Record<string, string>,
  fullPath: '/',
}

const routerPushMock = vi.fn()
const routerBackMock = vi.fn()

const toastCreatedMock = vi.fn()
const toastUpdatedMock = vi.fn()
const toastDeletedMock = vi.fn()
const toastSuccessMock = vi.fn()
const toastErrorMock = vi.fn()
const confirmMock = vi.fn()

type MockMasterDataItem = {
  id: string
  name: string
  address?: string | null
  description: string | null
  required_date_min_months?: number | null
  created_at: null
  updated_at: null
  parent_id?: string | null
  parent_name?: string | null
}

const authState = {
  user: ref({
    id: 'user-1',
    email: 'admin@example.com',
    full_name: 'Admin User',
  }),
  userRole: ref('super_admin'),
}

const customGroupItemsByIndex = new Map<
  number,
  Array<{ id: string; name: string; description: string | null; index: number }>
>()
const customGroupGetAllMock = vi.fn()
const customGroupCreateMock = vi.fn()
const customGroupUpdateMock = vi.fn()
const customGroupDeleteMock = vi.fn()

const masterDataState = {
  optionsByType: ref({
    pt: [
      {
        id: 'pt-1',
        name: 'PT One',
        address: 'Jakarta',
        description: 'Primary PT',
        created_at: null,
        updated_at: null,
      },
    ],
    bu: [
      {
        id: 'bu-1',
        name: 'Corporate',
        description: 'Corporate BU',
        created_at: null,
        updated_at: null,
      },
    ],
    department: [] as MockMasterDataItem[],
    job_level: [
      { id: 'lvl-1', name: 'Senior', description: null, created_at: null, updated_at: null },
    ],
    designation: [] as MockMasterDataItem[],
  }),
  loading: ref(false),
  saving: ref(false),
  error: ref<string | null>(null),
}
const masterLoadOptionsMock = vi.fn()
const masterRefreshOptionsMock = vi.fn()
const masterCreateMock = vi.fn()
const masterUpdateMock = vi.fn()
const masterRemoveMock = vi.fn()

const userManagementState = {
  users: ref([
    {
      id: 'managed-1',
      email: 'staff@example.com',
      username: 'staff',
      full_name: 'Staff User',
      phone: '08123',
      employee_code: 'EMP-001',
      employee_request_form_id: null,
      department_id: 'dep-1',
      master_designation_id: 'des-1',
      first_name: null,
      middle_name: null,
      last_name: null,
      emergency_contact_phone: null,
      main_position: 'Recruiter',
      is_active: true,
      role: 'super_admin',
      role_id: 'role-1',
      created_at: '2026-04-01T08:00:00+07:00',
    },
    {
      id: 'managed-2',
      email: 'candidate@example.com',
      username: 'candidate',
      full_name: 'Candidate User',
      phone: '08222',
      employee_code: null,
      employee_request_form_id: 'job-2',
      department_id: 'dep-2',
      master_designation_id: 'des-2',
      first_name: null,
      middle_name: null,
      last_name: null,
      emergency_contact_phone: null,
      main_position: 'Finance Analyst',
      is_active: true,
      role: 'candidate',
      role_id: 'role-2',
      created_at: '2026-04-04T08:00:00+07:00',
      activated_at: '2026-04-04T08:00:00+07:00',
    },
    {
      id: 'managed-3',
      email: 'portal.candidate@example.com',
      username: null,
      account_source: 'candidate_service',
      full_name: 'Portal Candidate',
      phone: '08333',
      employee_code: 'EMP-PORTAL-1',
      employee_request_form_id: 'job-1',
      department_id: 'dep-1',
      master_designation_id: 'des-1',
      first_name: null,
      middle_name: null,
      last_name: null,
      emergency_contact_phone: null,
      main_position: 'Backend Engineer',
      is_active: true,
      role: 'candidate',
      role_id: 'role-2',
      created_at: '2026-04-05T09:00:00+07:00',
      activated_at: '2026-04-05T09:00:00+07:00',
      candidate_form_completion_status: 'in_progress',
      candidate_form_updated_at: '2026-04-02T08:00:00',
    },
  ]),
  userHistory: ref([
    {
      id: 'history-1',
      account_source: 'internal',
      created_at: '2026-03-01T08:00:00',
      full_name: 'Inactive User',
      email: 'inactive@example.com',
      username: 'inactive',
      role: 'staff',
      main_position: 'Recruiter',
      is_active: false,
    },
    {
      id: 'candidate:history-2',
      account_source: 'candidate_service',
      created_at: '2026-03-02T08:00:00',
      full_name: 'Dormant Finance',
      email: 'finance@example.com',
      username: null,
      role: 'candidate',
      main_position: 'Finance Lead',
      is_active: false,
    },
  ]),
  roles: ref([
    { id: 'role-1', name: 'super_admin', description: 'Admin role' },
    { id: 'role-2', name: 'candidate', description: 'Candidate role' },
    { id: 'role-3', name: 'manager', description: 'Manager role' },
  ]),
  loading: ref(false),
  saving: ref(false),
  error: ref(''),
}
const refreshUsersMock = vi.fn()
const refreshUserHistoryMock = vi.fn()
const refreshRolesMock = vi.fn()
const createUserMock = vi.fn()
const updateUserMock = vi.fn()
const deleteUserMock = vi.fn()
const updateUserRoleMock = vi.fn()
const switchToEmployeeMock = vi.fn()
const setUserActiveStatusMock = vi.fn()
const getCandidateFormByIdMock = vi.fn()

const employeeRequestState = {
  jobs: ref<Array<Record<string, unknown>>>([
    {
      id: 'job-1',
      department: 'Engineering',
      department_id: 'dep-1',
      designation: 'Senior',
      master_designation_id: 'des-1',
      main_position: 'Backend Engineer',
      status: 'open',
    },
    {
      id: 'job-2',
      department: 'Finance',
      department_id: 'dep-2',
      designation: 'Staff',
      master_designation_id: 'des-2',
      main_position: 'Finance Analyst',
      status: 'closed',
    },
  ]),
  loading: ref(false),
}
const refreshJobsMock = vi.fn()

vi.mock('@/presentation/components/forms/SearchableSelect.vue', () => ({
  default: defineComponent({
    props: ['modelValue', 'options', 'disabled'],
    emits: ['update:modelValue'],
    template: `
      <select :value="modelValue ?? ''" :disabled="disabled" @change="$emit('update:modelValue', $event.target.value)">
        <option value="">Empty</option>
        <option
          v-for="option in options"
          :key="String(option.value ?? option.label)"
          :value="option.value ?? ''"
        >
          {{ option.label }}
        </option>
      </select>
    `,
  }),
}))

vi.mock('@/presentation/components/tables/TablePagination.vue', () => ({
  default: defineComponent({
    template: '<div data-testid="pagination">Pagination</div>',
  }),
}))

vi.mock('@/presentation/components/menus/RowActionsMenu.vue', () => ({
  default: defineComponent({
    props: {
      actions: {
        type: Array,
        default: () => [],
      },
    },
    setup(props) {
      return () =>
        h(
          'div',
          {},
          (props.actions as Array<{ label: string; disabled?: boolean; onClick: () => void }>).map(
            (action) =>
              h(
                'button',
                {
                  type: 'button',
                  disabled: action.disabled,
                  onClick: action.onClick,
                },
                action.label,
              ),
          ),
        )
    },
  }),
}))

vi.mock('@/presentation/components/feedback/useAppToast', () => ({
  useAppToast: () => ({
    created: toastCreatedMock,
    updated: toastUpdatedMock,
    deleted: toastDeletedMock,
    success: toastSuccessMock,
    error: toastErrorMock,
  }),
}))

vi.mock('@/presentation/components/feedback/useAppConfirm', () => ({
  useAppConfirm: () => ({
    confirm: confirmMock,
  }),
}))

vi.mock('@/infrastructure/supabase/repositories/CustomGroupRepositoryImpl', () => ({
  customGroupRepo: {
    getAll: customGroupGetAllMock,
    create: customGroupCreateMock,
    update: customGroupUpdateMock,
    delete: customGroupDeleteMock,
  },
}))

vi.mock('@/viewmodels/useAuthViewModel', () => ({
  useAuthViewModel: () => ({
    user: authState.user,
    userRole: authState.userRole,
    hasPermission: vi.fn(() => true),
    hasAnyPermission: vi.fn(() => true),
  }),
}))

vi.mock('@/viewmodels/useMasterDataViewModel', () => ({
  useMasterDataViewModel: () => ({
    ...masterDataState,
    loadOptions: masterLoadOptionsMock,
    refreshOptions: masterRefreshOptionsMock,
    create: masterCreateMock,
    update: masterUpdateMock,
    remove: masterRemoveMock,
  }),
}))

vi.mock('@/viewmodels/useUserManagementViewModel', () => ({
  useUserManagementViewModel: () => ({
    ...userManagementState,
    refreshUsers: refreshUsersMock,
    refreshUserHistory: refreshUserHistoryMock,
    refreshRoles: refreshRolesMock,
    createUser: createUserMock,
    updateUser: updateUserMock,
    deleteUser: deleteUserMock,
    updateUserRole: updateUserRoleMock,
    switchToEmployee: switchToEmployeeMock,
    setUserActiveStatus: setUserActiveStatusMock,
  }),
}))

vi.mock('@/viewmodels/useCandidateFormViewModel', () => ({
  useCandidateFormViewModel: () => ({
    getById: getCandidateFormByIdMock,
  }),
}))

vi.mock('@/viewmodels/useEmployeeRequestFormViewModel', () => ({
  useEmployeeRequestFormViewModel: () => ({
    ...employeeRequestState,
    refresh: refreshJobsMock,
  }),
}))

function resetCustomGroupItems() {
  customGroupItemsByIndex.clear()
  customGroupItemsByIndex.set(1, [
    { id: 'cg-1', name: 'Group One Item', description: 'Group one description', index: 1 },
  ])
  customGroupItemsByIndex.set(2, [
    { id: 'cg-2', name: 'Group Two Item', description: 'Group two description', index: 2 },
  ])
}

describe('admin pages unit', () => {
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-06T10:00:00+07:00'))
    vi.clearAllMocks()
    window.localStorage.setItem('hrd_ruang_locale', 'en')
    const { useLocale } = await import('@/composables/useLocale')
    useLocale().setLocale('en')
    routeState.params = {}
    routeState.query = {}
    routeState.fullPath = '/'
    resetNuxtNavigationMocks()
    setNuxtRouteMock(routeState)
    setNuxtRouterMock({
      push: routerPushMock,
      back: routerBackMock,
    })

    authState.userRole.value = 'super_admin'
    authState.user.value = {
      id: 'user-1',
      email: 'admin@example.com',
      full_name: 'Admin User',
    }

    resetCustomGroupItems()
    customGroupGetAllMock.mockImplementation(async (groupIndex: number) => {
      return customGroupItemsByIndex.get(groupIndex) ?? []
    })
    customGroupCreateMock.mockResolvedValue(undefined)
    customGroupUpdateMock.mockResolvedValue(undefined)
    customGroupDeleteMock.mockResolvedValue(undefined)

    masterDataState.optionsByType.value = {
      pt: [
        {
          id: 'pt-1',
          name: 'PT One',
          address: 'Jakarta',
          description: 'Primary PT',
          created_at: null,
          updated_at: null,
        },
      ],
      bu: [
        {
          id: 'bu-1',
          name: 'Corporate',
          description: 'Corporate BU',
          created_at: null,
          updated_at: null,
        },
      ],
      department: [],
      job_level: [
        { id: 'lvl-1', name: 'Senior', description: null, created_at: null, updated_at: null },
      ],
      designation: [],
    }
    masterDataState.loading.value = false
    masterDataState.saving.value = false
    masterDataState.error.value = null
    masterLoadOptionsMock.mockImplementation(
      async (types: Array<'pt' | 'bu' | 'department' | 'job_level' | 'designation'>) => {
        for (const type of types) {
          await masterRefreshOptionsMock(type)
        }
      },
    )
    masterRefreshOptionsMock.mockImplementation(
      async (type: 'pt' | 'bu' | 'department' | 'job_level' | 'designation') => {
        if (type === 'department') {
          masterDataState.optionsByType.value.department = [
            {
              id: 'dep-1',
              name: 'Engineering',
              description: 'Engineering team',
              created_at: null,
              updated_at: null,
              parent_id: 'bu-1',
              parent_name: 'Corporate',
            },
          ]
        }
      },
    )
    masterCreateMock.mockResolvedValue(undefined)
    masterUpdateMock.mockResolvedValue(undefined)
    masterRemoveMock.mockResolvedValue(undefined)

    userManagementState.users.value = [
      {
        id: 'managed-1',
        email: 'staff@example.com',
        username: 'staff',
        full_name: 'Staff User',
        phone: '08123',
        employee_code: 'EMP-001',
        employee_request_form_id: null,
        department_id: 'dep-1',
        master_designation_id: 'des-1',
        first_name: null,
        middle_name: null,
        last_name: null,
        emergency_contact_phone: null,
        main_position: 'Recruiter',
        is_active: true,
        role: 'super_admin',
        role_id: 'role-1',
        created_at: '2026-04-01T08:00:00+07:00',
      },
      {
        id: 'managed-2',
        email: 'candidate@example.com',
        username: 'candidate',
        full_name: 'Candidate User',
        phone: '08222',
        employee_code: null,
        employee_request_form_id: 'job-2',
        department_id: 'dep-2',
        master_designation_id: 'des-2',
        first_name: null,
        middle_name: null,
        last_name: null,
        emergency_contact_phone: null,
        main_position: 'Finance Analyst',
        is_active: true,
        role: 'candidate',
        role_id: 'role-2',
        created_at: '2026-04-04T08:00:00+07:00',
        activated_at: '2026-04-04T08:00:00+07:00',
      },
      {
        id: 'managed-3',
        email: 'portal.candidate@example.com',
        username: null,
        account_source: 'candidate_service',
        full_name: 'Portal Candidate',
        phone: '08333',
        employee_code: 'EMP-PORTAL-1',
        employee_request_form_id: 'job-1',
        department_id: 'dep-1',
        master_designation_id: 'des-1',
        first_name: null,
        middle_name: null,
        last_name: null,
        emergency_contact_phone: null,
        main_position: 'Backend Engineer',
        is_active: true,
        role: 'candidate',
        role_id: 'role-2',
        created_at: '2026-04-05T09:00:00+07:00',
        activated_at: '2026-04-05T09:00:00+07:00',
        candidate_form_completion_status: 'in_progress',
        candidate_form_updated_at: '2026-04-02T08:00:00',
      },
    ]
    userManagementState.userHistory.value = [
      {
        id: 'history-1',
        account_source: 'internal',
        created_at: '2026-03-01T08:00:00',
        full_name: 'Inactive User',
        email: 'inactive@example.com',
        username: 'inactive',
        role: 'staff',
        main_position: 'Recruiter',
        is_active: false,
      },
      {
        id: 'candidate:history-2',
        account_source: 'candidate_service',
        created_at: '2026-03-02T08:00:00',
        full_name: 'Dormant Finance',
        email: 'finance@example.com',
        username: null,
        role: 'candidate',
        main_position: 'Finance Lead',
        is_active: false,
      },
    ]
    userManagementState.roles.value = [
      { id: 'role-1', name: 'super_admin', description: 'Admin role' },
      { id: 'role-2', name: 'candidate', description: 'Candidate role' },
      { id: 'role-3', name: 'manager', description: 'Manager role' },
    ]
    userManagementState.loading.value = false
    userManagementState.saving.value = false
    userManagementState.error.value = ''
    refreshUsersMock.mockResolvedValue(undefined)
    refreshUserHistoryMock.mockResolvedValue(undefined)
    refreshRolesMock.mockResolvedValue(undefined)
    createUserMock.mockResolvedValue(undefined)
    updateUserMock.mockResolvedValue(undefined)
    deleteUserMock.mockResolvedValue(undefined)
    updateUserRoleMock.mockResolvedValue(undefined)
    switchToEmployeeMock.mockResolvedValue(undefined)
    setUserActiveStatusMock.mockResolvedValue(undefined)

    employeeRequestState.jobs.value = [
      {
        id: 'job-1',
        department: 'Engineering',
        department_id: 'dep-1',
        designation: 'Senior',
        master_designation_id: 'des-1',
        main_position: 'Backend Engineer',
        status: 'open',
        recruitment_flow_stage: 'erf_approved',
        recruiter_user_id: 'managed-1',
      },
      {
        id: 'job-2',
        department: 'Finance',
        department_id: 'dep-2',
        designation: 'Staff',
        master_designation_id: 'des-2',
        main_position: 'Finance Analyst',
        status: 'closed',
      },
      {
        id: 'job-3',
        department: 'QA',
        department_id: 'dep-3',
        designation: 'Staff',
        master_designation_id: 'des-3',
        main_position: 'QA Engineer',
        status: 'open',
        recruitment_flow_stage: 'erf_approved',
        recruiter_user_id: null,
      },
      {
        id: 'job-4',
        department: 'Operations',
        department_id: 'dep-4',
        designation: 'Supervisor',
        master_designation_id: 'des-4',
        main_position: 'Ops Coordinator',
        status: 'open',
        recruitment_flow_stage: 'approval_in_progress',
        recruiter_user_id: null,
      },
    ]
    employeeRequestState.loading.value = false
    refreshJobsMock.mockResolvedValue(undefined)

    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    )
    confirmMock.mockResolvedValue(true)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    resetNuxtNavigationMocks()
  })

  it('switches custom group tabs and loads data for the active tab', async () => {
    const { default: Page } = await import('../CustomGroupManagementPage.vue')
    const wrapper = mount(Page)

    await flushPromises()
    expect(customGroupGetAllMock).toHaveBeenCalledWith(1)
    expect(wrapper.text()).toContain('Group One Item')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Group 2')!
      .trigger('click')
    await flushPromises()

    expect(customGroupGetAllMock).toHaveBeenCalledWith(2)
    expect(wrapper.text()).toContain('Group Two Item')
  })

  it('creates, updates, and deletes custom group items', async () => {
    const { default: Page } = await import('../CustomGroupManagementPage.vue')
    const wrapper = mount(Page)

    await flushPromises()
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add Item')!
      .trigger('click')
    await wrapper.get('input[placeholder="Entry name"]').setValue('New Group Item')
    await wrapper.get('textarea').setValue('New description')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(customGroupCreateMock).toHaveBeenCalledWith(1, {
      name: 'New Group Item',
      description: 'New description',
    })
    expect(toastCreatedMock).toHaveBeenCalledWith('Custom Group 1 entry')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Edit')!
      .trigger('click')
    await wrapper.get('input[placeholder="Entry name"]').setValue('Updated Group Item')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(customGroupUpdateMock).toHaveBeenCalledWith(1, 'cg-1', {
      name: 'Updated Group Item',
      description: 'Group one description',
    })
    expect(toastUpdatedMock).toHaveBeenCalledWith('Custom Group 1 entry')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Delete')!
      .trigger('click')
    await flushPromises()

    expect(customGroupDeleteMock).toHaveBeenCalledWith(1, 'cg-1')
    expect(toastDeletedMock).toHaveBeenCalledWith('Item')
  })

  it('refreshes master data by tab and performs create/delete actions', async () => {
    const { default: Page } = await import('../MasterDataManagementPage.vue')
    const wrapper = mount(Page)

    await flushPromises()
    expect(masterLoadOptionsMock).not.toHaveBeenCalled()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'BU Department')!
      .trigger('click')
    await flushPromises()

    expect(masterLoadOptionsMock).toHaveBeenCalledWith(['department'])
    expect(wrapper.text()).toContain('Engineering')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add BU Department')!
      .trigger('click')
    await wrapper.get('input[placeholder="Enter bu department name"]').setValue('Finance')
    await wrapper.get('textarea').setValue('Finance team')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(masterCreateMock).toHaveBeenCalledWith('department', {
      name: 'Finance',
      description: 'Finance team',
      parent_id: undefined,
    })
    expect(toastCreatedMock).toHaveBeenCalledWith('BU Department')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Delete')!
      .trigger('click')
    await flushPromises()

    expect(masterRemoveMock).toHaveBeenCalledWith('department', 'dep-1')
    expect(toastDeletedMock).toHaveBeenCalledWith('BU Department')
  })

  it('saves PT address in master data form', async () => {
    const { default: Page } = await import('../MasterDataManagementPage.vue')
    const wrapper = mount(Page)

    await flushPromises()

    expect(wrapper.text()).toContain('Address')
    expect(wrapper.text()).toContain('Jakarta')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add PT')!
      .trigger('click')
    await wrapper.get('input[placeholder="Enter pt name"]').setValue('PT Dua')
    await wrapper.get('textarea[placeholder="Enter PT address"]').setValue('Bandung')
    await wrapper.get('textarea[placeholder="Brief description..."]').setValue('PT kedua')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(masterCreateMock).toHaveBeenCalledWith('pt', {
      name: 'PT Dua',
      address: 'Bandung',
      description: 'PT kedua',
      parent_id: undefined,
      required_date_min_months: undefined,
    })
  })

  it('filters master data rows by the active tab search query', async () => {
    masterDataState.optionsByType.value.pt = [
      {
        id: 'pt-1',
        name: 'PT One',
        address: 'Jakarta',
        description: 'Primary PT',
        created_at: null,
        updated_at: null,
      },
      {
        id: 'pt-2',
        name: 'PT Dua',
        address: 'Bandung',
        description: 'Secondary PT',
        created_at: null,
        updated_at: null,
      },
    ]

    const { default: Page } = await import('../MasterDataManagementPage.vue')
    const wrapper = mount(Page)

    await flushPromises()

    await wrapper.get('input[type="search"]').setValue('bandung')
    expect(wrapper.text()).toContain('PT Dua')
    expect(wrapper.text()).not.toContain('PT One')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'BU Department')!
      .trigger('click')
    await flushPromises()

    expect((wrapper.get('input[type="search"]').element as HTMLInputElement).value).toBe('')
    expect(wrapper.text()).toContain('Engineering')
  })

  it('shows a friendly message when PT name already exists', async () => {
    masterCreateMock.mockRejectedValueOnce(
      new Error('duplicate key value violates unique constraint "master_pt_name_key"'),
    )

    const { default: Page } = await import('../MasterDataManagementPage.vue')
    const wrapper = mount(Page)

    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add PT')!
      .trigger('click')
    await wrapper.get('input[placeholder="Enter pt name"]').setValue('PT One')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(toastErrorMock).toHaveBeenCalledWith('PT with the same name already exists.')
  })

  it('saves required date lead time rules for job levels', async () => {
    const { default: Page } = await import('../MasterDataManagementPage.vue')
    const wrapper = mount(Page)

    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Job Level')!
      .trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Min. Required Date')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add Job Level')!
      .trigger('click')
    await wrapper.get('input[placeholder="Enter job level name"]').setValue('Manager')
    await wrapper.get('input[placeholder="e.g. 1"]').setValue('2')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(masterCreateMock).toHaveBeenCalledWith('job_level', {
      name: 'Manager',
      description: '',
      parent_id: undefined,
      required_date_min_months: 2,
    })
  })

  it('saves required date lead time rules for designations', async () => {
    const { default: Page } = await import('../MasterDataManagementPage.vue')
    const wrapper = mount(Page)

    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Designation')!
      .trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Min. Required Date')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add Designation')!
      .trigger('click')
    await wrapper.get('input[placeholder="Enter designation name"]').setValue('Supervisor')
    await wrapper.get('input[placeholder="e.g. 1"]').setValue('3')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(masterCreateMock).toHaveBeenCalledWith('designation', {
      name: 'Supervisor',
      description: '',
      parent_id: undefined,
      required_date_min_months: 3,
    })
  })

  it('filters user history and activates an account', async () => {
    const { default: Page } = await import('../UserHistoryPage.vue')
    const wrapper = mount(Page)

    expect(wrapper.text()).toContain('Inactive User')
    expect(wrapper.text()).toContain('Dormant Finance')

    await wrapper.get('input[type="search"]').setValue('finance')
    expect(wrapper.text()).toContain('Dormant Finance')
    expect(wrapper.text()).not.toContain('Inactive User')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Switch to Employee')!
      .trigger('click')
    await flushPromises()

    expect(switchToEmployeeMock).toHaveBeenCalledWith('candidate:history-2')
    expect(toastSuccessMock).toHaveBeenCalledWith('Employee mode updated successfully.')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Activate')!
      .trigger('click')
    await flushPromises()

    expect(setUserActiveStatusMock).toHaveBeenCalledWith('candidate:history-2', true)
    expect(toastSuccessMock).toHaveBeenCalledWith('User activated successfully.')
  })

  it('filters users, updates role assignment, and deactivates a user', async () => {
    const { default: Page } = await import('../UserManagementPage.vue')
    const wrapper = mount(Page)

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Info Deactivated')!
      .trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Info Deactivated')
    expect(wrapper.text()).toContain('Candidate access will be auto inactive')
    expect(wrapper.text()).toContain('Last Activated Date')

    await wrapper.get('input[type="search"]').setValue('candidate')
    expect(wrapper.text()).toContain('Candidate User')
    expect(wrapper.text()).not.toContain('Staff User')
    expect(wrapper.text()).not.toContain('Candidate Progress')

    await wrapper.findAll('select')[0]!.setValue('candidate')
    expect(wrapper.text()).toContain('Candidate User')

    await wrapper.findAll('select')[1]!.setValue('role-3')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'OK')!
      .trigger('click')
    await flushPromises()

    expect(updateUserRoleMock).toHaveBeenCalledWith('managed-2', 'role-3')
    expect(toastSuccessMock).toHaveBeenCalledWith('User role updated successfully.')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Switch to Employee')!
      .trigger('click')
    await flushPromises()

    expect(switchToEmployeeMock).toHaveBeenCalledWith('managed-3')
    expect(toastSuccessMock).toHaveBeenCalledWith('Employee mode updated successfully.')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Deactivate')!
      .trigger('click')
    await flushPromises()

    expect(setUserActiveStatusMock).toHaveBeenCalledWith('managed-2', false)
    expect(toastSuccessMock).toHaveBeenCalledWith('User deactivated successfully.')
  })

  it('filters candidate list rows by role, status, and form status', async () => {
    userManagementState.users.value = [
      {
        id: 'candidate-internal-1',
        email: 'candidate@example.com',
        username: 'candidate',
        full_name: 'Candidate Internal',
        phone: '08222',
        employee_code: null,
        employee_request_form_id: 'job-2',
        department_id: 'dep-2',
        master_designation_id: 'des-2',
        first_name: null,
        middle_name: null,
        last_name: null,
        emergency_contact_phone: null,
        main_position: 'Finance Analyst',
        is_active: true,
        role: 'candidate',
        role_id: 'role-2',
        created_at: '2026-04-04T08:00:00+07:00',
        activated_at: '2026-04-04T08:00:00+07:00',
        account_source: 'internal',
        candidate_form_completion_status: 'completed',
      },
      {
        id: 'candidate-portal-2',
        email: 'portal.candidate@example.com',
        username: null,
        account_source: 'candidate_service',
        full_name: 'Portal Candidate',
        phone: '08333',
        employee_code: 'EMP-PORTAL-1',
        employee_request_form_id: 'job-1',
        department_id: 'dep-1',
        master_designation_id: 'des-1',
        first_name: null,
        middle_name: null,
        last_name: null,
        emergency_contact_phone: null,
        main_position: 'Backend Engineer',
        is_active: true,
        role: 'candidate',
        role_id: 'role-2',
        created_at: '2026-04-05T09:00:00+07:00',
        activated_at: '2026-04-05T09:00:00+07:00',
        candidate_form_completion_status: 'in_progress',
      },
      {
        id: 'employee-internal-3',
        email: 'employee@example.com',
        username: 'employee',
        full_name: 'Employee Internal',
        phone: '08444',
        employee_code: 'EMP-003',
        employee_request_form_id: 'job-3',
        department_id: 'dep-3',
        master_designation_id: 'des-3',
        first_name: null,
        middle_name: null,
        last_name: null,
        emergency_contact_phone: null,
        main_position: 'QA Engineer',
        is_active: false,
        role: 'employee',
        role_id: 'role-3',
        created_at: '2026-04-06T08:00:00+07:00',
        activated_at: '2026-04-06T08:00:00+07:00',
        account_source: 'internal',
        candidate_form_completion_status: null,
      },
    ] as any

    const { default: Page } = await import('../UserManagementPage.vue')
    const wrapper = mount(Page, {
      props: {
        scope: 'candidateEmployee',
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Candidate List')
    expect(wrapper.text()).toContain('Candidate Internal')
    expect(wrapper.text()).toContain('Portal Candidate')
    expect(wrapper.text()).toContain('Employee Internal')

    const filterSelects = wrapper.findAll('select')
    await filterSelects[0]!.setValue('employee')
    expect(wrapper.text()).toContain('Employee Internal')
    expect(wrapper.text()).not.toContain('Candidate Internal')
    expect(wrapper.text()).not.toContain('Portal Candidate')

    await filterSelects[0]!.setValue('')
    await filterSelects[1]!.setValue('inactive')
    expect(wrapper.text()).toContain('Employee Internal')
    expect(wrapper.text()).not.toContain('Candidate Internal')

    await filterSelects[1]!.setValue('')
    await filterSelects[2]!.setValue('completed')
    expect(wrapper.text()).toContain('Candidate Internal')
    expect(wrapper.text()).not.toContain('Portal Candidate')
    expect(wrapper.text()).not.toContain('Employee Internal')
  })

  it('creates a user and shows the created account summary', async () => {
    const { default: Page } = await import('../UserManagementFormPage.vue')
    const wrapper = mount(Page)

    await flushPromises()
    await wrapper.get('input[type="email"]').setValue('new.user@example.com')
    await wrapper.get('input[placeholder="username"]').setValue('newuser')
    await wrapper.get('input[type="password"]').setValue('secret12')
    await wrapper.get('input[placeholder="Full name"]').setValue('New User')
    await wrapper.findAll('select')[0]!.setValue('role-1')
    await wrapper.findAll('select')[1]!.setValue('pt-1')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(createUserMock).toHaveBeenCalledWith({
      email: 'new.user@example.com',
      username: 'newuser',
      password: 'secret12',
      full_name: 'New User',
      phone: undefined,
      employee_code: undefined,
      contract_number: undefined,
      cost_center_pt_id: 'pt-1',
      employee_request_form_id: undefined,
      department_id: undefined,
      master_designation_id: undefined,
      main_position: undefined,
      role_id: 'role-1',
    })
    expect(toastSuccessMock).toHaveBeenCalledWith('Account created successfully.')
    expect(wrapper.text()).toContain('Account Created Successfully')
    expect(wrapper.text()).toContain('new.user@example.com')
  })

  it('lets admin switch create mode to candidate account', async () => {
    const { default: Page } = await import('../UserManagementFormPage.vue')
    const wrapper = mount(Page)

    await flushPromises()

    expect(wrapper.text()).toContain('User Account')
    expect(wrapper.text()).toContain('Candidate Account')
    expect(wrapper.find('input[placeholder="username"]').exists()).toBe(true)

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Candidate Account')!
      .trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Create Candidate Account')
    expect(wrapper.find('input[placeholder="username"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Bind ERF *')
    expect(wrapper.text()).toContain('Password (Optional)')
    expect(wrapper.text()).toContain(
      'Leave this blank to let the system generate a password automatically for the candidate account.',
    )
    expect(wrapper.text()).toContain('Backend Engineer')
    expect(wrapper.text()).not.toContain('Ops Coordinator')
    expect(wrapper.text()).not.toContain('QA Engineer')
    expect(wrapper.text()).not.toContain('Finance Analyst')
    expect(wrapper.get('form').attributes('autocomplete')).toBe('off')
    expect(wrapper.get('input[type="email"]').attributes('autocomplete')).toBe('off')
    expect(wrapper.get('input[type="password"]').attributes('autocomplete')).toBe('new-password')
  })

  it('creates a candidate account without manual password input', async () => {
    const { default: Page } = await import('../UserManagementFormPage.vue')
    const wrapper = mount(Page)

    await flushPromises()
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Candidate Account')!
      .trigger('click')
    await flushPromises()

    await wrapper.get('input[type="email"]').setValue('candidate.account@example.com')
    await wrapper.get('input[placeholder="Full name"]').setValue('Candidate Account')
    await wrapper.findAll('select')[1]!.setValue('job-1')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(createUserMock).toHaveBeenCalledWith({
      email: 'candidate.account@example.com',
      full_name: 'Candidate Account',
      phone: undefined,
      username: undefined,
      employee_code: undefined,
      contract_number: undefined,
      employee_request_form_id: 'job-1',
      department_id: 'dep-1',
      master_designation_id: 'des-1',
      main_position: 'Backend Engineer',
      role_id: 'role-2',
    })
    expect(wrapper.text()).toContain('Generated automatically by the system')
  })

  it('updates an existing user in edit mode', async () => {
    routeState.params = { id: 'managed-1' }
    setNuxtRouteMock(routeState)

    const { default: Page } = await import('../UserManagementFormPage.vue')
    const wrapper = mount(Page)

    await flushPromises()
    expect((wrapper.get('input[type="email"]').element as HTMLInputElement).value).toBe(
      'staff@example.com',
    )

    await wrapper.get('input[placeholder="Full name"]').setValue('Updated Staff User')
    await wrapper.findAll('select')[1]!.setValue('pt-1')
    await wrapper.get('input[type="password"]').setValue('updated123')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(updateUserMock).toHaveBeenCalledWith('managed-1', {
      email: 'staff@example.com',
      username: 'staff',
      full_name: 'Updated Staff User',
      phone: '08123',
      employee_code: 'EMP-001',
      contract_number: undefined,
      cost_center_pt_id: 'pt-1',
      employee_request_form_id: undefined,
      department_id: 'dep-1',
      master_designation_id: 'des-1',
      main_position: 'Recruiter',
      role_id: 'role-1',
      password: 'updated123',
    })
    expect(toastSuccessMock).toHaveBeenCalledWith('Account updated successfully.')
    expect(routerPushMock).toHaveBeenCalledWith('/user-management')
  })
})
