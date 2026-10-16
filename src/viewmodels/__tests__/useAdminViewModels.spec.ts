import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

const getAllRolesMock = vi.fn()
const getAllPermissionsMock = vi.fn()
const createRoleUseCaseMock = vi.fn()
const updateRolePermissionsUseCaseMock = vi.fn()
const deleteRoleUseCaseMock = vi.fn()
const getAllUsersMock = vi.fn()
const getUserHistoryMock = vi.fn()
const createManagedUserMock = vi.fn()
const deleteManagedUserMock = vi.fn()
const updateManagedUserRoleMock = vi.fn()
const updateManagedUserMock = vi.fn()
const switchManagedUserToEmployeeMock = vi.fn()
const setManagedUserActiveStatusMock = vi.fn()

const authStoreMock = {
  userRole: 'manager',
  user: { id: 'user-1', permissions: ['old'] as string[] } as { id: string; permissions?: string[] } | null,
  fetchUserProfile: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  hasPermission: vi.fn(),
  hasAnyPermission: vi.fn(),
}

const customGroupRepoMock = {
  getAll: vi.fn(),
}

const masterDataRepoMock = {
  getAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

const userManagementRepoMock = {
  getRoles: vi.fn(),
}

const roleRepoMock = {}

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => authStoreMock,
}))

vi.mock('pinia', async () => {
  const actual = await vi.importActual<typeof import('pinia')>('pinia')
  return {
    ...actual,
    storeToRefs: (store: any) => ({
      error: ref(store.error),
      isAuthenticated: ref(store.isAuthenticated),
      isLoading: ref(store.isLoading),
      user: ref(store.user),
      userRole: ref(store.userRole),
    }),
  }
})

vi.mock('@/composables/useAppRepositories', () => ({
  useAppRepositories: () => ({
    roleRepo: roleRepoMock,
    userManagementRepo: userManagementRepoMock,
  }),
}))

vi.mock('@/infrastructure/supabase/repositories/CustomGroupRepositoryImpl', () => ({
  customGroupRepo: customGroupRepoMock,
}))

vi.mock('@/infrastructure/supabase/repositories/MasterDataRepositoryImpl', () => ({
  masterDataRepo: masterDataRepoMock,
}))

vi.mock('@/application/usecases/getAllRoles', () => ({
  getAllRoles: getAllRolesMock,
}))

vi.mock('@/application/usecases/getAllPermissions', () => ({
  getAllPermissions: getAllPermissionsMock,
}))

vi.mock('@/application/usecases/createRole', () => ({
  createRole: createRoleUseCaseMock,
}))

vi.mock('@/application/usecases/updateRolePermissions', () => ({
  updateRolePermissions: updateRolePermissionsUseCaseMock,
}))

vi.mock('@/application/usecases/deleteRole', () => ({
  deleteRole: deleteRoleUseCaseMock,
}))

vi.mock('@/application/usecases/getAllUsers', () => ({
  getAllUsers: getAllUsersMock,
}))

vi.mock('@/application/usecases/getUserHistory', () => ({
  getUserHistory: getUserHistoryMock,
}))

vi.mock('@/application/usecases/createManagedUser', () => ({
  createManagedUser: createManagedUserMock,
}))

vi.mock('@/application/usecases/deleteManagedUser', () => ({
  deleteManagedUser: deleteManagedUserMock,
}))

vi.mock('@/application/usecases/updateManagedUserRole', () => ({
  updateManagedUserRole: updateManagedUserRoleMock,
}))

vi.mock('@/application/usecases/updateManagedUser', () => ({
  updateManagedUser: updateManagedUserMock,
}))

vi.mock('@/application/usecases/setManagedUserActiveStatus', () => ({
  setManagedUserActiveStatus: setManagedUserActiveStatusMock,
}))

vi.mock('@/application/usecases/switchManagedUserToEmployee', () => ({
  switchManagedUserToEmployee: switchManagedUserToEmployeeMock,
}))

function mountComposable<T extends Record<string, unknown>>(useComposable: () => T) {
  const Harness = defineComponent({
    setup() {
      return useComposable()
    },
    template: '<div />',
  })

  return mount(Harness)
}

describe('admin and data viewmodels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStoreMock.userRole = 'manager'
    authStoreMock.user = { id: 'user-1', permissions: ['old'] }
    authStoreMock.fetchUserProfile.mockResolvedValue({ permissions: ['new'] })
    authStoreMock.login.mockResolvedValue({ id: 'user-1' })
    authStoreMock.logout.mockResolvedValue(undefined)
    authStoreMock.hasPermission.mockReturnValue(true)
    authStoreMock.hasAnyPermission.mockReturnValue(true)

    customGroupRepoMock.getAll.mockImplementation(async (index: number) => [{ id: `cg-${index}` }])

    masterDataRepoMock.getAll.mockImplementation(async (type: string) => [{ id: `${type}-1`, name: `${type}-a`, address: type === 'pt' ? 'Jakarta' : null }])
    masterDataRepoMock.create.mockResolvedValue({ id: 'created', name: 'Created', address: null })
    masterDataRepoMock.update.mockResolvedValue({ id: 'dep-1', name: 'Updated', address: null })
    masterDataRepoMock.delete.mockResolvedValue(undefined)

    getAllRolesMock.mockResolvedValue([{ id: 'role-1', name: 'manager' }])
    getAllPermissionsMock.mockResolvedValue([{ id: 'perm-1', name: 'user:read', created_at: 'now' }])
    createRoleUseCaseMock.mockResolvedValue({ id: 'role-2', name: 'manager' })
    updateRolePermissionsUseCaseMock.mockResolvedValue(undefined)
    deleteRoleUseCaseMock.mockResolvedValue(undefined)

    getAllUsersMock.mockResolvedValue([{ id: 'user-1' }])
    getUserHistoryMock.mockResolvedValue([{ id: 'history-1' }])
    userManagementRepoMock.getRoles.mockResolvedValue([{ id: 'role-1', name: 'Manager', description: null }])
    createManagedUserMock.mockResolvedValue(undefined)
    deleteManagedUserMock.mockResolvedValue(undefined)
    updateManagedUserRoleMock.mockResolvedValue(undefined)
    updateManagedUserMock.mockResolvedValue(undefined)
    switchManagedUserToEmployeeMock.mockResolvedValue({
      id: 'user-1',
      email: 'candidate@example.com',
      role: 'employee',
      is_active: true,
    })
    setManagedUserActiveStatusMock.mockResolvedValue(undefined)
  })

  it('useAuthViewModel proxies auth store state and methods', async () => {
    const { useAuthViewModel } = await import('../useAuthViewModel')
    const vm = useAuthViewModel()

    await vm.login({ identifier: 'a', password: 'b' })
    await vm.logout()

    expect(vm.hasPermission('user:read')).toBe(true)
    expect(vm.hasAnyPermission(['user:read'])).toBe(true)
    expect(authStoreMock.login).toHaveBeenCalled()
    expect(authStoreMock.logout).toHaveBeenCalled()
  })

  it('useCustomGroupViewModel refreshes one group and loads all groups', async () => {
    const { useCustomGroupViewModel } = await import('../useCustomGroupViewModel')
    const vm = useCustomGroupViewModel()

    await vm.refreshOptions(2)
    await vm.loadAllOptions()

    expect(vm.groupedOptions.value[2]).toEqual([{ id: 'cg-2' }])
    expect(vm.groupedOptions.value[6]).toEqual([{ id: 'cg-6' }])
  })

  it('useMasterDataViewModel refreshes, creates, updates, and removes options', async () => {
    const { useMasterDataViewModel } = await import('../useMasterDataViewModel')
    const vm = useMasterDataViewModel()

    await vm.refreshOptions('department')
    await vm.loadAllOptions()

    vm.optionsByType.value.department = [{ id: 'dep-1', name: 'Alpha' }] as any
    const created = await vm.create('department', { name: 'Created' })
    const updated = await vm.update('department', 'dep-1', { name: 'Updated' })
    await vm.remove('department', 'dep-1')

    expect(created).toMatchObject({ id: 'created', name: 'Created' })
    expect(updated).toMatchObject({ id: 'dep-1', name: 'Updated' })
    expect(masterDataRepoMock.delete).toHaveBeenCalledWith('department', 'dep-1')
  })

  it('useRoleManagementViewModel refreshes mounted data and handles role mutations', async () => {
    const { useRoleManagementViewModel } = await import('../useRoleManagementViewModel')
    const wrapper = mountComposable(useRoleManagementViewModel)

    await flushPromises()
    expect((wrapper.vm as any).roles).toEqual([{ id: 'role-1', name: 'manager' }])
    expect((wrapper.vm as any).permissions).toEqual([
      { id: 'perm-1', name: 'user:read', created_at: 'now' },
    ])

    authStoreMock.userRole = 'manager'
    await (wrapper.vm as any).createRole('manager', 'desc', ['perm-1'])
    expect(updateRolePermissionsUseCaseMock).toHaveBeenCalledWith(roleRepoMock, {
      role_id: 'role-2',
      permission_ids: ['perm-1'],
    })
    expect(authStoreMock.fetchUserProfile).toHaveBeenCalledWith('user-1')

    ;(wrapper.vm as any).roles = [{ id: 'role-1', name: 'manager' }]
    await (wrapper.vm as any).updateRole('role-1', 'manager', 'desc', ['perm-2'])
    expect(authStoreMock.user?.permissions).toEqual(['new'])

    await (wrapper.vm as any).deleteRole('role-1')
    expect(deleteRoleUseCaseMock).toHaveBeenCalledWith(roleRepoMock, 'role-1')
  })

  it('useUserManagementViewModel loads mounted data and handles all write flows', async () => {
    const { useUserManagementViewModel } = await import('../useUserManagementViewModel')
    const wrapper = mountComposable(useUserManagementViewModel)

    await flushPromises()
    expect((wrapper.vm as any).users).toEqual([{ id: 'user-1' }])
    expect((wrapper.vm as any).userHistory).toEqual([{ id: 'history-1' }])
    expect((wrapper.vm as any).roles).toEqual([
      { id: 'role-1', name: 'Manager', description: null },
    ])

    await (wrapper.vm as any).createUser({ email: 'new@x.com' })
    await (wrapper.vm as any).updateUser('user-1', { email: 'updated@x.com' })
    await (wrapper.vm as any).updateUserRole('user-1', 'role-1')
    await (wrapper.vm as any).switchToEmployee('user-1')
    await (wrapper.vm as any).setUserActiveStatus('user-1', false)
    await (wrapper.vm as any).deleteUser('user-1')

    expect(createManagedUserMock).toHaveBeenCalled()
    expect(updateManagedUserMock).toHaveBeenCalledWith(userManagementRepoMock, 'user-1', {
      email: 'updated@x.com',
    })
    expect(updateManagedUserRoleMock).toHaveBeenCalledWith(userManagementRepoMock, 'user-1', 'role-1')
    expect(switchManagedUserToEmployeeMock).toHaveBeenCalledWith(userManagementRepoMock, 'user-1')
    expect(setManagedUserActiveStatusMock).toHaveBeenCalledWith(userManagementRepoMock, 'user-1', false)
    expect(deleteManagedUserMock).toHaveBeenCalledWith(userManagementRepoMock, 'user-1')
  })

  it('useUserManagementViewModel forwards scope to the users loader', async () => {
    const { useUserManagementViewModel } = await import('../useUserManagementViewModel')
    const wrapper = mountComposable(() =>
      useUserManagementViewModel({
        autoLoadHistory: false,
        scope: 'candidateEmployee',
      }),
    )

    await flushPromises()
    expect(getAllUsersMock).toHaveBeenCalledWith(userManagementRepoMock, 'candidateEmployee')
    expect(userManagementRepoMock.getRoles).toHaveBeenCalledWith('candidateEmployee')
    expect((wrapper.vm as any).roles).toEqual([{ id: 'role-1', name: 'Manager', description: null }])
  })

  it('removes a switched candidate from user history immediately after switching to employee mode', async () => {
    getAllUsersMock.mockResolvedValue([{ id: 'candidate:user-1', is_active: true, role: 'employee' }])
    getUserHistoryMock.mockResolvedValue([{ id: 'candidate:user-1', is_active: false, role: 'candidate' }])
    switchManagedUserToEmployeeMock.mockResolvedValue({
      id: 'candidate:user-1',
      email: 'candidate@example.com',
      role: 'employee',
      is_active: true,
    })

    const { useUserManagementViewModel } = await import('../useUserManagementViewModel')
    const wrapper = mountComposable(useUserManagementViewModel)

    await flushPromises()
    await (wrapper.vm as any).switchToEmployee('candidate:user-1')

    expect((wrapper.vm as any).userHistory).toEqual([])
  })

  it('skips user history refresh for write flows when history is not loaded on the page', async () => {
    const { useUserManagementViewModel } = await import('../useUserManagementViewModel')
    const wrapper = mountComposable(() =>
      useUserManagementViewModel({
        autoLoadUsers: false,
        autoLoadRoles: false,
        autoLoadHistory: false,
      }),
    )

    await flushPromises()
    await (wrapper.vm as any).setUserActiveStatus('user-1', false)

    expect(setManagedUserActiveStatusMock).toHaveBeenCalledWith(userManagementRepoMock, 'user-1', false)
    expect(getAllUsersMock).toHaveBeenCalledTimes(1)
    expect(getUserHistoryMock).not.toHaveBeenCalled()
  })
})
