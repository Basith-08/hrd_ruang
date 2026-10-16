import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import {
  resetNuxtNavigationMocks,
  setNuxtRouterMock,
} from '../../../../test-utils/nuxt-imports-stub'
import type { EmployeeRequestForm } from '@/domain/entities/EmployeeRequestForm'

const routerPushMock = vi.fn()

const toastSuccessMock = vi.fn()
const toastErrorMock = vi.fn()

const exportEmployeeRequestFormPdfMock = vi.fn()
const jsonToSheetMock = vi.fn()
const bookNewMock = vi.fn()
const bookAppendSheetMock = vi.fn()
const writeFileMock = vi.fn()
const callBackendApiMock = vi.fn()
const refreshJobsMock = vi.fn()
const removeJobMock = vi.fn()
const closeJobMock = vi.fn()
const getJobByIdMock = vi.fn()
const assignRecruiterMock = vi.fn()
const hasPermissionMock = vi.fn()
const confirmMock = vi.fn()
const profilesEqMock = vi.fn()
const profilesSelectMock = vi.fn()
const userRolesInMock = vi.fn()
const userRolesSelectMock = vi.fn()

const jobsRef = ref<EmployeeRequestForm[]>([])
const loadingRef = ref(false)
const errorRef = ref('')
const savingRef = ref(false)
const previewWindowMock = {
  close: vi.fn(),
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

vi.mock('@/presentation/components/forms/SearchableSelect.vue', () => ({
  default: defineComponent({
    props: ['modelValue', 'options', 'disabled', 'emptyValue'],
    emits: ['update:modelValue'],
    template: `
      <select
        :value="modelValue ?? ''"
        :disabled="disabled"
        @change="$emit('update:modelValue', $event.target.value === '' ? (emptyValue ?? '') : $event.target.value)"
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
    success: toastSuccessMock,
    error: toastErrorMock,
  }),
}))

vi.mock('@/presentation/components/feedback/useAppConfirm', () => ({
  useAppConfirm: () => ({
    confirm: confirmMock,
  }),
}))

vi.mock('@/presentation/utils/dateFormat', () => ({
  formatDateDisplay: (value: string | null) => value ?? '-',
  formatDateTimeDisplay: (value: string | null) => value ?? '-',
}))

vi.mock('@/presentation/utils/employeeRequestFormPdfTemplate', () => ({
  exportEmployeeRequestFormPdf: exportEmployeeRequestFormPdfMock,
}))

vi.mock('xlsx-js-style', () => ({
  default: {},
  utils: {
    json_to_sheet: jsonToSheetMock,
    book_new: bookNewMock,
    book_append_sheet: bookAppendSheetMock,
  },
  writeFile: writeFileMock,
}))

vi.mock('@/infrastructure/http/backendApi', () => ({
  callBackendApi: callBackendApiMock,
}))

vi.mock('@/infrastructure/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'profiles') {
        return { select: profilesSelectMock }
      }

      if (table === 'user_roles') {
        return { select: userRolesSelectMock }
      }

      throw new Error(`Unexpected table: ${table}`)
    },
  },
}))

vi.mock('@/viewmodels/useAuthViewModel', () => ({
  useAuthViewModel: () => ({
    hasPermission: hasPermissionMock,
  }),
}))

vi.mock('@/viewmodels/useEmployeeRequestFormViewModel', () => ({
  useEmployeeRequestFormViewModel: () => ({
    jobs: jobsRef,
    loading: loadingRef,
    error: errorRef,
    saving: savingRef,
    remove: removeJobMock,
    refresh: refreshJobsMock,
    close: closeJobMock,
    getById: getJobByIdMock,
    assignRecruiter: assignRecruiterMock,
  }),
}))

function createJob(overrides: Partial<EmployeeRequestForm> = {}): EmployeeRequestForm {
  return {
    id: 'job-1',
    recruiter_user_id: null,
    recruiter_name: null,
    pt_pembebanan: 'PT One',
    department: 'Engineering',
    business_unit: 'Corporate',
    designation: 'Senior',
    employment_status: 'Probation',
    direct_manager: 'Jane Manager - Engineering Manager',
    approval_director_bu: 'Director BU',
    approval_director_bu_date: '2026-03-10T08:00:00',
    approval_gm_hrd: 'GM HRD',
    approval_gm_hrd_date: '2026-03-11T08:00:00',
    approval_director_hrd: 'Director HRD',
    approval_director_hrd_date: '2026-03-12T08:00:00',
    approval_steps: [
      {
        step_order: 1,
        approval_role_label: 'BU Director',
        approver_name: 'Director BU',
        approved_at: '2026-03-10T08:00:00',
        status: 'approved',
      },
      {
        step_order: 2,
        approval_role_label: 'GM HRD Approval',
        approver_name: 'GM HRD',
        approved_at: '2026-03-11T08:00:00',
        status: 'approved',
      },
      {
        step_order: 3,
        approval_role_label: 'HR Director',
        approver_name: 'Director HRD',
        approved_at: null,
        status: 'pending',
      },
      {
        step_order: 4,
        approval_role_label: 'CEO Approval',
        approver_name: 'CEO',
        approved_at: null,
        status: 'pending',
      },
    ],
    site: 'Jakarta',
    working_location: 'Jakarta',
    requested_date: '2026-03-09',
    custom_grup_1_id: null,
    custom_grup_2_id: null,
    custom_grup_3_id: null,
    custom_grup_4_id: null,
    custom_grup_5_id: null,
    custom_grup_6_id: null,
    custom_grup_1: 'Group One',
    custom_grup_2: null,
    custom_grup_3: null,
    custom_grup_4: null,
    custom_grup_5: null,
    custom_grup_6: null,
    required_date: '2026-04-01',
    position_status: 'Replacement',
    periode_probation: 3,
    main_position: 'Backend Engineer',
    passed_candidate_name: null,
    vacancy_status: 'request',
    organizational_structure: [],
    job_description: [],
    created_by: 'user-1',
    created_by_name: 'Hana Recruiter',
    status: 'open',
    closed_date: null,
    closed_category: null,
    reason: null,
    created_at: '2026-03-09T08:00:00',
    updated_at: '2026-03-09T08:00:00',
    ...overrides,
  }
}

function findSelectByOption(wrapper: ReturnType<typeof mount>, optionLabel: string) {
  return wrapper.findAll('select').find((select) => select.text().includes(optionLabel))
}

describe('EmployeeRequestFormList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetNuxtNavigationMocks()
    setNuxtRouterMock({ push: routerPushMock })
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    )
    confirmMock.mockResolvedValue(true)
    vi.spyOn(window, 'open').mockReturnValue(previewWindowMock as any)
    bookNewMock.mockReturnValue({})
    jsonToSheetMock.mockImplementation((rows: unknown[]) => {
      const firstRow = (rows[0] ?? {}) as Record<string, unknown>
      const sheet: Record<string, unknown> = {
        '!ref': 'A1',
      }

      Object.keys(firstRow).forEach((_, index) => {
        const column = String.fromCharCode(65 + index)
        sheet[`${column}1`] = { v: 'header' }
      })

      return sheet
    })
    bookAppendSheetMock.mockImplementation(() => {})
    writeFileMock.mockImplementation(() => {})

    jobsRef.value = [
      createJob(),
      createJob({
        id: 'job-2',
        department: 'Finance',
        business_unit: 'Operations',
        employment_status: 'Contract',
        site: 'Bandung',
        position_status: 'New Position MPP',
        main_position: 'Finance Analyst',
        approval_director_hrd: null,
        approval_director_hrd_date: null,
        status: 'closed',
        closed_date: '2026-03-20T08:00:00',
      }),
    ]
    loadingRef.value = false
    errorRef.value = ''
    savingRef.value = false

    hasPermissionMock.mockImplementation((permission: string) =>
      [
        'employee_request_form:read',
        'employee_request_form:create',
        'employee_request_form:update',
        'employee_request_form:assign_recruiter',
        'employee_request_form:close',
        'employee_request_form:export_pdf',
      ].includes(permission),
    )
    exportEmployeeRequestFormPdfMock.mockImplementation(() => {})
    refreshJobsMock.mockResolvedValue(undefined)
    removeJobMock.mockResolvedValue(undefined)
    closeJobMock.mockResolvedValue(undefined)
    getJobByIdMock.mockImplementation(
      async (id: string) => jobsRef.value.find((job) => job.id === id) ?? null,
    )
    assignRecruiterMock.mockResolvedValue(undefined)
    profilesSelectMock.mockReturnValue({ eq: profilesEqMock })
    profilesEqMock.mockResolvedValue({
      data: [
        {
          id: 'recruiter-1',
          full_name: 'Recruiter One',
          username: 'recruiter.one',
          email: 'recruiter.one@example.com',
          main_position: 'Recruiter',
        },
      ],
      error: null,
    })
    userRolesSelectMock.mockReturnValue({ in: userRolesInMock })
    userRolesInMock.mockResolvedValue({
      data: [
        {
          user_id: 'recruiter-1',
          roles: { name: 'staff' },
        },
      ],
      error: null,
    })
    callBackendApiMock.mockImplementation((path: string) => {
      if (path === '/api/employee-request-forms/job-1/candidates') {
        return Promise.resolve({
          candidates: [
            {
              id: 'candidate:user-1',
              email: 'candidate@example.com',
              full_name: 'Candidate One',
              main_position: 'Backend Engineer',
            },
          ],
        })
      }

      return Promise.resolve({ user: { id: 'candidate:user-1', role: 'employee' } })
    })
  })

  it('filters ERFs by search and select filters, then refreshes the list', async () => {
    const { default: EmployeeRequestFormList } = await import('../EmployeeRequestFormList.vue')
    const wrapper = mount(EmployeeRequestFormList)

    expect(wrapper.text()).toContain('Approval Progress')
    expect(wrapper.text()).toContain('2/4 Approved')
    expect(wrapper.text()).toContain('Current Approval')
    expect(wrapper.text()).toContain('Director HRD')
    expect(wrapper.text()).toContain('Official Request')
    expect(wrapper.text()).toContain('2026-03-11T08:00:00')
    expect(wrapper.text()).not.toContain('Approval GM HRD')
    expect(wrapper.text()).not.toContain('Approval Director HRD')

    const headers = wrapper.findAll('thead th').map((header) => header.text())
    expect(headers[1]).toContain('Main Position')
    expect(headers[2]).toContain('BU Department')
    expect(headers[3]).toContain('BU Category')

    await wrapper.get('input[type="search"]').setValue('finance')
    const tableBody = wrapper.get('tbody')

    expect(tableBody.text()).toContain('Finance Analyst')
    expect(tableBody.text()).not.toContain('Backend Engineer')

    const departmentSelect = findSelectByOption(wrapper, 'Finance')
    const businessUnitSelect = findSelectByOption(wrapper, 'Operations')
    const positionStatusSelect = findSelectByOption(wrapper, 'Replacement')

    await departmentSelect!.setValue('Finance')
    await businessUnitSelect!.setValue('Operations')
    expect(tableBody.text()).toContain('Finance Analyst')

    await positionStatusSelect!.setValue('Replacement')

    expect(wrapper.text()).toContain('No matching data found.')

    const refreshButton = wrapper.findAll('button').find((button) => button.text() === 'Refresh')
    await refreshButton!.trigger('click')

    expect(refreshJobsMock).toHaveBeenCalled()
  })

  it('sorts ERFs from the table headers', async () => {
    jobsRef.value = [
      createJob({
        id: 'job-z',
        main_position: 'Zebra Analyst',
        department: 'Zulu Department',
        business_unit: 'Zulu Category',
      }),
      createJob({
        id: 'job-a',
        main_position: 'Alpha Engineer',
        department: 'Alpha Department',
        business_unit: 'Alpha Category',
      }),
    ]

    const { default: EmployeeRequestFormList } = await import('../EmployeeRequestFormList.vue')
    const wrapper = mount(EmployeeRequestFormList)

    const sortableHeaders = wrapper
      .findAll('thead button')
      .filter((button) => /[↑↓]/.test(button.text()))
    expect(sortableHeaders).toHaveLength(12)

    const mainPositionHeader = sortableHeaders.find((button) =>
      button.text().includes('Main Position'),
    )
    await mainPositionHeader!.trigger('click')
    await flushPromises()

    const firstRowCells = wrapper.findAll('tbody tr')[0]!.findAll('td')
    expect(firstRowCells[1]!.text()).toContain('Alpha Engineer')
    expect(firstRowCells[2]!.text()).toContain('Alpha Department')
    expect(firstRowCells[3]!.text()).toContain('Alpha Category')
  })

  it('opens the close modal and closes an ERF with canceled category and reason', async () => {
    const { default: EmployeeRequestFormList } = await import('../EmployeeRequestFormList.vue')
    const wrapper = mount(EmployeeRequestFormList)

    const closeButton = wrapper.findAll('button').find((button) => button.text() === 'Close ERF')
    expect(closeButton).toBeTruthy()

    await closeButton!.trigger('click')
    expect(wrapper.text()).toContain(
      'Please provide a reason for closing this Employee Request Form.',
    )

    await wrapper.get('textarea').setValue('Position has been filled internally.')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(closeJobMock).toHaveBeenCalledWith(
      'job-1',
      'canceled',
      'Position has been filled internally.',
    )
    expect(toastSuccessMock).toHaveBeenCalledWith('ERF closed successfully.')
  })

  it('exports, deletes, and navigates from row actions', async () => {
    const { default: EmployeeRequestFormList } = await import('../EmployeeRequestFormList.vue')
    const wrapper = mount(EmployeeRequestFormList)

    const detailButton = wrapper.findAll('button').find((button) => button.text() === 'Detail')
    const editButton = wrapper.findAll('button').find((button) => button.text() === 'Edit')
    const exportButton = wrapper.findAll('button').find((button) => button.text() === 'Export PDF')
    const deleteButton = wrapper.findAll('button').find((button) => button.text() === 'Delete')

    await detailButton!.trigger('click')
    await editButton!.trigger('click')
    await exportButton!.trigger('click')
    await deleteButton!.trigger('click')
    await flushPromises()

    expect(routerPushMock).toHaveBeenCalledWith('/employee-request-forms/job-1')
    expect(routerPushMock).toHaveBeenCalledWith('/employee-request-forms/job-1/edit')
    expect(confirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          'Delete ERF Backend Engineer? This will also delete any linked approval workflow, candidate applications/forms, and employee contract forms for this ERF.',
      }),
    )
    expect(exportEmployeeRequestFormPdfMock).toHaveBeenCalledWith(jobsRef.value[0], {
      previewWindow: previewWindowMock,
    })
    expect(removeJobMock).toHaveBeenCalledWith('job-1')
    expect(toastSuccessMock).toHaveBeenCalledWith('PDF template opened successfully.')
    expect(toastSuccessMock).toHaveBeenCalledWith('ERF deleted successfully.')
  })

  it('exports all accessible ERFs to Excel even when the table is filtered', async () => {
    const { default: EmployeeRequestFormList } = await import('../EmployeeRequestFormList.vue')
    const wrapper = mount(EmployeeRequestFormList)

    await wrapper.get('input[type="search"]').setValue('backend')
    await flushPromises()

    const exportExcelButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Export Excel')
    expect(exportExcelButton).toBeTruthy()

    await exportExcelButton!.trigger('click')
    await flushPromises()

    expect(toastSuccessMock).toHaveBeenCalledWith(
      'The system is preparing the export file. Download will start automatically.',
    )
    expect(jsonToSheetMock).toHaveBeenCalledWith([
      expect.objectContaining({
        No: 1,
        'ERF ID': 'job-1',
        Requester: 'Hana Recruiter',
        'Main Position': 'Backend Engineer',
        'Cost Center PT': 'PT One',
        'BU Department': 'Engineering',
        'BU Category': 'Corporate',
        Designation: 'Senior',
        Recruiter: '-',
        'Position Status': 'Replacement',
        'Employment Status': 'Probation',
        'Direct Head': 'Jane Manager - Engineering Manager',
        Site: 'Jakarta',
        'Working Location': 'Jakarta',
        'Requested Date': '2026-03-09',
        'Required Date': '2026-04-01',
        'Probation/Contract Period (Months)': 3,
        'Custom Group 1': 'Group One',
        'Approval Progress': '2/4 Approved',
        'Current Approval': 'Director HRD',
        'BU Director ': 'Director BU',
        'BU Director Approval Date': '2026-03-10T08:00:00',
        'GM HRD': 'GM HRD',
        'GM HRD Approval Date': '2026-03-11T08:00:00',
        'Director HRD': 'Director HRD',
        'Director HRD Approval Date': '2026-03-12T08:00:00',
        'Official Request': '2026-03-11T08:00:00',
        Status: '2. Approval In Progress',
        'Vacancy Status': 'request',
        'Passed Candidate': '-',
        'Closed Date': '-',
        'Closed Category': '-',
        Reason: '-',
        'Created At': '2026-03-09T08:00:00',
        'Updated At': '2026-03-09T08:00:00',
      }),
      expect.objectContaining({
        No: 2,
        'ERF ID': 'job-2',
        Requester: 'Hana Recruiter',
        'Main Position': 'Finance Analyst',
        'Cost Center PT': 'PT One',
        'BU Department': 'Finance',
        'BU Category': 'Operations',
        Designation: 'Senior',
        Recruiter: '-',
        'Position Status': 'New Position MPP',
        'Employment Status': 'Contract',
        'Direct Head': 'Jane Manager - Engineering Manager',
        Site: 'Bandung',
        'Working Location': 'Jakarta',
        'Requested Date': '2026-03-09',
        'Required Date': '2026-04-01',
        'Probation/Contract Period (Months)': 3,
        'Custom Group 1': 'Group One',
        'Approval Progress': '2/4 Approved',
        'Current Approval': 'Director HRD',
        'BU Director ': 'Director BU',
        'BU Director Approval Date': '2026-03-10T08:00:00',
        'GM HRD': 'GM HRD',
        'GM HRD Approval Date': '2026-03-11T08:00:00',
        'Director HRD': '-',
        'Director HRD Approval Date': '-',
        'Official Request': '2026-03-11T08:00:00',
        Status: '91. Closed',
        'Vacancy Status': 'request',
        'Passed Candidate': '-',
        'Closed Date': '2026-03-20T08:00:00',
        'Closed Category': '-',
        Reason: '-',
        'Created At': '2026-03-09T08:00:00',
        'Updated At': '2026-03-09T08:00:00',
      }),
    ])
    expect(bookAppendSheetMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'Employee Request Forms',
    )
    expect(writeFileMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringMatching(/^employee-request-forms-\d{4}-\d{2}-\d{2}\.xlsx$/),
    )
    expect(toastSuccessMock).toHaveBeenCalledWith('ERF Excel exported successfully.')
  })

  it('shows loading overlay while deleting an ERF', async () => {
    const deleteDeferred = createDeferred<void>()
    removeJobMock.mockReturnValueOnce(deleteDeferred.promise)

    const { default: EmployeeRequestFormList } = await import('../EmployeeRequestFormList.vue')
    const wrapper = mount(EmployeeRequestFormList)

    const deleteButton = wrapper.findAll('button').find((button) => button.text() === 'Delete')
    await deleteButton!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Deleting ERF and linked data...')

    deleteDeferred.resolve(undefined)
    await flushPromises()

    expect(wrapper.text()).not.toContain('Deleting ERF and linked data...')
  })

  it('does not show assign recruiter action for approved ERFs after the flow moves to PIC Recruitment', async () => {
    jobsRef.value = [
      createJob({
        approval_director_hrd_date: '2026-03-12T08:00:00',
        recruitment_flow_stage: 'erf_approved',
      }),
    ]

    const { default: EmployeeRequestFormList } = await import('../EmployeeRequestFormList.vue')
    const wrapper = mount(EmployeeRequestFormList)

    await flushPromises()

    expect(wrapper.text()).toContain('Recruiter')
    expect(wrapper.find('tbody').text()).not.toContain('Assign Recruiter')
    expect(wrapper.findAll('button').some((button) => button.text() === 'Assign Recruiter')).toBe(
      false,
    )
  })

  it('does not show edit action for closed ERFs', async () => {
    const { default: EmployeeRequestFormList } = await import('../EmployeeRequestFormList.vue')
    const wrapper = mount(EmployeeRequestFormList)

    await wrapper.get('input[type="search"]').setValue('finance')
    await flushPromises()

    const rowActionsText = wrapper.find('tbody').text()
    expect(rowActionsText).toContain('Detail')
    expect(rowActionsText).toContain('Export PDF')
    expect(rowActionsText).toContain('Delete')
    expect(rowActionsText).not.toContain('Edit')
    expect(rowActionsText).not.toContain('Close ERF')
  })

  it('keeps close action visible when a candidate is selected but hiring is not completed', async () => {
    jobsRef.value = [
      createJob({
        passed_candidate_name: 'Candidate One',
        vacancy_status: 'accepted',
      }),
    ]

    const { default: EmployeeRequestFormList } = await import('../EmployeeRequestFormList.vue')
    const wrapper = mount(EmployeeRequestFormList)

    await flushPromises()

    const rowActionsText = wrapper.find('tbody').text()
    expect(rowActionsText).toContain('Detail')
    expect(rowActionsText).toContain('Edit')
    expect(rowActionsText).toContain('Close ERF')
    expect(rowActionsText).toContain('Export PDF')
    expect(rowActionsText).toContain('Delete')
  })

  it('shows candidate sourcing when approval is complete and candidates are only bound to the ERF', async () => {
    jobsRef.value = [
      createJob({
        approval_director_bu_date: '2026-03-10T08:00:00',
        approval_gm_hrd_date: '2026-03-11T08:00:00',
        approval_director_hrd_date: '2026-03-12T08:00:00',
        recruitment_flow_stage: null,
        vacancy_status: 'sourcing',
      }),
    ]

    const { default: EmployeeRequestFormList } = await import('../EmployeeRequestFormList.vue')
    const wrapper = mount(EmployeeRequestFormList)

    await flushPromises()

    expect(wrapper.text()).toContain('6. Candidate Sourcing')
    expect(wrapper.text()).not.toContain('4. ERF Approved')
  })

  it('does not show close and passed candidate actions when hiring is completed', async () => {
    jobsRef.value = [
      createJob({
        status: 'closed',
        closed_category: 'employee hired',
        closed_date: '2026-03-20T08:00:00',
        passed_candidate_name: 'Candidate One',
        vacancy_status: 'accepted',
      }),
    ]

    const { default: EmployeeRequestFormList } = await import('../EmployeeRequestFormList.vue')
    const wrapper = mount(EmployeeRequestFormList)

    await flushPromises()

    const rowActionsText = wrapper.find('tbody').text()
    expect(rowActionsText).toContain('Detail')
    expect(rowActionsText).toContain('Export PDF')
    expect(rowActionsText).toContain('Delete')
    expect(rowActionsText).not.toContain('Close ERF')
  })

  it('does not show close and passed candidate actions when the ERF is rejected', async () => {
    jobsRef.value = [
      createJob({
        recruitment_flow_stage: 'rejected',
      }),
    ]

    const { default: EmployeeRequestFormList } = await import('../EmployeeRequestFormList.vue')
    const wrapper = mount(EmployeeRequestFormList)

    await flushPromises()

    const rowActionsText = wrapper.find('tbody').text()
    expect(rowActionsText).toContain('Detail')
    expect(rowActionsText).toContain('Edit')
    expect(rowActionsText).toContain('Export PDF')
    expect(rowActionsText).toContain('Delete')
    expect(rowActionsText).not.toContain('Close ERF')
  })

  it('shows only approved ERFs in read-only mode for approved recruitment access', async () => {
    hasPermissionMock.mockImplementation(
      (permission: string) => permission === 'recruitment:approved_erf_read',
    )

    const { default: EmployeeRequestFormList } = await import('../EmployeeRequestFormList.vue')
    const wrapper = mount(EmployeeRequestFormList)

    await flushPromises()

    expect(wrapper.text()).toContain('Backend Engineer')
    expect(wrapper.text()).not.toContain('Finance Analyst')
    expect(wrapper.findAll('button').some((button) => button.text() === 'Create ERF')).toBe(false)

    const rowActionsText = wrapper.find('tbody').text()
    expect(rowActionsText).toContain('Detail')
    expect(rowActionsText).not.toContain('Edit')
    expect(rowActionsText).not.toContain('Delete')
    expect(rowActionsText).not.toContain('Close ERF')
    expect(rowActionsText).not.toContain('Export PDF')
  })

  it('does not show export PDF without ERF export permission', async () => {
    hasPermissionMock.mockImplementation((permission: string) =>
      [
        'employee_request_form:read',
        'employee_request_form:create',
        'employee_request_form:update',
        'employee_request_form:assign_recruiter',
        'employee_request_form:close',
      ].includes(permission),
    )

    const { default: EmployeeRequestFormList } = await import('../EmployeeRequestFormList.vue')
    const wrapper = mount(EmployeeRequestFormList)

    await flushPromises()

    expect(wrapper.find('tbody').text()).not.toContain('Export PDF')
  })
})
