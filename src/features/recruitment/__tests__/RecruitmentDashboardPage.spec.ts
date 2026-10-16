import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import type { RecruitmentTracking } from '@/domain/entities/RecruitmentTracking'

const trackingsRef = ref<RecruitmentTracking[]>([])
const loadingRef = ref(false)
const errorRef = ref('')
type MockMasterDataOption = { id: string; name: string; parent_name?: string | null }
const optionsByTypeRef = ref({
  pt: [] as MockMasterDataOption[],
  bu: [] as MockMasterDataOption[],
  department: [] as MockMasterDataOption[],
  job_level: [] as MockMasterDataOption[],
  designation: [] as MockMasterDataOption[],
})
const masterDataErrorRef = ref<string | null>(null)
const mountedWrappers: VueWrapper[] = []

const refetchTrackingsQueryMock = vi.fn()
const refetchMasterDataQueryMock = vi.fn()
const callBackendApiMock = vi.fn()
const toastSuccessMock = vi.fn()
const toastErrorMock = vi.fn()
const jsonToSheetMock = vi.fn((_rows: Array<Record<string, unknown>>) => ({ A1: {} }))
const bookNewMock = vi.fn(() => ({}))
const bookAppendSheetMock = vi.fn()
const writeFileMock = vi.fn()

vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn((options: { queryKey: unknown[] }) => {
    if (options.queryKey.includes('trackings')) {
      return {
        data: trackingsRef,
        error: errorRef,
        isFetching: loadingRef,
        refetch: refetchTrackingsQueryMock,
      }
    }

    return {
      data: optionsByTypeRef,
      error: masterDataErrorRef,
      isFetching: ref(false),
      refetch: refetchMasterDataQueryMock,
    }
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

vi.mock('xlsx-js-style', () => ({
  utils: {
    json_to_sheet: jsonToSheetMock,
    book_new: bookNewMock,
    book_append_sheet: bookAppendSheetMock,
  },
  writeFile: writeFileMock,
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
        default: 10,
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

function createTracking(overrides: Partial<RecruitmentTracking> = {}): RecruitmentTracking {
  return {
    id: 'tracking-1',
    employee_request_form_id: 'erf-1',
    chain_id: 'chain-1',
    created_at: '2026-03-10T09:00:00',
    updated_at: '2026-03-10T09:00:00',
    employee_request_form: {
      id: 'erf-1',
      requested_date: '2026-03-10',
      pt_pembebanan: 'PT One',
      business_unit: '1. ICT',
      department: 'Engineering',
      designation: 'Junior',
      job_level: 'Junior',
      main_position: 'Backend Engineer',
      recruiter_name: 'Recruiter One',
      site: 'Jakarta',
      working_location: 'Jakarta',
      employment_status: 'Permanent',
      direct_manager: 'Lead Manager - Engineering',
      position_status: 'Replacement',
      required_date: '2026-04-01',
      status: 'open',
      closed_date: null,
      custom_grup_1: null,
      custom_grup_2: null,
      custom_grup_3: null,
      custom_grup_4: null,
      custom_grup_5: null,
      custom_grup_6: null,
      approval_director_bu: null,
      approval_director_bu_date: '2026-03-08',
      approval_gm_hrd: null,
      approval_gm_hrd_date: '2026-03-09',
      approval_director_hrd: null,
      approval_director_hrd_date: '2026-03-10',
    },
    ...overrides,
  }
}

async function mountPage() {
  const { default: RecruitmentDashboardPage } = await import('../RecruitmentDashboardPage.vue')
  const wrapper = mount(RecruitmentDashboardPage)
  mountedWrappers.push(wrapper)
  return wrapper
}

describe('RecruitmentDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-30T10:00:00+07:00'))

    trackingsRef.value = [
      createTracking(),
      createTracking({
        id: 'erf-2',
        employee_request_form_id: 'erf-2',
        chain_id: null,
        created_at: '2026-02-12T09:00:00',
        employee_request_form: {
          ...createTracking().employee_request_form!,
          id: 'erf-2',
          requested_date: '2026-02-12',
          department: 'Finance',
          designation: 'Senior',
          job_level: 'Senior',
          main_position: 'Finance Analyst',
          recruiter_name: 'Recruiter Two',
          site: 'Bandung',
          employment_status: 'Contract',
          status: 'closed',
          closed_date: '2026-03-20',
          candidate_name: 'Jane Candidate',
          required_date: '2026-04-05',
          approval_director_hrd_date: '2026-03-15',
        },
      }),
      createTracking({
        id: 'tracking-3',
        employee_request_form_id: 'erf-3',
        created_at: '2026-02-10T09:00:00',
        employee_request_form: {
          ...createTracking().employee_request_form!,
          id: 'erf-3',
          requested_date: '2026-02-10',
          department: 'Engineering',
          main_position: 'Frontend Engineer',
          status: 'open',
        },
      }),
    ]

    optionsByTypeRef.value = {
      pt: [],
      bu: [],
      department: [
        { id: 'dep-1', name: 'Engineering' },
        { id: 'dep-2', name: 'Finance' },
      ],
      job_level: [
        { id: 'lvl-1', name: 'Junior' },
        { id: 'lvl-2', name: 'Senior' },
      ],
      designation: [
        { id: 'lvl-1', name: 'Junior' },
        { id: 'lvl-2', name: 'Senior' },
      ],
    }

    loadingRef.value = false
    errorRef.value = ''
    masterDataErrorRef.value = null
    refetchTrackingsQueryMock.mockResolvedValue(undefined)
    refetchMasterDataQueryMock.mockResolvedValue(undefined)
    callBackendApiMock.mockResolvedValue({ passed_candidates: [] })
    toastSuccessMock.mockImplementation(() => {})
    toastErrorMock.mockImplementation(() => {})
    jsonToSheetMock.mockReturnValue({ A1: {} })
    bookNewMock.mockReturnValue({})
    bookAppendSheetMock.mockImplementation(() => {})
    writeFileMock.mockImplementation(() => {})
  })

  afterEach(() => {
    while (mountedWrappers.length > 0) {
      mountedWrappers.pop()?.unmount()
    }
    vi.useRealTimers()
  })

  it('renders open mode as the default dashboard state from cached queries', async () => {
    const wrapper = await mountPage()

    await flushPromises()

    expect(wrapper.text()).toContain('Open Position')
    expect(wrapper.text()).toContain('Monthly ERF Overview')
    expect(wrapper.text()).toContain('Recruiter Ownership')
    expect(wrapper.text()).toContain('Recruiter One')
    expect(wrapper.text()).not.toContain('Unrecruiter')
    expect(wrapper.text()).toContain('Engineering')
    expect(wrapper.text()).toContain('Backend Engineer')
    expect(wrapper.text()).toContain('ERF Approved')
    expect(wrapper.text()).toContain('Candidate Sourcing')
    expect(wrapper.text()).toContain('Interview Evaluation Completed')
    expect(wrapper.text()).toContain('Hiring Completed')
    expect(wrapper.text()).not.toContain('Position Summary Table')
    expect(wrapper.text()).not.toContain('Candidate Name')
    expect(wrapper.text()).toContain('BU Category')
    expect(wrapper.text()).toContain('Official Request')
    expect(wrapper.findAll('input[type="date"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('Current Month')
    expect(wrapper.text()).toContain('Open')

    const detailTable = wrapper.findAll('tbody')[0]!
    expect(detailTable.text()).toContain('Backend Engineer')
    expect(detailTable.text()).toContain('20 days')
    expect(detailTable.text()).toContain('1. ICT')
    expect(detailTable.text()).not.toContain('Finance Analyst')
  })

  it('shows loading overlay while dashboard data is loading', async () => {
    loadingRef.value = true

    const wrapper = await mountPage()

    await flushPromises()

    expect(wrapper.text()).toContain('Loading...')
  })

  it('applies search to the open detail table and still supports closed mode', async () => {
    const wrapper = await mountPage()

    await wrapper.findAll('input[type="search"]')[0]!.setValue('finance')
    await flushPromises()

    const detailTable = wrapper.findAll('tbody')[0]!
    expect(detailTable.text()).not.toContain('Finance Analyst')
    expect(detailTable.text()).not.toContain('Backend Engineer')

    await wrapper.get('select').setValue('closed')
    await flushPromises()

    expect(wrapper.text()).toContain('Closed Position')
    expect(detailTable.text()).toContain('Finance Analyst')
    expect(wrapper.text()).not.toContain('Closed Date')
    expect(wrapper.text()).toContain('36 day')
  })

  it('keeps detail column order aligned with the new dashboard layout', async () => {
    const wrapper = await mountPage()

    await wrapper.get('select').setValue('closed')
    await flushPromises()

    const headerCells = wrapper.findAll('thead th').map((cell) => cell.text().trim())
    expect(headerCells.some((text) => text.includes('Main Position'))).toBe(true)
    expect(headerCells.some((text) => text.includes('BU Category'))).toBe(true)
    expect(headerCells.some((text) => text.includes('Official Request'))).toBe(true)
    expect(headerCells.some((text) => text.includes('Recruiter'))).toBe(true)
    expect(headerCells.some((text) => text.includes('Final Employee'))).toBe(true)
    expect(headerCells.some((text) => text.includes('Notes'))).toBe(true)

    const detailRowCells = wrapper.findAll('tbody')[0]!.findAll('tr')[0]!.findAll('td')
    expect(detailRowCells[1]!.text()).toBe('Finance Analyst')
    expect(detailRowCells[2]!.text()).toContain('1. ICT')
    expect(detailRowCells[2]!.text()).toContain('Finance')
    expect(detailRowCells[3]!.text()).toContain('Replacement')
    expect(detailRowCells[5]!.text()).toContain('Recruiter')
    expect(detailRowCells[9]!.text()).toContain('Jane Candidate')
  })

  it('keeps the reduced pipeline stages visible even when dashboard status is closed', async () => {
    const wrapper = await mountPage()

    await wrapper.get('select').setValue('closed')
    await flushPromises()

    expect(wrapper.text()).not.toContain('Total ERF Requested')
    expect(wrapper.text()).not.toContain('Approval In Progress')
    expect(wrapper.text()).not.toContain('Assign Recruiter')
    expect(wrapper.text()).not.toContain('Candidate Form In Progress')
    expect(wrapper.text()).not.toContain('Interview Scheduled')
    expect(wrapper.text()).not.toContain('Interview Evaluation In Progress')
    expect(wrapper.text()).not.toContain('Employee Form In Progress')
    expect(wrapper.text()).not.toContain('Employee Contract Form In Progress')
    expect(wrapper.text()).toContain('ERF Approved')
    expect(wrapper.text()).toContain('Hiring Completed')
  })

  it('counts recruitment funnel rows by current stage instead of cumulative totals', async () => {
    trackingsRef.value = [
      createTracking({
        id: 'stage-approved',
        employee_request_form_id: 'stage-approved',
        employee_request_form: {
          ...createTracking().employee_request_form!,
          id: 'stage-approved',
          recruitment_flow_stage: 'erf_approved',
        },
      }),
      createTracking({
        id: 'stage-sourcing',
        employee_request_form_id: 'stage-sourcing',
        employee_request_form: {
          ...createTracking().employee_request_form!,
          id: 'stage-sourcing',
          recruitment_flow_stage: 'candidate_sourcing',
        },
      }),
      createTracking({
        id: 'stage-evaluation',
        employee_request_form_id: 'stage-evaluation',
        employee_request_form: {
          ...createTracking().employee_request_form!,
          id: 'stage-evaluation',
          recruitment_flow_stage: 'interview_evaluation_completed',
        },
      }),
    ]

    const wrapper = await mountPage()
    await flushPromises()

    const funnelButtons = wrapper
      .findAll('button')
      .filter((button) =>
        [
          'ERF Approved',
          'Candidate Sourcing',
          'Interview Evaluation Completed',
          'Hiring Completed',
        ].some((label) => button.text().includes(label)),
      )

    expect(funnelButtons.map((button) => button.text())).toEqual([
      'ERF Approved1',
      'Candidate Sourcing1',
      'Interview Evaluation Completed1',
      'Hiring Completed0',
    ])
  })

  it('keeps legacy detail columns after days open until today in open detail rows except candidate name', async () => {
    trackingsRef.value = [
      createTracking({
        employee_request_form: {
          ...createTracking().employee_request_form!,
          candidate_name: 'Budi Candidate',
        },
      }),
    ]

    const wrapper = await mountPage()
    await flushPromises()

    const detailRowCells = wrapper.findAll('tbody')[0]!.findAll('tr')[0]!.findAll('td')
    expect(wrapper.text()).not.toContain('Candidate Name')
    expect(wrapper.text()).toContain('In Progress')
    expect(wrapper.text()).not.toContain('Filled 0')
    expect(detailRowCells[1]!.text()).toBe('Backend Engineer')
    expect(detailRowCells[6]!.text()).toContain('Permanent')
  })

  it('does not calculate open days when last approval date is missing', async () => {
    trackingsRef.value = [
      createTracking({
        employee_request_form: {
          ...createTracking().employee_request_form!,
          approval_director_bu_date: null,
          approval_gm_hrd_date: null,
          approval_director_hrd_date: null,
        },
      }),
    ]

    const wrapper = await mountPage()
    await flushPromises()

    const detailRowCells = wrapper.findAll('tbody')[0]!.findAll('tr')[0]!.findAll('td')
    expect(detailRowCells[4]!.text()).toContain('-')
    expect(detailRowCells[5]!.text()).toContain('Recruiter')
  })

  it('refreshes data sources and resets the period to the current month', async () => {
    const wrapper = await mountPage()

    await wrapper.get('select').setValue('closed')

    const dateInputs = wrapper.findAll('input[type="date"]')
    await dateInputs[0]!.setValue('2026-01-01')
    await dateInputs[1]!.setValue('2026-01-31')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Current Month')!
      .trigger('click')

    expect((dateInputs[0]!.element as HTMLInputElement).value).toBe('2026-03-01')
    expect((dateInputs[1]!.element as HTMLInputElement).value).toBe('2026-03-31')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Refresh')!
      .trigger('click')

    await flushPromises()

    expect(refetchTrackingsQueryMock).toHaveBeenCalled()
    expect(refetchMasterDataQueryMock).toHaveBeenCalled()
  })

  it('applies the from/to filter to the detail table', async () => {
    const wrapper = await mountPage()
    await flushPromises()

    const dateInputs = wrapper.findAll('input[type="date"]')
    await dateInputs[0]!.setValue('2026-03-01')
    await dateInputs[1]!.setValue('2026-03-31')
    await flushPromises()

    const detailTable = wrapper.findAll('tbody')[0]!
    expect(detailTable.text()).toContain('Backend Engineer')
    expect(detailTable.text()).not.toContain('Finance Analyst')
    expect(detailTable.text()).not.toContain('Frontend Engineer')
  })

  it('loads passed candidate names immediately when all mode includes closed rows', async () => {
    trackingsRef.value = [
      createTracking({
        id: 'erf-closed',
        employee_request_form_id: 'erf-closed',
        employee_request_form: {
          ...createTracking().employee_request_form!,
          id: 'erf-closed',
          status: 'closed',
          closed_date: '2026-03-20',
          candidate_name: null,
        },
      }),
    ]
    callBackendApiMock.mockResolvedValue({
      passed_candidates: [
        {
          employee_request_form_id: 'erf-closed',
          full_name: 'Jane Candidate',
          email: null,
        },
      ],
    })

    const wrapper = await mountPage()
    await wrapper.get('select').setValue('all')

    await flushPromises()

    expect(callBackendApiMock).toHaveBeenCalledWith(
      '/api/employee-request-forms/passed-candidates',
      {
        method: 'POST',
        body: JSON.stringify({
          employee_request_form_ids: ['erf-closed'],
        }),
      },
    )
    expect(wrapper.text()).toContain('Backend Engineer')
  })

  it('filters detail rows when a department row is clicked and toggles the filter when clicked again', async () => {
    const wrapper = await mountPage()
    await flushPromises()

    await wrapper.get('select').setValue('all')
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Grouped')!
      .trigger('click')

    const financeDepartmentButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Finance'))

    expect(financeDepartmentButton).toBeTruthy()

    await financeDepartmentButton!.trigger('click')
    await flushPromises()

    const detailTable = wrapper.findAll('tbody')[0]!
    expect(detailTable.text()).toContain('Finance Analyst')
    expect(detailTable.text()).not.toContain('Backend Engineer')

    await financeDepartmentButton!.trigger('click')
    await flushPromises()

    expect(detailTable.text()).toContain('Backend Engineer')
    expect(detailTable.text()).toContain('Finance Analyst')
  })

  it('updates top bu departments when a funnel stage is clicked without filtering detail rows', async () => {
    trackingsRef.value = [
      createTracking({
        id: 'approved-1',
        employee_request_form_id: 'approved-1',
        employee_request_form: {
          ...createTracking().employee_request_form!,
          id: 'approved-1',
          department: 'Finance',
          main_position: 'Finance Analyst',
          recruiter_name: '',
          approval_director_hrd_date: '2026-03-12',
        },
      }),
      createTracking({
        id: 'approved-2',
        employee_request_form_id: 'approved-2',
        employee_request_form: {
          ...createTracking().employee_request_form!,
          id: 'approved-2',
          department: 'Engineering',
          main_position: 'Backend Engineer',
          recruiter_name: 'Recruiter One',
          approval_director_hrd_date: '2026-03-12',
        },
      }),
    ]

    const wrapper = await mountPage()
    await flushPromises()

    const approvedStageButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('ERF Approved'))

    expect(approvedStageButton).toBeTruthy()

    await approvedStageButton!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Funnel Stage: ERF Approved')
    expect(wrapper.text()).toContain('Finance')

    const detailTable = wrapper.findAll('tbody')[0]!

    expect(detailTable.text()).toContain('Finance Analyst')
    expect(detailTable.text()).toContain('Backend Engineer')
  })

  it('uses canonical master labels for bu department filter without duplicating normalized labels', async () => {
    optionsByTypeRef.value = {
      ...optionsByTypeRef.value,
      department: [
        { id: 'dep-1', name: '01. Finance' },
        { id: 'dep-2', name: '30. PAG' },
      ],
    }
    trackingsRef.value = [
      createTracking({
        id: 'tracking-pag',
        employee_request_form_id: 'erf-pag',
        employee_request_form: {
          ...createTracking().employee_request_form!,
          id: 'erf-pag',
          department: 'PAG',
          main_position: 'Procurement Admin',
        },
      }),
      createTracking({
        id: 'tracking-fin',
        employee_request_form_id: 'erf-fin',
        employee_request_form: {
          ...createTracking().employee_request_form!,
          id: 'erf-fin',
          department: 'Finance',
          main_position: 'Finance Analyst',
        },
      }),
    ]

    const wrapper = await mountPage()
    await flushPromises()

    const textInputs = wrapper.findAll('input[type="text"]')
    await textInputs[0]!.trigger('focus')
    await flushPromises()

    expect(wrapper.text()).toContain('30. PAG')
    expect(wrapper.text()).not.toContain('\nPAG\n')

    await wrapper
      .findAll('li')
      .find((item) => item.text() === '30. PAG')!
      .trigger('click')
    await flushPromises()

    const detailTable = wrapper.findAll('tbody')[0]!
    expect(detailTable.text()).toContain('Procurement Admin')
    expect(detailTable.text()).not.toContain('Finance Analyst')
  })

  it('toggles detail sorting when a column header is clicked', async () => {
    const wrapper = await mountPage()

    await wrapper.get('select').setValue('closed')

    const positionSortButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Position') && button.text().includes('↑↓'))

    expect(positionSortButton).toBeTruthy()

    await positionSortButton!.trigger('click')

    const detailRows = wrapper.findAll('tbody')[0]!.findAll('tr')
    expect(detailRows[0]!.text()).toContain('Finance Analyst')
  })

  it('shows days open to close even when a closed ERF has no approval dates', async () => {
    trackingsRef.value = [
      createTracking({
        id: 'erf-4',
        employee_request_form_id: 'erf-4',
        chain_id: null,
        created_at: '2026-02-05T09:00:00',
        employee_request_form: {
          ...createTracking().employee_request_form!,
          id: 'erf-4',
          requested_date: '2026-02-05',
          department: 'Human Capital',
          designation: 'Staff',
          job_level: 'Staff',
          main_position: 'HR Staff',
          employment_status: 'Daily',
          status: 'closed',
          closed_date: '2026-03-22',
          required_date: '2026-05-29',
          approval_director_bu_date: null,
          approval_gm_hrd_date: null,
          approval_director_hrd_date: null,
        },
      }),
    ]

    const wrapper = await mountPage()

    await wrapper.get('select').setValue('closed')

    const detailTable = wrapper.findAll('tbody')[0]!

    expect(detailTable.text()).toContain('HR Staff')
    expect(detailTable.text()).toContain('45 days')
    expect(detailTable.text()).toContain('-')
  })

  it('exports closed position rows with candidate details', async () => {
    callBackendApiMock.mockImplementation((path: string) => {
      if (path === '/api/employee-request-forms/export-candidates') {
        return Promise.resolve({
          candidates: [
            {
              employee_request_form_id: 'erf-2',
              candidate_id: 'candidate-1',
              full_name: 'Jane Candidate',
              email: 'jane@example.com',
              phone_number: '08123456789',
              date_of_birth: '1998-07-21',
              place_of_birth: 'Bandung',
              gender: 'Female',
              marital_status: 'Single',
              nationality: 'Indonesia',
              religion: 'Islam',
              id_no: '3273012107980001',
              id_card_address: 'Jl. KTP No. 1',
              residential_address: 'Jl. Domisili No. 2',
              available_start_date: '2026-04-15',
              notice_period: '30 days',
              latest_education: 'Sarjana (S1) - ITB - Informatika',
              latest_work_history: 'Software Engineer - PT Maju',
              candidate_form_completion_status: 'completed',
            },
          ],
          candidate_forms: [
            {
              id: 'form-1',
              employee_request_form_id: 'erf-2',
              candidate_id: 'candidate-1',
              completion_status: 'completed',
              photograph: null,
              date_application: '2026-03-01',
              notice_period: '30 days',
              full_name: 'Jane Candidate',
              hire_location: 'Bandung',
              date_of_birth: '1998-07-21',
              place_of_birth: 'Bandung',
              nationality: 'Indonesia',
              marital_status: 'Single',
              religion: 'Islam',
              gender: 'Female',
              ethnic: null,
              blood_type: null,
              id_card_address: 'Jl. KTP No. 1',
              residential_address: 'Jl. Domisili No. 2',
              personal_email: 'jane@example.com',
              instagram: null,
              linkedin: null,
              phone_number: '08123456789',
              home_phone: null,
              id_type: 'KTP',
              id_no: '3273012107980001',
              available_start_date: '2026-04-15',
              join_date: null,
              transportation_type: null,
              transportation_ownership: null,
              residence_ownership: null,
              created_at: '2026-03-01T00:00:00',
              updated_at: '2026-03-10T00:00:00',
              employee_request_form: {
                id: 'erf-2',
                pt_name: 'PT One',
                department: 'Finance',
                main_position: 'Finance Analyst',
                site: 'Bandung',
              },
              family_and_emergency: [],
              education: [
                {
                  id: 'edu-1',
                  candidate_form_id: 'form-1',
                  level: 'Sarjana (S1)',
                  institution: 'ITB',
                  city: 'Bandung',
                  major: 'Informatika',
                  from_year: 2014,
                  to_year: 2018,
                  category: 'Formal Education',
                  description: null,
                },
              ],
              work_history: [
                {
                  id: 'work-1',
                  candidate_form_id: 'form-1',
                  company: 'PT Maju',
                  position: 'Software Engineer',
                  from_year: 2021,
                  to_year: 2025,
                  reason_to_quitting: null,
                  last_salary: null,
                  benefit: null,
                  description: null,
                  company_address: null,
                  company_phone: null,
                  direct_superior_title: null,
                  organization_structure: null,
                },
              ],
              candidate_languages: [],
              candidate_skills: [],
              candidate_references: [],
              personal_statement: null,
              employee_payroll_profile: null,
              employee_documents: {},
            },
          ],
        })
      }

      return Promise.resolve({ passed_candidates: [] })
    })

    const wrapper = await mountPage()

    await wrapper.get('select').setValue('closed')
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Export Excel')!
      .trigger('click')
    await flushPromises()

    expect(callBackendApiMock).toHaveBeenCalledWith(
      '/api/employee-request-forms/export-candidates',
      {
        method: 'POST',
        body: JSON.stringify({
          employee_request_form_ids: ['erf-2'],
        }),
      },
    )
    expect(jsonToSheetMock).toHaveBeenCalledWith([
      expect.objectContaining({
        No: 1,
        'Main Position': 'Finance Analyst',
        'BU Category / Department': '1. ICT',
        'BU Department': 'Finance',
        'Official Request': '2026-03-15',
      }),
    ])
    const exportRows = jsonToSheetMock.mock.calls[0]?.[0] as unknown as Array<
      Record<string, unknown>
    >
    expect(exportRows[0]!).toHaveProperty('Final Employee', 'Jane Candidate')
    expect(exportRows[0]!).not.toHaveProperty('Direct Head')
    expect(exportRows[0]!).not.toHaveProperty('Site')
    expect(exportRows[0]!).not.toHaveProperty('Working Location')
    expect(exportRows[0]!).not.toHaveProperty('Cost Center PT')
    expect(toastSuccessMock).toHaveBeenNthCalledWith(
      1,
      'The system is preparing the export file. Download will start automatically.',
    )
    expect(toastSuccessMock).toHaveBeenNthCalledWith(
      2,
      'Recruitment export is ready. Download started automatically.',
    )
    expect(bookAppendSheetMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'Closed ERF',
    )
    expect(bookAppendSheetMock).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'ERF Summary',
    )
    expect(bookAppendSheetMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'Data Utama',
    )
    expect(bookAppendSheetMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'Pendidikan',
    )
    expect(bookAppendSheetMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'Riwayat Kerja',
    )
    expect(writeFileMock).toHaveBeenCalled()
  })

  it('shows preparing feedback immediately while export is still running', async () => {
    let resolveExport:
      | ((value: { candidates: unknown[]; candidate_forms: unknown[] }) => void)
      | null = null
    callBackendApiMock.mockImplementation((path: string) => {
      if (path === '/api/employee-request-forms/export-candidates') {
        return new Promise((resolve) => {
          resolveExport = resolve
        })
      }

      return Promise.resolve({ passed_candidates: [] })
    })

    const wrapper = await mountPage()

    await wrapper.get('select').setValue('closed')
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Export Excel')!
      .trigger('click')
    await flushPromises()

    expect(toastSuccessMock).toHaveBeenCalledWith(
      'The system is preparing the export file. Download will start automatically.',
    )
    expect(wrapper.text()).toContain('Preparing Excel file...')

    if (resolveExport) {
      const completeExport = resolveExport as (value: {
        candidates: unknown[]
        candidate_forms: unknown[]
      }) => void
      completeExport({
        candidates: [],
        candidate_forms: [],
      })
    }
    await flushPromises()

    expect(writeFileMock).toHaveBeenCalled()
    expect(wrapper.text()).not.toContain('Preparing Excel file...')
  })
})
