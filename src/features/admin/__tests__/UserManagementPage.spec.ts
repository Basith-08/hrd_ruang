import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { mount } from '@vue/test-utils'

import type { ManagedUser } from '@/domain/entities/ManagedUser'

const usersRef = ref<ManagedUser[]>([])
const rolesRef = ref<Array<{ id: string; name: string }>>([])
const loadingRef = ref(false)
const savingRef = ref(false)
const errorRef = ref('')

const refreshUsersMock = vi.fn()
const deleteUserMock = vi.fn()
const updateUserRoleMock = vi.fn()
const switchToEmployeeMock = vi.fn()
const setUserActiveStatusMock = vi.fn()
const getCandidateFormByIdMock = vi.fn()
const hasAnyPermissionMock = vi.fn(() => true)
const hasPermissionMock = vi.fn(() => true)

vi.mock('#imports', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('@/composables/useLocale', () => ({
  useLocale: () => ({
    text: (key: string) => key,
  }),
}))

vi.mock('@/viewmodels/useUserManagementViewModel', () => ({
  useUserManagementViewModel: () => ({
    users: usersRef,
    roles: rolesRef,
    loading: loadingRef,
    saving: savingRef,
    error: errorRef,
    refreshUsers: refreshUsersMock,
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

vi.mock('@/viewmodels/useAuthViewModel', () => ({
  useAuthViewModel: () => ({
    hasAnyPermission: hasAnyPermissionMock,
    hasPermission: hasPermissionMock,
    userRole: ref('super_admin'),
    user: ref({ id: 'admin-1' }),
  }),
}))

vi.mock('@/presentation/components/forms/SearchableSelect.vue', () => ({
  default: defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<select :value="modelValue ?? \'\'" @change="$emit(\'update:modelValue\', $event.target.value)"><option value="">All</option></select>',
  }),
}))

vi.mock('@/presentation/components/buttons/AppActionButton.vue', () => ({
  default: defineComponent({
    props: ['label'],
    emits: ['click'],
    template: '<button type="button" @click="$emit(\'click\')">{{ label }}</button>',
  }),
}))

vi.mock('@/presentation/components/feedback/AppAlert.vue', () => ({
  default: defineComponent({
    props: ['message'],
    template: '<div v-if="message">{{ message }}</div>',
  }),
}))

vi.mock('@/presentation/components/feedback/AppLoadingOverlay.vue', () => ({
  default: defineComponent({
    template: '<div data-testid="loading-overlay" />',
  }),
}))

vi.mock('@/presentation/components/feedback/useAppToast', () => ({
  useAppToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

vi.mock('@/presentation/components/feedback/useAppConfirm', () => ({
  useAppConfirm: () => ({
    confirm: vi.fn(),
  }),
}))

vi.mock('@/presentation/components/forms/AppSearchInput.vue', () => ({
  default: defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  }),
}))

vi.mock('@/features/admin/components/CandidateEmployeeTable.vue', () => ({
  default: defineComponent({
    props: ['items'],
    emits: ['update:page', 'sort'],
    template: `
      <div>
        <button type="button" data-testid="sort-name" @click="$emit('sort', 'name')">Sort</button>
        <div v-for="item in items" :key="item.id" data-testid="user-name">{{ item.full_name }}</div>
      </div>
    `,
  }),
}))

vi.mock('@/presentation/components/tables/AppTable.vue', () => ({
  default: defineComponent({
    template: '<div />',
  }),
}))

vi.mock('@/presentation/components/tables/TablePagination.vue', () => ({
  default: defineComponent({
    template: '<div />',
  }),
}))

vi.mock('@/presentation/components/menus/RowActionsMenu.vue', () => ({
  default: defineComponent({
    template: '<div />',
  }),
}))

function createUser(overrides: Partial<ManagedUser> = {}): ManagedUser {
  return {
    id: 'user-1',
    full_name: 'Zeta User',
    first_name: 'Zeta',
    middle_name: null,
    last_name: 'User',
    email: 'zeta@example.com',
    username: 'zeta',
    phone: '08123',
    department: 'Engineering',
    department_id: null,
    designation: 'Staff',
    master_designation_id: null,
    main_position: 'Engineer',
    role: 'candidate',
    is_active: true,
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z',
    account_source: 'local',
    candidate_form_completion_status: 'completed',
    employee_request_form_id: null,
    ...overrides,
  } as ManagedUser
}

describe('UserManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usersRef.value = [
      createUser(),
      createUser({
        id: 'user-2',
        full_name: 'Alpha User',
        first_name: 'Alpha',
        email: 'alpha@example.com',
      }),
    ]
    rolesRef.value = []
    loadingRef.value = false
    savingRef.value = false
    errorRef.value = ''
    refreshUsersMock.mockResolvedValue(undefined)
  })

  it('sorts candidate employee names on /candidate-employees', async () => {
    const { default: UserManagementPage } = await import('../UserManagementPage.vue')
    const wrapper = mount(UserManagementPage, {
      props: {
        scope: 'candidateEmployee',
      },
    })

    const names = () => wrapper.findAll('[data-testid="user-name"]').map((node) => node.text())

    expect(names()).toEqual(['Zeta User', 'Alpha User'])

    await wrapper.get('[data-testid="sort-name"]').trigger('click')
    expect(names()).toEqual(['Alpha User', 'Zeta User'])
  })
})
