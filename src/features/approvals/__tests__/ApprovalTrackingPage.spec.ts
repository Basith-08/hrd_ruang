import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import type { ApprovalChain } from '@/domain/entities/ApprovalChain'

const chainsRef = ref<ApprovalChain[]>([])
const loadingRef = ref(false)
const savingRef = ref(false)
const errorRef = ref('')
const userRef = ref<{ email?: string } | null>({
  email: 'approver@company.com',
})
const userRoleRef = ref('manager')
const hasPermissionMock = vi.fn(() => true)
const hasAnyPermissionMock = vi.fn(() => true)

const refreshChainsMock = vi.fn()
const approveAssignedStepMock = vi.fn()
const rejectAssignedStepMock = vi.fn()
const toastSuccessMock = vi.fn()
const toastErrorMock = vi.fn()
const storageCreateSignedUrlMock = vi.fn()
const supabaseStorageFromMock = vi.fn()
const callBackendApiMock = vi.fn()

vi.mock('@/viewmodels/useApprovalViewModel', () => ({
  useApprovalViewModel: () => ({
    chains: chainsRef,
    loading: loadingRef,
    saving: savingRef,
    error: errorRef,
    refreshChains: refreshChainsMock,
    approveAssignedStep: approveAssignedStepMock,
    rejectAssignedStep: rejectAssignedStepMock,
  }),
}))

vi.mock('@/viewmodels/useAuthViewModel', () => ({
  useAuthViewModel: () => ({
    user: userRef,
    userRole: userRoleRef,
    hasPermission: hasPermissionMock,
    hasAnyPermission: hasAnyPermissionMock,
  }),
}))

vi.mock('@/infrastructure/http/backendApi', () => ({
  callBackendApi: callBackendApiMock,
}))

vi.mock('@/presentation/components/feedback/useAppToast', () => ({
  useAppToast: () => ({
    success: toastSuccessMock,
    error: toastErrorMock,
  }),
}))

vi.mock('@/infrastructure/runtime/publicConfig', () => ({
  getPublicAppConfig: () => ({
    erfDocumentBucket: 'erf',
  }),
}))

vi.mock('@/infrastructure/supabase/client', () => ({
  supabase: {
    storage: {
      from: supabaseStorageFromMock,
    },
  },
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
        data-testid="status-filter"
        :value="modelValue"
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

vi.mock('@/presentation/components/tables/TablePagination.vue', () => ({
  default: defineComponent({
    props: {
      page: {
        type: Number,
        default: 1,
      },
      pageSize: {
        type: Number,
        default: 5,
      },
      totalItems: {
        type: Number,
        default: 0,
      },
    },
    emits: ['update:page'],
    template: '<div data-testid="pagination">Page {{ page }} / {{ totalItems }}</div>',
  }),
}))

function createChain(overrides: Partial<ApprovalChain> = {}): ApprovalChain {
  return {
    id: 'chain-1',
    employee_request_form_id: 'erf-1',
    created_by: 'user-1',
    status: 'pending',
    created_at: '2026-03-20T10:00:00',
    updated_at: '2026-03-20T10:00:00',
    steps: [
      {
        id: 'step-1',
        chain_id: 'chain-1',
        step_order: 1,
        approver_email: 'approver@company.com',
        approver_name: 'Approver One',
        status: 'pending',
        approved_at: null,
        notes: null,
        created_at: '2026-03-20T10:00:00',
      },
      {
        id: 'step-2',
        chain_id: 'chain-1',
        step_order: 2,
        approver_email: 'gm@company.com',
        approver_name: 'GM HRD',
        status: 'pending',
        approved_at: null,
        notes: null,
        created_at: '2026-03-20T10:05:00',
      },
    ],
    employee_request_form: {
      id: 'erf-1',
      created_at: '2026-03-20T10:00:00',
      requested_date: '2026-03-20',
      main_position: 'Backend Engineer',
      department: 'Engineering',
      designation: 'Senior',
      site: 'Jakarta HQ',
      employment_status: 'Permanent',
      direct_manager: 'Lead Manager - ENG',
      pt_pembebanan: 'PT One',
      working_location: 'Jakarta',
      required_date: '2026-04-01',
      position_status: 'open',
      periode_probation: 3,
      custom_grup_1: null,
      custom_grup_2: null,
      custom_grup_3: null,
      custom_grup_4: null,
      custom_grup_5: null,
      custom_grup_6: null,
      approval_director_bu: null,
      approval_director_bu_date: null,
      approval_gm_hrd: null,
      approval_gm_hrd_date: null,
      approval_director_hrd: null,
      approval_director_hrd_date: null,
      status: 'open',
      closed_category: null,
      vacancy_status: null,
      organizational_structure: [],
      job_description: [],
    },
    ...overrides,
  }
}

function findButtonByExactText(wrapper: ReturnType<typeof mount>, text: string) {
  return wrapper.findAll('button').find((button) => button.text().trim() === text)
}

describe('ApprovalTrackingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chainsRef.value = [
      createChain(),
      createChain({
        id: 'chain-2',
        employee_request_form_id: 'erf-2',
        status: 'approved',
        steps: [
          {
            id: 'step-3',
            chain_id: 'chain-2',
            step_order: 1,
            approver_email: 'director@company.com',
            approver_name: 'Director',
            status: 'approved',
            approved_at: '2026-03-21T10:00:00',
            notes: 'Approved',
            created_at: '2026-03-20T10:00:00',
          },
        ],
        employee_request_form: {
          ...createChain().employee_request_form!,
          id: 'erf-2',
          main_position: 'HR Specialist',
          department: 'People',
          site: 'Bandung',
        },
      }),
    ]
    loadingRef.value = false
    savingRef.value = false
    errorRef.value = ''
    userRef.value = { email: 'approver@company.com' }
    userRoleRef.value = 'manager'
    hasPermissionMock.mockReturnValue(true)
    hasAnyPermissionMock.mockReturnValue(true)
    refreshChainsMock.mockResolvedValue(undefined)
    approveAssignedStepMock.mockResolvedValue(undefined)
    rejectAssignedStepMock.mockResolvedValue(undefined)
    storageCreateSignedUrlMock.mockResolvedValue({
      data: { signedUrl: 'https://example.com/file.pdf' },
      error: null,
    })
    callBackendApiMock.mockResolvedValue({
      recruitment_flow_stages: [],
      vacancy_statuses: [],
    })
    supabaseStorageFromMock.mockReturnValue({
      createSignedUrl: storageCreateSignedUrlMock,
    })
  })

  it('filters chains by search query and selected status', async () => {
    const { default: ApprovalTrackingPage } = await import('../ApprovalTrackingPage.vue')
    const wrapper = mount(ApprovalTrackingPage)

    await wrapper.get('input[type="search"]').setValue('bandung')
    expect(wrapper.text()).toContain('HR Specialist')
    expect(wrapper.text()).not.toContain('Backend Engineer')

    await wrapper.get('[data-testid="status-filter"]').setValue('pending')
    expect(wrapper.text()).toContain('No matching data found.')
    expect(wrapper.text()).not.toContain('HR Specialist')
  })

  it('does not request lightweight recruitment statuses when the user lacks ERF read permissions', async () => {
    hasAnyPermissionMock.mockReturnValue(false)

    const { default: ApprovalTrackingPage } = await import('../ApprovalTrackingPage.vue')
    mount(ApprovalTrackingPage)

    await flushPromises()

    expect(callBackendApiMock).not.toHaveBeenCalled()
  })

  it('expands tracking stages, opens step detail, and approves the selected step', async () => {
    chainsRef.value = [
      createChain({
        employee_request_form: {
          ...createChain().employee_request_form!,
          custom_grup_1: 'Custom Group Alpha',
          custom_grup_2: 'Custom Group Beta',
        },
      }),
    ]

    const { default: ApprovalTrackingPage } = await import('../ApprovalTrackingPage.vue')
    const wrapper = mount(ApprovalTrackingPage)

    const firstRow = wrapper.findAll('tbody tr')[0]
    await firstRow!.trigger('click')

    expect(wrapper.text()).toContain('Step 1 | Approver One | Step 1')

    const stageButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Waiting for'))

    expect(stageButton).toBeTruthy()

    await stageButton!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Approval Detail')
    expect(wrapper.text()).toContain('Step 1 | Approver One | Step 1')
    expect(wrapper.text()).toContain('This request is ready for your Approval.')
    expect(wrapper.text()).toContain('No files uploaded.')
    expect(wrapper.text()).not.toContain('Custom Group 1')
    expect(wrapper.text()).not.toContain('Custom Group Alpha')
    expect(wrapper.text()).not.toContain('Custom Group Beta')

    await wrapper.get('textarea').setValue('Looks good')
    await findButtonByExactText(wrapper, 'Approve')!.trigger('click')

    await flushPromises()

    expect(approveAssignedStepMock).toHaveBeenCalledWith('step-1', 'Looks good')
    expect(
      callBackendApiMock.mock.calls.filter(
        (call) => call[0] === '/api/employee-request-forms/list-statuses',
      ).length,
    ).toBeGreaterThanOrEqual(2)
    expect(toastSuccessMock).toHaveBeenCalledWith('Approval recorded successfully.')
    expect(wrapper.text()).not.toContain('Approval Detail')
  })

  it('shows the administrator notice and blocks approval actions for admins', async () => {
    userRoleRef.value = 'super_admin'
    userRef.value = { email: 'admin@company.com' }

    const { default: ApprovalTrackingPage } = await import('../ApprovalTrackingPage.vue')
    const wrapper = mount(ApprovalTrackingPage)

    const firstRow = wrapper.findAll('tbody tr')[0]
    await firstRow!.trigger('click')

    const stageButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Waiting for'))

    expect(stageButton).toBeTruthy()

    await stageButton!.trigger('click')

    expect(wrapper.text()).toContain('Administrator accounts can review all approval tracking data')
    expect(findButtonByExactText(wrapper, 'Approve')).toBeUndefined()
    expect(findButtonByExactText(wrapper, 'Reject')).toBeUndefined()
  })

  it('stops later approval stages from becoming current after a rejection', async () => {
    chainsRef.value = [
      createChain({
        status: 'pending',
        steps: [
          {
            id: 'step-1',
            chain_id: 'chain-1',
            step_order: 1,
            approver_email: 'approver@company.com',
            approver_name: 'BU Director',
            status: 'approved',
            approved_at: '2026-03-20T10:10:00',
            notes: 'Approved',
            created_at: '2026-03-20T10:00:00',
          },
          {
            id: 'step-2',
            chain_id: 'chain-1',
            step_order: 2,
            approver_email: 'gm@company.com',
            approver_name: 'GM HRD',
            status: 'rejected',
            approved_at: '2026-03-20T10:20:00',
            notes: 'Rejected',
            created_at: '2026-03-20T10:05:00',
          },
          {
            id: 'step-3',
            chain_id: 'chain-1',
            step_order: 3,
            approver_email: 'hrd@company.com',
            approver_name: 'HR Director',
            status: 'pending',
            approved_at: null,
            notes: null,
            created_at: '2026-03-20T10:10:00',
          },
        ],
      }),
    ]

    const { default: ApprovalTrackingPage } = await import('../ApprovalTrackingPage.vue')
    const wrapper = mount(ApprovalTrackingPage)

    const firstRow = wrapper.findAll('tbody tr')[0]
    await firstRow!.trigger('click')

    expect(wrapper.text()).toContain('Request Rejected')
    expect(wrapper.text()).not.toContain('Current')
    expect(wrapper.text()).toContain('Not Reached')
  })

  it('prefers the latest approval chain recruitment stage when lightweight status data is absent', async () => {
    chainsRef.value = [
      createChain({
        steps: [
          {
            id: 'step-1',
            chain_id: 'chain-1',
            step_order: 1,
            approver_email: 'approver@company.com',
            approver_name: 'BU Director',
            status: 'approved',
            approved_at: '2026-03-20T10:10:00',
            notes: 'Approved',
            created_at: '2026-03-20T10:00:00',
          },
          {
            id: 'step-2',
            chain_id: 'chain-1',
            step_order: 2,
            approver_email: 'gm@company.com',
            approver_name: 'GM HRD',
            status: 'pending',
            approved_at: null,
            notes: null,
            created_at: '2026-03-20T10:05:00',
          },
        ],
        employee_request_form: {
          ...createChain().employee_request_form!,
          recruitment_flow_stage: 'approval_in_progress',
        },
      }),
    ]

    const { default: ApprovalTrackingPage } = await import('../ApprovalTrackingPage.vue')
    const wrapper = mount(ApprovalTrackingPage)

    await flushPromises()

    expect(wrapper.text()).toContain('2. Approval In Progress')
  })

  it('prefers the latest lightweight recruitment status after approval is completed', async () => {
    chainsRef.value = [
      createChain({
        status: 'approved',
        steps: [
          {
            id: 'step-1',
            chain_id: 'chain-1',
            step_order: 1,
            approver_email: 'approver@company.com',
            approver_name: 'BU Director',
            status: 'approved',
            approved_at: '2026-03-20T10:10:00',
            notes: 'Approved',
            created_at: '2026-03-20T10:00:00',
          },
        ],
        employee_request_form: {
          ...createChain().employee_request_form!,
          recruitment_flow_stage: 'erf_approved',
          approval_director_bu_date: '2026-03-20T10:10:00',
          approval_gm_hrd_date: '2026-03-20T10:20:00',
          approval_director_hrd_date: '2026-03-20T10:30:00',
        },
      }),
    ]
    callBackendApiMock.mockResolvedValue({
      recruitment_flow_stages: [],
      vacancy_statuses: [
        {
          employee_request_form_id: 'erf-1',
          status: 'sourcing',
        },
      ],
    })

    const { default: ApprovalTrackingPage } = await import('../ApprovalTrackingPage.vue')
    const wrapper = mount(ApprovalTrackingPage)

    await flushPromises()

    expect(wrapper.text()).toContain('6. Candidate Sourcing')
    expect(wrapper.text()).not.toContain('4. ERF Approved')
  })

  it('uses the latest global recruitment status for the approval status column', async () => {
    chainsRef.value = [
      createChain({
        status: 'pending',
        employee_request_form: {
          ...createChain().employee_request_form!,
          recruitment_flow_stage: 'approval_in_progress',
        },
      }),
    ]
    callBackendApiMock.mockResolvedValue({
      recruitment_flow_stages: [
        {
          employee_request_form_id: 'erf-1',
          stage: 'assign_recruiter',
        },
      ],
      vacancy_statuses: [
        {
          employee_request_form_id: 'erf-1',
          status: 'request',
        },
      ],
    })

    const { default: ApprovalTrackingPage } = await import('../ApprovalTrackingPage.vue')
    const wrapper = mount(ApprovalTrackingPage)

    await flushPromises()

    expect(wrapper.text()).toContain('5. Assign Recruiter')
    expect(wrapper.text()).not.toContain('2. Approval In Progress')
  })

  it('does not flash stale approval status before the latest global status is loaded', async () => {
    chainsRef.value = [
      createChain({
        status: 'pending',
        employee_request_form: {
          ...createChain().employee_request_form!,
          recruitment_flow_stage: 'approval_in_progress',
        },
      }),
    ]

    type StatusPayload = {
      recruitment_flow_stages: Array<{
        employee_request_form_id: string
        stage: 'assign_recruiter'
      }>
      vacancy_statuses: Array<{
        employee_request_form_id: string
        status: 'request'
      }>
    }
    let resolveStatuses: (value: StatusPayload) => void = () => undefined

    callBackendApiMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveStatuses = resolve
        }),
    )

    const { default: ApprovalTrackingPage } = await import('../ApprovalTrackingPage.vue')
    const wrapper = mount(ApprovalTrackingPage)

    await flushPromises()

    expect(wrapper.text()).not.toContain('2. Approval In Progress')
    expect(wrapper.text()).toContain('Loading')

    resolveStatuses({
      recruitment_flow_stages: [
        {
          employee_request_form_id: 'erf-1',
          stage: 'assign_recruiter',
        },
      ],
      vacancy_statuses: [
        {
          employee_request_form_id: 'erf-1',
          status: 'request',
        },
      ],
    })

    await flushPromises()

    expect(wrapper.text()).toContain('5. Assign Recruiter')
    expect(wrapper.text()).not.toContain('2. Approval In Progress')
  })

  it('does not keep stale approval_in_progress status after chain is fully approved', async () => {
    chainsRef.value = [
      createChain({
        status: 'approved',
        steps: [
          {
            id: 'step-1',
            chain_id: 'chain-1',
            step_order: 1,
            approver_email: 'approver@company.com',
            approver_name: 'BU Director',
            status: 'approved',
            approved_at: '2026-03-20T10:10:00',
            notes: 'Approved',
            created_at: '2026-03-20T10:00:00',
          },
          {
            id: 'step-2',
            chain_id: 'chain-1',
            step_order: 2,
            approver_email: 'gm@company.com',
            approver_name: 'GM HRD',
            status: 'approved',
            approved_at: '2026-03-20T10:20:00',
            notes: 'Approved',
            created_at: '2026-03-20T10:05:00',
          },
          {
            id: 'step-3',
            chain_id: 'chain-1',
            step_order: 3,
            approver_email: 'director@company.com',
            approver_name: 'Director HRD',
            status: 'approved',
            approved_at: '2026-03-20T10:30:00',
            notes: 'Approved',
            created_at: '2026-03-20T10:10:00',
          },
        ],
        employee_request_form: {
          ...createChain().employee_request_form!,
          recruitment_flow_stage: 'approval_in_progress',
        },
      }),
    ]
    callBackendApiMock.mockResolvedValue({
      recruitment_flow_stages: [],
      vacancy_statuses: [],
    })

    const { default: ApprovalTrackingPage } = await import('../ApprovalTrackingPage.vue')
    const wrapper = mount(ApprovalTrackingPage)

    await flushPromises()

    expect(wrapper.text()).toContain('4. ERF Approved')
    expect(wrapper.text()).not.toContain('2. Approval In Progress')
  })

  it('shows ERF attachments in approval detail when files exist', async () => {
    chainsRef.value = [
      createChain({
        employee_request_form: {
          ...createChain().employee_request_form!,
          organizational_structure: [
            'employee-request-forms/user-1/organizational_structure/org-chart.pdf',
          ],
          job_description: ['employee-request-forms/user-1/job_description/job-desc.pdf'],
        },
      }),
    ]

    storageCreateSignedUrlMock
      .mockResolvedValueOnce({
        data: { signedUrl: 'https://example.com/org-chart.pdf' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { signedUrl: 'https://example.com/job-desc.pdf' },
        error: null,
      })

    const { default: ApprovalTrackingPage } = await import('../ApprovalTrackingPage.vue')
    const wrapper = mount(ApprovalTrackingPage)

    const firstRow = wrapper.findAll('tbody tr')[0]
    await firstRow!.trigger('click')

    const stageButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Waiting for'))

    expect(stageButton).toBeTruthy()

    await stageButton!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Organizational Structure.pdf')
    expect(wrapper.text()).toContain('Job Description.pdf')
    expect(wrapper.text()).not.toContain('No files uploaded.')
    expect(supabaseStorageFromMock).toHaveBeenCalledWith('erf')
    expect(storageCreateSignedUrlMock).toHaveBeenCalledWith(
      'employee-request-forms/user-1/organizational_structure/org-chart.pdf',
      60 * 60,
    )
    expect(storageCreateSignedUrlMock).toHaveBeenCalledWith(
      'employee-request-forms/user-1/job_description/job-desc.pdf',
      60 * 60,
    )
  })
})
