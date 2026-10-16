import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import {
  resetNuxtNavigationMocks,
  setNuxtRouteMock,
  setNuxtRouterMock,
} from '../../../../test-utils/nuxt-imports-stub'
import type { EmployeeRequestForm } from '@/domain/entities/EmployeeRequestForm'
import { extractErfDocumentFields } from '@/presentation/utils/employeeRequestFormDocumentParser'

type MockMasterDataItem = {
  id: string
  name: string
  description: string | null
  required_date_min_months?: number | null
  created_at: null
  updated_at: null
}

const routeState = {
  name: 'employee-request-forms-create',
  params: {} as Record<string, string>,
}

const routerPushMock = vi.fn()
const routerBackMock = vi.fn()

const toastCreatedMock = vi.fn()
const toastUpdatedMock = vi.fn()
const toastErrorMock = vi.fn()
const toastSuccessMock = vi.fn()

const createJobMock = vi.fn()
const updateJobMock = vi.fn()
const refreshJobsMock = vi.fn()
const getJobByIdMock = vi.fn()
const loadCustomGroupOptionsMock = vi.fn()
const loadMasterDataOptionsMock = vi.fn()
const hasPermissionMock = vi.fn()

const storageCreateSignedUrlMock = vi.fn()
const storageUploadMock = vi.fn()
const supabaseStorageFromMock = vi.fn()
const profilesSelectMock = vi.fn()
const profilesQueryMock = {
  select: profilesSelectMock,
}
const userRolesInMock = vi.fn()
const userRolesSelectMock = vi.fn(() => ({
  in: userRolesInMock,
}))
const userRolesQueryMock = {
  select: userRolesSelectMock,
}
const approverMasterOrderStepMock = vi.fn()
const approverMasterOrderFlowMock = vi.fn(() => ({
  order: approverMasterOrderStepMock,
}))
const approverMasterSelectMock = vi.fn(() => ({
  order: approverMasterOrderFlowMock,
}))
const approverMasterQueryMock = {
  select: approverMasterSelectMock,
}
const supabaseFromMock = vi.fn((table: string) => {
  if (table === 'profiles') return profilesQueryMock
  if (table === 'user_roles') return userRolesQueryMock
  if (table === 'approver_master') return approverMasterQueryMock
  throw new Error(`Unexpected table ${table}`)
})

const jobsRef = ref<EmployeeRequestForm[]>([])
const loadingRef = ref(false)
const savingRef = ref(false)
const errorRef = ref('')

const groupedOptionsRef = ref({
  1: [] as Array<{ id: string; name: string }>,
  2: [] as Array<{ id: string; name: string }>,
  3: [] as Array<{ id: string; name: string }>,
  4: [] as Array<{ id: string; name: string }>,
  5: [] as Array<{ id: string; name: string }>,
  6: [] as Array<{ id: string; name: string }>,
})

const optionsByTypeRef = ref({
  pt: [
    { id: 'pt-1', name: 'PT One', description: null, created_at: null, updated_at: null },
  ] as MockMasterDataItem[],
  bu: [] as MockMasterDataItem[],
  department: [
    { id: 'dep-1', name: 'Engineering', description: null, created_at: null, updated_at: null },
  ] as MockMasterDataItem[],
  job_level: [
    {
      id: 'lvl-1',
      name: 'Senior',
      description: null,
      required_date_min_months: null,
      created_at: null,
      updated_at: null,
    },
  ] as MockMasterDataItem[],
  designation: [
    { id: 'des-1', name: 'Senior', description: null, created_at: null, updated_at: null },
  ] as MockMasterDataItem[],
})

const userRef = ref({
  id: 'user-1',
  email: 'user@example.com',
  full_name: 'Hana Recruiter',
})

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

vi.mock('@/presentation/components/feedback/useAppToast', () => ({
  useAppToast: () => ({
    created: toastCreatedMock,
    updated: toastUpdatedMock,
    error: toastErrorMock,
    success: toastSuccessMock,
  }),
}))

vi.mock('@/viewmodels/useEmployeeRequestFormViewModel', () => ({
  useEmployeeRequestFormViewModel: () => ({
    jobs: jobsRef,
    loading: loadingRef,
    saving: savingRef,
    error: errorRef,
    create: createJobMock,
    update: updateJobMock,
    getById: getJobByIdMock,
    refresh: refreshJobsMock,
  }),
}))

vi.mock('@/viewmodels/useCustomGroupViewModel', () => ({
  useCustomGroupViewModel: () => ({
    groupedOptions: groupedOptionsRef,
    loadAllOptions: loadCustomGroupOptionsMock,
  }),
}))

vi.mock('@/viewmodels/useMasterDataViewModel', () => ({
  useMasterDataViewModel: () => ({
    optionsByType: optionsByTypeRef,
    loadAllOptions: loadMasterDataOptionsMock,
  }),
}))

vi.mock('@/viewmodels/useAuthViewModel', () => ({
  useAuthViewModel: () => ({
    hasPermission: hasPermissionMock,
    hasAnyPermission: (permissions: string[]) =>
      permissions.some((permission) => hasPermissionMock(permission)),
    user: userRef,
  }),
}))

vi.mock('@/infrastructure/supabase/client', () => ({
  supabase: {
    storage: {
      from: supabaseStorageFromMock,
    },
    from: supabaseFromMock,
  },
}))

// Real docx/pdf parsing (mammoth/pdfjs-dist) is exercised by
// employeeRequestFormDocumentParser.spec.ts — stub it here so page-level
// tests don't depend on those libraries' behavior against fake File content.
vi.mock('@/presentation/utils/employeeRequestFormDocumentParser', async () => {
  const actual = await vi.importActual<
    typeof import('@/presentation/utils/employeeRequestFormDocumentParser')
  >('@/presentation/utils/employeeRequestFormDocumentParser')
  return {
    ...actual,
    extractErfDocumentFields: vi
      .fn()
      .mockRejectedValue(new actual.ErfDocumentParseError('Unsupported file type.')),
  }
})

function createJob(overrides: Partial<EmployeeRequestForm> = {}): EmployeeRequestForm {
  return {
    id: 'job-1',
    pt_pembebanan: 'PT One',
    department: 'Engineering',
    master_designation_id: 'des-1',
    designation: 'Senior',
    employment_status: 'Probation',
    approval_director_bu_id: 'director-1',
    approval_director_bu_label: 'John Director - Director BU',
    direct_manager: 'Jane Manager - Engineering Manager',
    approval_director_bu: 'Director BU',
    approval_director_bu_date: '2026-03-10T08:00:00',
    approval_gm_hrd: 'GM HRD',
    approval_gm_hrd_date: '2026-03-11T08:00:00',
    approval_director_hrd: 'Director HRD',
    approval_director_hrd_date: '2026-03-12T08:00:00',
    site: 'Jakarta',
    working_location: 'Jakarta',
    requested_date: '2026-03-09',
    custom_grup_1_id: null,
    custom_grup_2_id: null,
    custom_grup_3_id: null,
    custom_grup_4_id: null,
    custom_grup_5_id: null,
    custom_grup_6_id: null,
    required_date: '2026-04-01',
    position_status: 'Replacement',
    periode_probation: 3,
    main_position: 'Backend Engineer',
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

describe('EmployeeRequestFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeState.name = 'employee-request-forms-create'
    routeState.params = {}
    resetNuxtNavigationMocks()
    setNuxtRouteMock(routeState)
    setNuxtRouterMock({
      push: routerPushMock,
      back: routerBackMock,
    })

    jobsRef.value = []
    loadingRef.value = false
    savingRef.value = false
    errorRef.value = ''

    groupedOptionsRef.value = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
    }

    optionsByTypeRef.value = {
      pt: [{ id: 'pt-1', name: 'PT One', description: null, created_at: null, updated_at: null }],
      bu: [
        { id: 'bu-1', name: 'Operations', description: null, created_at: null, updated_at: null },
      ],
      department: [
        { id: 'dep-1', name: 'Engineering', description: null, created_at: null, updated_at: null },
      ],
      job_level: [
        {
          id: 'lvl-1',
          name: 'Senior',
          description: null,
          required_date_min_months: null,
          created_at: null,
          updated_at: null,
        },
      ],
      designation: [
        { id: 'des-1', name: 'Senior', description: null, created_at: null, updated_at: null },
      ],
    }

    hasPermissionMock.mockImplementation((permission: string) =>
      [
        'employee_request_form:update',
        'employee_request_form:requester_read',
        'employee_request_form:requester_update',
      ].includes(permission),
    )
    createJobMock.mockResolvedValue(undefined)
    updateJobMock.mockResolvedValue(undefined)
    refreshJobsMock.mockResolvedValue(undefined)
    loadCustomGroupOptionsMock.mockResolvedValue(undefined)
    loadMasterDataOptionsMock.mockResolvedValue(undefined)

    storageCreateSignedUrlMock.mockResolvedValue({
      data: { signedUrl: 'https://signed.example/file' },
      error: null,
    })
    storageUploadMock.mockResolvedValue({ error: null })
    supabaseStorageFromMock.mockReturnValue({
      createSignedUrl: storageCreateSignedUrlMock,
      upload: storageUploadMock,
    })

    profilesSelectMock.mockResolvedValue({
      data: [
        {
          id: 'user-1',
          full_name: 'Hana Recruiter',
          username: 'hana',
          main_position: 'HR Admin',
        },
        {
          id: 'manager-1',
          full_name: 'Jane Manager',
          username: 'jane',
          main_position: 'Engineering Manager',
        },
        {
          id: 'director-1',
          full_name: 'John Director',
          username: 'john',
          main_position: 'Director BU',
        },
      ],
      error: null,
    })
    userRolesInMock.mockResolvedValue({
      data: [
        {
          user_id: 'user-1',
          roles: {
            name: 'staff recruitment',
          },
        },
        {
          user_id: 'manager-1',
          roles: {
            name: 'manager',
          },
        },
        {
          user_id: 'director-1',
          roles: {
            name: 'manager',
          },
        },
      ],
      error: null,
    })
    approverMasterOrderStepMock.mockResolvedValue({
      data: [
        {
          profile_id: 'manager-1',
          approval_flow_key: 'designations:des-1',
          approval_role_key: 'manager_approval',
          step_order: 1,
          approval_role_label: 'Manager Approval',
          profile: {
            full_name: 'Jane Manager',
            username: 'jane',
            main_position: 'Engineering Manager',
          },
        },
        {
          profile_id: 'director-1',
          approval_flow_key: 'designations:des-1',
          approval_role_key: 'director_approval',
          step_order: 2,
          approval_role_label: 'Director BU',
          profile: {
            full_name: 'John Director',
            username: 'john',
            main_position: 'Director BU',
          },
        },
      ],
      error: null,
    })
  })

  it('shows the edit CTA in detail mode and navigates to edit', async () => {
    routeState.name = 'employee-request-forms-detail'
    routeState.params = { id: 'job-1' }
    setNuxtRouteMock(routeState)
    jobsRef.value = [createJob()]
    getJobByIdMock.mockImplementation(
      async (id: string) => jobsRef.value.find((job) => job.id === id) ?? null,
    )

    const { default: EmployeeRequestFormPage } = await import('../EmployeeRequestFormPage.vue')
    const wrapper = mount(EmployeeRequestFormPage)

    await flushPromises()

    expect(wrapper.text()).toContain('ERF Detail')
    expect(wrapper.text()).toContain('Requester')
    expect(wrapper.text()).not.toContain('Custom Group 1')
    expect(
      wrapper
        .findAll('input[type="text"]')
        .some((input) => (input.element as HTMLInputElement).value === 'Senior'),
    ).toBe(true)
    expect(getJobByIdMock).toHaveBeenCalledWith('job-1', { includeSupplementaryData: false })
    expect(loadMasterDataOptionsMock).not.toHaveBeenCalled()
    expect(profilesSelectMock).not.toHaveBeenCalled()
    expect(userRolesInMock).not.toHaveBeenCalled()

    const editButton = wrapper.findAll('button').find((button) => button.text() === 'Edit ERF')
    await editButton!.trigger('click')

    expect(routerPushMock).toHaveBeenCalledWith('/employee-request-forms/job-1/edit')
  })

  it('shows the uploaded ERF document in detail mode', async () => {
    routeState.name = 'employee-request-forms-detail'
    routeState.params = { id: 'job-1' }
    setNuxtRouteMock(routeState)
    jobsRef.value = [
      createJob({
        document_erf: ['employee-request-forms/user-1/document_erf/erf-filled.docx'],
      }),
    ]
    getJobByIdMock.mockImplementation(
      async (id: string) => jobsRef.value.find((job) => job.id === id) ?? null,
    )

    const { default: EmployeeRequestFormPage } = await import('../EmployeeRequestFormPage.vue')
    const wrapper = mount(EmployeeRequestFormPage)

    await flushPromises()

    expect(wrapper.text()).toContain('ERF Detail')
    expect(wrapper.text()).toContain('Uploaded files')
    expect(wrapper.text()).toContain('ERF Document.docx')
    expect(wrapper.findAll('button').some((button) => button.text() === 'Remove')).toBe(false)
  })

  it('prefills requester field from the logged-in user on create page', async () => {
    routeState.name = 'employee-request-forms-create'
    setNuxtRouteMock(routeState)

    const { default: EmployeeRequestFormPage } = await import('../EmployeeRequestFormPage.vue')
    const wrapper = mount(EmployeeRequestFormPage)

    await flushPromises()

    expect(wrapper.text()).toContain('Requester')
    expect((wrapper.findAll('select')[0]!.element as HTMLSelectElement).value).toBe('user-1')
  })

  it('defaults requested rate to today on create page and allows editing it', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-04T10:00:00+07:00'))

    routeState.name = 'employee-request-forms-create'
    setNuxtRouteMock(routeState)

    const { default: EmployeeRequestFormPage } = await import('../EmployeeRequestFormPage.vue')
    const wrapper = mount(EmployeeRequestFormPage)

    await flushPromises()

    const dateInputs = wrapper.findAll('input[type="date"]')
    expect(dateInputs).toHaveLength(2)
    expect((dateInputs[0]!.element as HTMLInputElement).value).toBe('2026-06-04')
    expect((dateInputs[0]!.element as HTMLInputElement).disabled).toBe(false)

    const designationSelect = wrapper
      .findAll('select')
      .find((select) => select.html().includes('value="des-1"'))
    expect(designationSelect).toBeTruthy()
    await designationSelect!.setValue('des-1')
    await flushPromises()

    const directorBuSelect = wrapper
      .findAll('select')
      .filter((select) => select.html().includes('value="director-1"'))
    const directorBuSelectField = directorBuSelect[directorBuSelect.length - 1]
    expect(directorBuSelectField).toBeTruthy()
    await directorBuSelectField!.setValue('director-1')
    await flushPromises()

    await dateInputs[0]!.setValue('2026-06-10')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(createJobMock).toHaveBeenCalledWith(
      expect.objectContaining({
        created_by: 'user-1',
        approval_director_bu_id: 'director-1',
        requested_date: '2026-06-10',
      }),
      { refresh: false },
    )

    vi.useRealTimers()
  })

  it('hides requester field when requester read permission is missing', async () => {
    hasPermissionMock.mockImplementation((permission: string) =>
      ['employee_request_form:update', 'employee_request_form:requester_update'].includes(
        permission,
      ),
    )

    routeState.name = 'employee-request-forms-create'
    setNuxtRouteMock(routeState)

    const { default: EmployeeRequestFormPage } = await import('../EmployeeRequestFormPage.vue')
    const wrapper = mount(EmployeeRequestFormPage)

    await flushPromises()

    expect(wrapper.text()).not.toContain('Requester')
  })

  it('does not navigate back before the detail record finishes loading', async () => {
    routeState.name = 'employee-request-forms-detail'
    routeState.params = { id: 'job-1' }
    setNuxtRouteMock(routeState)

    let resolveJob: ((value: EmployeeRequestForm | null) => void) | null = null
    getJobByIdMock.mockImplementation(
      () =>
        new Promise<EmployeeRequestForm | null>((resolve) => {
          resolveJob = resolve
        }),
    )

    const { default: EmployeeRequestFormPage } = await import('../EmployeeRequestFormPage.vue')
    mount(EmployeeRequestFormPage)

    await flushPromises()
    expect(routerBackMock).not.toHaveBeenCalled()
    expect(getJobByIdMock).toHaveBeenCalledWith('job-1', { includeSupplementaryData: false })

    if (resolveJob) {
      ;(resolveJob as (value: EmployeeRequestForm | null) => void)(createJob())
    }
    await flushPromises()

    expect(routerBackMock).not.toHaveBeenCalled()
  })

  it('allows submit when Director BU has not been selected', async () => {
    routeState.name = 'employee-request-forms-create'
    setNuxtRouteMock(routeState)

    const { default: EmployeeRequestFormPage } = await import('../EmployeeRequestFormPage.vue')
    const wrapper = mount(EmployeeRequestFormPage)
    await flushPromises()

    expect(wrapper.text()).not.toContain('Custom Group 1')

    const inputs = wrapper.findAll('input[type="text"]')
    await inputs[0]!.setValue('Platform Engineer')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(createJobMock).toHaveBeenCalledWith(
      expect.objectContaining({
        approval_director_bu_id: null,
        auto_approval: false,
      }),
      { refresh: false },
    )
  })

  it('marks the ERF for auto approval when the Auto Approval mode is selected', async () => {
    routeState.name = 'employee-request-forms-create'
    setNuxtRouteMock(routeState)

    const { default: EmployeeRequestFormPage } = await import('../EmployeeRequestFormPage.vue')
    const wrapper = mount(EmployeeRequestFormPage)
    await flushPromises()

    const inputs = wrapper.findAll('input[type="text"]')
    await inputs[0]!.setValue('Platform Engineer')

    const autoApprovalButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Auto Approval')
    expect(autoApprovalButton).toBeTruthy()
    await autoApprovalButton!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain(
      'This ERF will be marked as approved immediately without going through the approval chain.',
    )

    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(createJobMock).toHaveBeenCalledWith(
      expect.objectContaining({
        auto_approval: true,
      }),
      { refresh: false },
    )
  })

  it('keeps the uploaded ERF document staged for upload and includes it in the submit payload', async () => {
    routeState.name = 'employee-request-forms-create'
    setNuxtRouteMock(routeState)

    const { default: EmployeeRequestFormPage } = await import('../EmployeeRequestFormPage.vue')
    const wrapper = mount(EmployeeRequestFormPage)
    await flushPromises()

    const inputs = wrapper.findAll('input[type="text"]')
    await inputs[0]!.setValue('Platform Engineer')

    const erfDocumentInput = wrapper
      .findAll('input[type="file"]')
      .find((input) => input.attributes('accept')?.includes('.docx'))
    expect(erfDocumentInput).toBeTruthy()

    const uploadedDocument = new File(['erf content'], 'erf-filled.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    Object.defineProperty(erfDocumentInput!.element, 'files', {
      value: [uploadedDocument],
      configurable: true,
    })
    await erfDocumentInput!.trigger('change')
    await flushPromises()

    expect(wrapper.text()).toContain('erf-filled.docx')

    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(storageUploadMock).toHaveBeenCalledWith(
      expect.stringMatching(/^employee-request-forms\/.+\/document_erf\/.+\.docx$/),
      uploadedDocument,
      expect.objectContaining({ upsert: true }),
    )
    expect(createJobMock).toHaveBeenCalledWith(
      expect.objectContaining({
        document_erf: [
          expect.stringMatching(/^employee-request-forms\/.+\/document_erf\/.+\.docx$/),
        ],
      }),
      { refresh: false },
    )
  })

  it('does not claim success when no fields could be recognized in the uploaded document', async () => {
    routeState.name = 'employee-request-forms-create'
    setNuxtRouteMock(routeState)

    // Parsing "succeeds" (no thrown error) but recognizes nothing — e.g. a
    // PDF whose layout the scanner couldn't match against any known label.
    vi.mocked(extractErfDocumentFields).mockResolvedValueOnce({})

    const { default: EmployeeRequestFormPage } = await import('../EmployeeRequestFormPage.vue')
    const wrapper = mount(EmployeeRequestFormPage)
    await flushPromises()

    const erfDocumentInput = wrapper
      .findAll('input[type="file"]')
      .find((input) => input.attributes('accept')?.includes('.docx'))
    expect(erfDocumentInput).toBeTruthy()

    const uploadedDocument = new File(['erf content'], 'erf-filled.pdf', {
      type: 'application/pdf',
    })
    Object.defineProperty(erfDocumentInput!.element, 'files', {
      value: [uploadedDocument],
      configurable: true,
    })
    await erfDocumentInput!.trigger('change')
    await flushPromises()

    expect(toastSuccessMock).not.toHaveBeenCalled()
    expect(toastErrorMock).toHaveBeenCalledWith(
      'No fields could be recognized in the uploaded document. The file has been kept, but please fill the form manually.',
    )

    const inputs = wrapper.findAll('input[type="text"]')
    expect((inputs[0]!.element as HTMLInputElement).value).toBe('')

    // The document itself should still be staged even though nothing parsed.
    expect(wrapper.text()).toContain('erf-filled.pdf')
  })

  it('clears the mismatch warning once the user selects the correct value', async () => {
    routeState.name = 'employee-request-forms-create'
    setNuxtRouteMock(routeState)

    vi.mocked(extractErfDocumentFields).mockResolvedValueOnce({
      employment_status: 'Freelance',
    })

    const { default: EmployeeRequestFormPage } = await import('../EmployeeRequestFormPage.vue')
    const wrapper = mount(EmployeeRequestFormPage)
    await flushPromises()

    const erfDocumentInput = wrapper
      .findAll('input[type="file"]')
      .find((input) => input.attributes('accept')?.includes('.docx'))
    expect(erfDocumentInput).toBeTruthy()

    const uploadedDocument = new File(['erf content'], 'erf-filled.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    Object.defineProperty(erfDocumentInput!.element, 'files', {
      value: [uploadedDocument],
      configurable: true,
    })
    await erfDocumentInput!.trigger('change')
    await flushPromises()

    expect(wrapper.text()).toContain(
      'This value from the uploaded document does not match existing master data. Please review it.',
    )

    const employmentStatusSelect = wrapper
      .findAll('select')
      .find((select) => select.html().includes('>Daily<'))
    expect(employmentStatusSelect).toBeTruthy()
    await employmentStatusSelect!.setValue('Daily')
    await flushPromises()

    expect(wrapper.text()).not.toContain(
      'This value from the uploaded document does not match existing master data. Please review it.',
    )
  })

  it('saves the resolved master data name (not the as-typed text) when a fuzzy match is found', async () => {
    routeState.name = 'employee-request-forms-create'
    setNuxtRouteMock(routeState)

    // Every one of these has a small typo relative to the master data fixtures
    // above (PT One, Operations, Engineering, Senior, Daily, Replacement,
    // Jane Manager - Engineering Manager). A fuzzy match should still resolve
    // each, and the *master* spelling/id must be what gets saved — for
    // pt_pembebanan/department in particular, the save-time lookup requires an
    // exact name match, so saving the as-typed text would silently null out
    // pt_id/department_id.
    vi.mocked(extractErfDocumentFields).mockResolvedValueOnce({
      pt_pembebanan: 'PT Onee',
      bu_category: 'Operation',
      department: 'Enginering',
      designation: 'Senio',
      employment_status: 'Dailyy',
      position_status: 'Replacment',
      direct_manager: 'Jane Manager - Enginering Manager',
    })

    const { default: EmployeeRequestFormPage } = await import('../EmployeeRequestFormPage.vue')
    const wrapper = mount(EmployeeRequestFormPage)
    await flushPromises()

    const inputs = wrapper.findAll('input[type="text"]')
    await inputs[0]!.setValue('Platform Engineer')

    const erfDocumentInput = wrapper
      .findAll('input[type="file"]')
      .find((input) => input.attributes('accept')?.includes('.docx'))
    expect(erfDocumentInput).toBeTruthy()

    const uploadedDocument = new File(['erf content'], 'erf-filled.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    Object.defineProperty(erfDocumentInput!.element, 'files', {
      value: [uploadedDocument],
      configurable: true,
    })
    await erfDocumentInput!.trigger('change')
    await flushPromises()

    expect(wrapper.text()).not.toContain(
      'This value from the uploaded document does not match existing master data. Please review it.',
    )
    expect(toastSuccessMock).toHaveBeenCalledWith(
      'ERF data has been auto-filled from the uploaded document.',
    )

    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(createJobMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pt_pembebanan: 'PT One',
        bu_id: 'bu-1',
        department: 'Engineering',
        master_designation_id: 'des-1',
        employment_status: 'Daily',
        position_status: 'Replacement',
        direct_manager: 'Jane Manager - Engineering Manager',
      }),
      { refresh: false },
    )
  })

  it('shows approval preview from master approval after selecting designation', async () => {
    routeState.name = 'employee-request-forms-create'
    setNuxtRouteMock(routeState)

    const { default: EmployeeRequestFormPage } = await import('../EmployeeRequestFormPage.vue')
    const wrapper = mount(EmployeeRequestFormPage)

    await flushPromises()

    expect(wrapper.text()).toContain('Approval')
    expect(wrapper.text()).toContain('Select designation first to preview the approval flow.')

    const designationSelect = wrapper
      .findAll('select')
      .find((select) => select.html().includes('value="des-1"'))
    expect(designationSelect).toBeTruthy()

    await designationSelect!.setValue('des-1')
    await flushPromises()

    expect(wrapper.text()).toContain(
      'Director BU is selected manually. Other approvers below come from Master Approval for Designation.',
    )
    expect(wrapper.text()).toContain('Director BU')
    expect(wrapper.text()).toContain('Hana Recruiter - HR Admin')
    expect(wrapper.text()).toContain('Manager Approval')
    expect(wrapper.text()).toContain('Jane Manager - Engineering Manager')
    expect(wrapper.text()).toContain('John Director - Director BU')

    const managerApprovalInput = wrapper
      .findAll('input[type="text"]')
      .find(
        (input) =>
          (input.element as HTMLInputElement).value === 'Jane Manager - Engineering Manager',
      )
    expect(managerApprovalInput).toBeTruthy()
    expect((managerApprovalInput!.element as HTMLInputElement).disabled).toBe(false)
    expect((managerApprovalInput!.element as HTMLInputElement).readOnly).toBe(true)
  })

  it('warns when required date is earlier than designation lead time without blocking submit', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-14T10:00:00+07:00'))

    optionsByTypeRef.value = {
      ...optionsByTypeRef.value,
      designation: [
        {
          id: 'des-1',
          name: 'Senior',
          description: null,
          required_date_min_months: 1,
          created_at: null,
          updated_at: null,
        },
      ],
    }

    routeState.name = 'employee-request-forms-create'
    setNuxtRouteMock(routeState)

    const { default: EmployeeRequestFormPage } = await import('../EmployeeRequestFormPage.vue')
    const wrapper = mount(EmployeeRequestFormPage)

    await flushPromises()

    const designationSelect = wrapper
      .findAll('select')
      .find((select) => select.html().includes('value="des-1"'))
    expect(designationSelect).toBeTruthy()

    await designationSelect!.setValue('des-1')
    await flushPromises()

    const directorBuSelect = wrapper
      .findAll('select')
      .filter((select) => select.html().includes('value="director-1"'))
    const directorBuSelectField = directorBuSelect[directorBuSelect.length - 1]
    expect(directorBuSelectField).toBeTruthy()
    await directorBuSelectField!.setValue('director-1')
    await flushPromises()

    const dateInputs = wrapper.findAll('input[type="date"]')
    const requiredDateInput = dateInputs[1]
    expect((requiredDateInput!.element as HTMLInputElement).min).toBe('')

    await requiredDateInput!.setValue('2026-05-01')

    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain(
      'Warning: Required Date for Senior is earlier than the suggested minimum 2026-05-14 (1 month from today).',
    )
    expect(createJobMock).toHaveBeenCalled()
    expect(toastErrorMock).not.toHaveBeenCalledWith(
      expect.stringContaining('Required Date for Senior'),
    )

    vi.useRealTimers()
  })

  it('loads the selected ERF in edit mode and submits updates', async () => {
    routeState.name = 'employee-request-forms-edit'
    routeState.params = { id: 'job-1' }
    setNuxtRouteMock(routeState)
    jobsRef.value = [createJob()]
    getJobByIdMock.mockImplementation(
      async (id: string) => jobsRef.value.find((job) => job.id === id) ?? null,
    )

    const { default: EmployeeRequestFormPage } = await import('../EmployeeRequestFormPage.vue')
    const wrapper = mount(EmployeeRequestFormPage)

    await flushPromises()

    expect(wrapper.text()).not.toContain('Custom Group 1')
    expect(getJobByIdMock).toHaveBeenCalledWith('job-1', { includeSupplementaryData: false })
    expect(loadMasterDataOptionsMock).toHaveBeenCalled()

    const textInputs = wrapper.findAll('input[type="text"]')
    const mainPositionInput = textInputs.find(
      (input) => (input.element as HTMLInputElement).value === 'Backend Engineer',
    )
    expect(mainPositionInput).toBeTruthy()

    await wrapper.findAll('select')[0]!.setValue('director-1')

    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(updateJobMock).toHaveBeenCalledWith(
      'job-1',
      expect.objectContaining({
        created_by: 'director-1',
        requested_date: '2026-03-09',
        main_position: 'Backend Engineer',
        department: 'Engineering',
      }),
      { refresh: false },
    )
    expect(toastUpdatedMock).toHaveBeenCalledWith('ERF')
    expect(routerPushMock).toHaveBeenCalledWith('/employee-request-forms')
  })

  it('shows an error and goes back when the requested ERF does not exist', async () => {
    routeState.name = 'employee-request-forms-detail'
    routeState.params = { id: 'missing-job' }
    setNuxtRouteMock(routeState)
    jobsRef.value = []
    loadingRef.value = false
    getJobByIdMock.mockResolvedValue(null)

    const { default: EmployeeRequestFormPage } = await import('../EmployeeRequestFormPage.vue')
    mount(EmployeeRequestFormPage)

    await flushPromises()

    expect(toastErrorMock).toHaveBeenCalledWith('ERF data not found.')
    expect(routerBackMock).toHaveBeenCalled()
  })
})
