import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

import type { ApproverMaster } from '@/domain/entities/ApprovalChain'

const approversRef = ref<ApproverMaster[]>([])
const loadingRef = ref(false)
const savingRef = ref(false)
const errorRef = ref('')

const createMock = vi.fn()
const updateMock = vi.fn()
const refreshMock = vi.fn()
const removeMock = vi.fn()
const toastSuccessMock = vi.fn()
const toastErrorMock = vi.fn()
const routerPushMock = vi.fn()
const routerBackMock = vi.fn()

const employeeRows = [
  {
    id: 'profile-1',
    full_name: 'Approver One',
    username: 'approver1',
    email: 'approver1@example.com',
    main_position: 'Manager',
    master_designation_ref: { name: 'Manager' },
  },
  {
    id: 'profile-2',
    full_name: 'Approver Two',
    username: 'approver2',
    email: 'approver2@example.com',
    main_position: 'Director',
    master_designation_ref: { name: 'Director' },
  },
  {
    id: 'profile-3',
    full_name: 'Approver Three',
    username: 'approver3',
    email: 'approver3@example.com',
    main_position: 'GM HRD',
    master_designation_ref: { name: 'Manager' },
  },
]

const designationRows = [
  { id: 'designation-1', name: 'Staff' },
  { id: 'designation-2', name: 'Supervisor' },
  { id: 'designation-3', name: 'Manager' },
  { id: 'designation-4', name: 'Director' },
]

vi.mock('#imports', () => ({
  useRouter: () => ({
    push: routerPushMock,
    back: routerBackMock,
  }),
}))

vi.mock('@/viewmodels/useApproverMasterViewModel', () => ({
  useApproverMasterViewModel: () => ({
    approvers: approversRef,
    loading: loadingRef,
    saving: savingRef,
    error: errorRef,
    create: createMock,
    update: updateMock,
    refresh: refreshMock,
    remove: removeMock,
  }),
}))

vi.mock('@/presentation/components/feedback/useAppToast', () => ({
  useAppToast: () => ({
    success: toastSuccessMock,
    error: toastErrorMock,
  }),
}))

vi.mock('@/presentation/components/forms/SearchableSelect.vue', () => ({
  default: defineComponent({
    props: {
      modelValue: {
        type: String,
        default: '',
      },
      options: {
        type: Array,
        default: () => [],
      },
    },
    emits: ['update:modelValue'],
    template: `
      <select
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option value="">Select</option>
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

vi.mock('@/infrastructure/supabase/client', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        order: () => {
          if (table === 'profiles') {
            return Promise.resolve({ data: employeeRows, error: null })
          }

          if (table === 'master_designation') {
            return Promise.resolve({ data: designationRows, error: null })
          }

          return Promise.resolve({ data: [], error: null })
        },
      }),
    }),
  },
}))

function createApprover(
  id: string,
  approvalFlowKey: string,
  stepOrder: number,
  profileId: string,
  approvalRoleKey: string,
  approvalRoleLabel: string,
): ApproverMaster {
  return {
    id,
    profile_id: profileId,
    step_order: stepOrder,
    approval_flow_key: approvalFlowKey,
    approval_role_key: approvalRoleKey,
    approval_role_label: approvalRoleLabel,
    created_by: 'user-1',
    created_at: '2026-06-02T09:00:00',
    employee: {
      email: `${profileId}@example.com`,
      full_name: approvalRoleLabel,
      phone: null,
      username: profileId,
    },
  }
}

describe('ApproverMasterFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    approversRef.value = [
      createApprover(
        'a1',
        'designations:designation-1',
        1,
        'profile-1',
        'manager_approval',
        'Manager BU',
      ),
      createApprover(
        'a2',
        'designations:designation-1',
        2,
        'profile-2',
        'director_approval',
        'Director BU',
      ),
      createApprover(
        'a3',
        'designations:designation-1',
        3,
        'profile-3',
        'manager_hcdr_approval',
        'Manager HRD',
      ),
      createApprover(
        'a4',
        'designations:designation-2',
        1,
        'profile-1',
        'manager_approval',
        'Manager BU',
      ),
      createApprover(
        'a5',
        'designations:designation-2',
        2,
        'profile-2',
        'director_approval',
        'Director BU',
      ),
      createApprover(
        'a6',
        'designations:designation-2',
        3,
        'profile-3',
        'gm_hcd_approval',
        'GM HRD',
      ),
      createApprover('a7', 'designations:designation-3', 1, 'profile-1', 'gm_approval', 'GM'),
      createApprover(
        'a8',
        'designations:designation-3',
        2,
        'profile-2',
        'director_approval',
        'Director',
      ),
      createApprover(
        'a9',
        'designations:designation-3',
        3,
        'profile-3',
        'director_hcd_approval',
        'Director HRD',
      ),
      createApprover(
        'a10',
        'designations:designation-4',
        1,
        'profile-1',
        'director_approval',
        'Director',
      ),
      createApprover(
        'a11',
        'designations:designation-4',
        2,
        'profile-2',
        'deputy_ceo_approval',
        'Deputy CEO',
      ),
      createApprover(
        'a12',
        'designations:designation-4',
        3,
        'profile-3',
        'deputy_ceo_hcd_approval',
        'Deputy CEO HRD',
      ),
    ]
    loadingRef.value = false
    savingRef.value = false
    errorRef.value = ''

    createMock.mockResolvedValue(undefined)
    updateMock.mockResolvedValue(undefined)
    refreshMock.mockResolvedValue(undefined)
    removeMock.mockResolvedValue(undefined)
  })

  it('renders cancel before the primary save action and keeps footer right aligned', async () => {
    const { default: Page } = await import('../ApproverMasterFormPage.vue')
    const wrapper = mount(Page)

    await flushPromises()

    const footer = wrapper.get('.sticky.bottom-4')
    const buttons = footer.findAll('button')

    expect(footer.classes()).toContain('justify-end')
    expect(buttons[0]?.text()).toBe('Cancel')
    expect(buttons[1]?.text()).toContain('Save All Configuration')
  })

  it('navigates back when cancel is clicked', async () => {
    const { default: Page } = await import('../ApproverMasterFormPage.vue')
    const wrapper = mount(Page)

    await flushPromises()
    await wrapper.get('.sticky.bottom-4 button').trigger('click')

    expect(routerBackMock).toHaveBeenCalled()
  })

  it('submits valid configuration and redirects after save', async () => {
    const { default: Page } = await import('../ApproverMasterFormPage.vue')
    const wrapper = mount(Page)

    await flushPromises()
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(updateMock).toHaveBeenCalled()
    expect(refreshMock).toHaveBeenCalled()
    expect(toastSuccessMock).toHaveBeenCalledWith('Configuration updated successfully.')
    expect(routerPushMock).toHaveBeenCalledWith('/approver-master')
    expect(toastErrorMock).not.toHaveBeenCalled()
  })
})
