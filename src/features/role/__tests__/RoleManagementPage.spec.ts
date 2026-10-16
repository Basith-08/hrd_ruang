import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import {
  resetNuxtNavigationMocks,
  setNuxtRouterMock,
} from '../../../../test-utils/nuxt-imports-stub'
import type { Role } from '@/domain/entities/Role'

const routerPushMock = vi.fn()
const toastDeletedMock = vi.fn()
const toastErrorMock = vi.fn()
const confirmMock = vi.fn()

const refreshRolesMock = vi.fn()
const deleteRoleMock = vi.fn()

const rolesRef = ref<Role[]>([])
const loadingRef = ref(false)
const savingRef = ref(false)
const errorRef = ref('')

vi.mock('@/presentation/components/forms/SearchableSelect.vue', () => ({
  default: defineComponent({
    props: ['modelValue', 'options', 'disabled'],
    emits: ['update:modelValue'],
    template: `
      <select
        :value="modelValue ?? ''"
        :disabled="disabled"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option value="">All</option>
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

vi.mock('@/presentation/components/tables/TablePagination.vue', () => ({
  default: defineComponent({
    template: '<div data-testid="pagination">Pagination</div>',
  }),
}))

vi.mock('@/presentation/components/feedback/useAppToast', () => ({
  useAppToast: () => ({
    deleted: toastDeletedMock,
    error: toastErrorMock,
  }),
}))

vi.mock('@/presentation/components/feedback/useAppConfirm', () => ({
  useAppConfirm: () => ({
    confirm: confirmMock,
  }),
}))

vi.mock('@/viewmodels/useRoleManagementViewModel', () => ({
  useRoleManagementViewModel: () => ({
    roles: rolesRef,
    loading: loadingRef,
    saving: savingRef,
    error: errorRef,
    refreshRoles: refreshRolesMock,
    deleteRole: deleteRoleMock,
  }),
}))

function createRole(overrides: Partial<Role> = {}): Role {
  return {
    id: 'role-1',
    name: 'manager',
    description: 'Manages approvals',
    created_at: '2026-03-10T08:00:00',
    permissions: [
      { id: 'perm-1', name: 'approval:read', description: 'Read approvals', created_at: 'now' },
    ],
    ...overrides,
  }
}

describe('RoleManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetNuxtNavigationMocks()
    setNuxtRouterMock({ push: routerPushMock })

    rolesRef.value = [
      createRole(),
      createRole({
        id: 'role-2',
        name: 'guest',
        description: 'Read only',
        permissions: [],
      }),
    ]
    loadingRef.value = false
    savingRef.value = false
    errorRef.value = ''
    refreshRolesMock.mockResolvedValue(undefined)
    deleteRoleMock.mockResolvedValue(undefined)
    confirmMock.mockResolvedValue(true)
  })

  it('filters roles by search and permission presence, then refreshes the list', async () => {
    const { default: RoleManagementPage } = await import('../RoleManagementPage.vue')
    const wrapper = mount(RoleManagementPage)

    await wrapper.get('input[type="search"]').setValue('guest')
    const tableBody = wrapper.get('tbody')

    expect(tableBody.text()).toContain('guest')
    expect(tableBody.text()).not.toContain('manager')

    await wrapper.get('select').setValue('with')
    expect(wrapper.text()).toContain('No matching data found.')

    const refreshButton = wrapper.findAll('button').find((button) => button.text() === 'Refresh')
    await refreshButton!.trigger('click')

    expect(refreshRolesMock).toHaveBeenCalled()
  })

  it('navigates to create and edit pages, then deletes a role', async () => {
    const { default: RoleManagementPage } = await import('../RoleManagementPage.vue')
    const wrapper = mount(RoleManagementPage)

    const addRoleButton = wrapper.findAll('button').find((button) => button.text() === 'Add New Role')
    const editButton = wrapper.findAll('button').find((button) => button.text() === 'Edit Access')
    const deleteButton = wrapper.findAll('button').find((button) => button.text() === 'Delete')

    await addRoleButton!.trigger('click')
    await editButton!.trigger('click')
    await deleteButton!.trigger('click')
    await flushPromises()

    expect(routerPushMock).toHaveBeenCalledWith('/role-management/create')
    expect(routerPushMock).toHaveBeenCalledWith('/role-management/role-1/edit')
    expect(deleteRoleMock).toHaveBeenCalledWith('role-1')
    expect(toastDeletedMock).toHaveBeenCalledWith('Role')
  })
})
