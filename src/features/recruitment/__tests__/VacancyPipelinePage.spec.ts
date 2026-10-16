import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

import type { EmployeeRequestForm } from '@/domain/entities/EmployeeRequestForm'

const callBackendApiMock = vi.fn()
const refreshMock = vi.fn()
const getByIdMock = vi.fn()
const hasPermissionMock = vi.fn()
const jobsRef = ref<EmployeeRequestForm[]>([])
const loadingRef = ref(false)
const errorRef = ref('')
const storageCreateSignedUrlMock = vi.fn()
const supabaseStorageFromMock = vi.fn()

vi.mock('@/viewmodels/useAuthViewModel', () => ({
  useAuthViewModel: () => ({
    hasPermission: hasPermissionMock,
  }),
}))

vi.mock('@/infrastructure/http/backendApi', () => ({
  callBackendApi: callBackendApiMock,
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

vi.mock('@/viewmodels/useEmployeeRequestFormViewModel', () => ({
  useEmployeeRequestFormViewModel: () => ({
    jobs: jobsRef,
    loading: loadingRef,
    error: errorRef,
    refresh: refreshMock,
    getById: getByIdMock,
  }),
}))

vi.mock('@/presentation/components/tables/TablePagination.vue', () => ({
  default: defineComponent({
    props: {
      page: {
        type: Number,
        default: 1,
      },
      totalItems: {
        type: Number,
        default: 0,
      },
    },
    template: '<div data-testid="pagination">Page {{ page }} / {{ totalItems }}</div>',
  }),
}))

function createJob(overrides: Partial<EmployeeRequestForm> = {}): EmployeeRequestForm {
  return {
    id: 'erf-1',
    pt_pembebanan: 'PT One',
    business_unit: '1. ICT',
    department: 'Engineering',
    designation: 'Senior',
    employment_status: 'Contract',
    direct_manager: 'Manager One',
    approval_director_bu: 'Director One',
    approval_director_bu_date: '2026-04-01',
    approval_gm_hrd: 'GM HR',
    approval_gm_hrd_date: '2026-04-02',
    approval_director_hrd: 'Director HR',
    approval_director_hrd_date: '2026-04-03',
    site: 'Jakarta',
    working_location: 'Jakarta',
    requested_date: '2026-04-01',
    custom_grup_1_id: null,
    custom_grup_2_id: null,
    custom_grup_3_id: null,
    custom_grup_4_id: null,
    custom_grup_5_id: null,
    custom_grup_6_id: null,
    required_date: '2026-04-10',
    position_status: 'Replacement',
    periode_probation: null,
    main_position: 'Backend Engineer',
    recruiter_user_id: 'recruiter-1',
    recruiter_name: 'Recruiter One',
    passed_candidate_name: 'Jane Candidate',
    passed_candidate_interview_date: '2026-04-11',
    vacancy_status: 'interview',
    vacancy_candidate_count: 3,
    vacancy_interview_scheduled_count: 1,
    created_by: 'user-1',
    status: 'open',
    closed_date: null,
    closed_category: null,
    reason: null,
    created_at: '2026-04-01T08:00:00Z',
    updated_at: '2026-04-01T08:00:00Z',
    ...overrides,
  }
}

describe('VacancyPipelinePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    hasPermissionMock.mockImplementation((permission: string) =>
      [
        'employee_request_form:read',
        'recruitment:vacancy_pipeline',
        'recruitment:vacancy_pipeline_detail',
      ].includes(permission),
    )
    jobsRef.value = [
      createJob(),
      createJob({
        id: 'erf-2',
        department: 'Finance',
        main_position: 'Finance Analyst',
        required_date: '2026-03-18',
        passed_candidate_name: 'Budi Candidate',
        status: 'closed',
        closed_date: '2026-03-20',
      }),
    ]
    loadingRef.value = false
    errorRef.value = ''
    refreshMock.mockResolvedValue(undefined)
    getByIdMock.mockResolvedValue(createJob({
      direct_manager: 'Manager One - Engineering',
      approval_steps: [
        {
          step_order: 1,
          approval_role_label: 'Director',
          approver_name: 'Hari Jo',
          approved_at: '2026-04-01T09:00:00Z',
          status: 'approved',
        },
        {
          step_order: 2,
          approval_role_label: 'GM HRD',
          approver_name: 'Gira Ta',
          approved_at: '2026-04-02T09:00:00Z',
          status: 'approved',
        },
        {
          step_order: 3,
          approval_role_label: 'Director HRD',
          approver_name: null,
          approved_at: null,
          status: 'pending',
        },
      ],
      organizational_structure: [],
      job_description: [],
    }))
    callBackendApiMock.mockResolvedValue({
      candidates: [
        {
          id: 'candidate-1',
          full_name: 'Jane Candidate',
          email: 'jane@example.com',
          interview_dates: ['2026-04-11'],
        },
        {
          id: 'candidate-2',
          full_name: 'Budi Candidate',
          email: 'budi@example.com',
          interview_dates: [],
        },
      ],
    })
    storageCreateSignedUrlMock.mockResolvedValue({
      data: { signedUrl: 'https://example.com/file.pdf' },
      error: null,
    })
    supabaseStorageFromMock.mockReturnValue({
      createSignedUrl: storageCreateSignedUrlMock,
    })
  })

  it('shows only active jobs and keeps the all filter focused on active data', async () => {
    const { default: VacancyPipelinePage } = await import('../VacancyPipelinePage.vue')
    const wrapper = mount(VacancyPipelinePage)

    await flushPromises()

    const headerCells = wrapper.findAll('thead th').map((cell) => cell.text().trim())

    expect(headerCells[1]).toContain('Main Position')
    expect(headerCells[2]).toContain('BU Category')
    expect(headerCells[3]).toContain('BU Department')
    expect(headerCells[4]).toContain('Official Request')

    expect(wrapper.text()).toContain('Backend Engineer')
    expect(wrapper.text()).toContain('1. ICT')
    expect(wrapper.text()).not.toContain('Finance Analyst')
    expect(wrapper.findAll('input[type="date"]')).toHaveLength(0)

    await wrapper.get('input[type="search"]').setValue('finance')
    expect(wrapper.text()).not.toContain('Backend Engineer')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'All')!
      .trigger('click')

    expect((wrapper.get('input[type="search"]').element as HTMLInputElement).value).toBe('')
    expect(wrapper.text()).toContain('Backend Engineer')
    expect(wrapper.text()).not.toContain('Finance Analyst')
  })

  it('shows only closed jobs on closed vacancy mode', async () => {
    hasPermissionMock.mockImplementation((permission: string) =>
      ['recruitment:closed_vacancy', 'recruitment:closed_vacancy_detail'].includes(permission),
    )

    const { default: VacancyPipelinePage } = await import('../VacancyPipelinePage.vue')
    const wrapper = mount(VacancyPipelinePage, {
      props: {
        statusMode: 'closed',
      },
    })

    await flushPromises()

    const headerCells = wrapper.findAll('thead th').map((cell) => cell.text().trim())

    expect(wrapper.text()).toContain('Closed Vacancy')
    expect(wrapper.text()).toContain('Finance Analyst')
    expect(wrapper.text()).not.toContain('Backend Engineer')
    expect(headerCells[1]).toContain('Main Position')
    expect(headerCells[2]).toContain('BU Category')
    expect(headerCells[3]).toContain('BU Department')
    expect(headerCells[4]).toContain('Official Request')
  })

  it('filters closed vacancy by closed date period', async () => {
    hasPermissionMock.mockImplementation((permission: string) =>
      ['recruitment:closed_vacancy', 'recruitment:closed_vacancy_detail'].includes(permission),
    )

    jobsRef.value = [
      createJob({
        id: 'erf-2',
        department: 'Finance',
        main_position: 'Finance Analyst',
        status: 'closed',
        closed_date: '2026-03-20',
      }),
      createJob({
        id: 'erf-3',
        department: 'Operations',
        main_position: 'Ops Supervisor',
        status: 'closed',
        closed_date: '2026-04-22',
      }),
    ]

    const { default: VacancyPipelinePage } = await import('../VacancyPipelinePage.vue')
    const wrapper = mount(VacancyPipelinePage, {
      props: {
        statusMode: 'closed',
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Finance Analyst')
    expect(wrapper.text()).toContain('Ops Supervisor')

    const dateInputs = wrapper.findAll('input[type="date"]')
    await dateInputs[0]!.setValue('2026-04-01')
    await dateInputs[1]!.setValue('2026-04-30')

    expect(wrapper.text()).not.toContain('Finance Analyst')
    expect(wrapper.text()).toContain('Ops Supervisor')
  })

  it('shows dynamic approval detail correctly in closed vacancy mode', async () => {
    hasPermissionMock.mockImplementation((permission: string) =>
      ['recruitment:closed_vacancy', 'recruitment:closed_vacancy_detail'].includes(permission),
    )

    const { default: VacancyPipelinePage } = await import('../VacancyPipelinePage.vue')
    const wrapper = mount(VacancyPipelinePage, {
      props: {
        statusMode: 'closed',
      },
    })

    await flushPromises()

    const detailButton = wrapper.findAll('button').find((button) => button.text() === 'Detail')
    expect(detailButton).toBeTruthy()

    await detailButton!.trigger('click')
    await flushPromises()

    expect(getByIdMock).toHaveBeenCalledWith('erf-2')
    expect(wrapper.text()).toContain('Approval Detail')
    expect(wrapper.text()).toContain('Director')
    expect(wrapper.text()).toContain('Hari Jo')
    expect(wrapper.text()).toContain('GM HRD')
    expect(wrapper.text()).toContain('Gira Ta')
    expect(wrapper.text()).toContain('Recruiter')
    expect(wrapper.text()).toContain('Recruiter One')
  })

  it('opens the detail modal and shows pipeline candidates with interview date', async () => {
    const { default: VacancyPipelinePage } = await import('../VacancyPipelinePage.vue')
    const wrapper = mount(VacancyPipelinePage)

    await flushPromises()

    const detailButton = wrapper.findAll('button').find((button) => button.text() === 'Detail')
    expect(detailButton).toBeTruthy()

    await detailButton!.trigger('click')
    await flushPromises()

    expect(getByIdMock).toHaveBeenCalledWith('erf-1')
    expect(callBackendApiMock).toHaveBeenCalledWith('/api/employee-request-forms/erf-1/pipeline-candidates')
    expect(wrapper.text()).toContain('Approval Detail')
    expect(wrapper.text()).toContain('Director')
    expect(wrapper.text()).toContain('Hari Jo')
    expect(wrapper.text()).toContain('Gira Ta')
    expect(wrapper.text()).toContain('All Candidates')
    expect(wrapper.text()).toContain('Jane Candidate')
    expect(wrapper.text()).toContain('Budi Candidate')
    expect(wrapper.text()).toContain('2026-04-11')
    expect(wrapper.text()).toContain('Selected Candidate')
    expect(wrapper.text()).toContain('Recruiter One')
  })

  it('hides detail action without page-specific detail permission', async () => {
    hasPermissionMock.mockImplementation((permission: string) =>
      ['employee_request_form:read', 'recruitment:vacancy_pipeline'].includes(permission),
    )

    const { default: VacancyPipelinePage } = await import('../VacancyPipelinePage.vue')
    const wrapper = mount(VacancyPipelinePage)

    await flushPromises()

    expect(wrapper.findAll('button').some((button) => button.text() === 'Detail')).toBe(false)
  })
})
