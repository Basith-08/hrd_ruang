import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import {
  resetNuxtNavigationMocks,
  setNuxtRouteMock,
  setNuxtRouterMock,
} from '../../../../test-utils/nuxt-imports-stub'
import type { CandidateForm, EmployeeDocuments } from '@/domain/entities/CandidateForm'

const routeState = {
  name: 'candidate-forms-create',
  params: {} as Record<string, string>,
}

const routerPushMock = vi.fn()
const routerReplaceMock = vi.fn()
const routerBackMock = vi.fn()

const toastCreatedMock = vi.fn()
const toastUpdatedMock = vi.fn()
const toastSuccessMock = vi.fn()
const toastErrorMock = vi.fn()

const createCandidateMock = vi.fn()
const getCandidateByIdMock = vi.fn()
const updateCandidateMock = vi.fn()
const refreshCandidatesMock = vi.fn()
const updateCandidateStatusMock = vi.fn()
const refreshJobsMock = vi.fn()
const hasPermissionMock = vi.fn()
const hasAnyPermissionMock = vi.fn()
const callBackendApiMock = vi.fn()

const createSignedUrlMock = vi.fn()
const uploadMock = vi.fn()
const storageFromMock = vi.fn()

const candidatesRef = ref<CandidateForm[]>([])
const candidateLoadingRef = ref(false)
const candidateErrorRef = ref('')
const candidateSavingRef = ref(false)

const jobsRef = ref<Array<{ id: string; main_position: string; designation: string }>>([])
const employeeRequestFormErrorRef = ref('')

const userRef = ref({
  id: 'user-1',
  email: 'user@example.com',
  full_name: 'User Example',
  phone: '08111',
  personal_data: {},
})
const userRoleRef = ref('super_admin')

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
    success: toastSuccessMock,
    error: toastErrorMock,
  }),
}))

vi.mock('@/viewmodels/useCandidateFormViewModel', () => ({
  useCandidateFormViewModel: () => ({
    candidates: candidatesRef,
    loading: candidateLoadingRef,
    error: candidateErrorRef,
    saving: candidateSavingRef,
    create: createCandidateMock,
    getById: getCandidateByIdMock,
    update: updateCandidateMock,
    refresh: refreshCandidatesMock,
    updateStatus: updateCandidateStatusMock,
  }),
}))

vi.mock('@/viewmodels/useEmployeeRequestFormViewModel', () => ({
  useEmployeeRequestFormViewModel: () => ({
    jobs: jobsRef,
    error: employeeRequestFormErrorRef,
    refresh: refreshJobsMock,
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

vi.mock('@/infrastructure/supabase/client', () => ({
  supabase: {
    storage: {
      from: storageFromMock,
    },
  },
}))

vi.mock('@/infrastructure/http/backendApi', () => ({
  callBackendApi: callBackendApiMock,
}))

function createCandidate(overrides: Partial<CandidateForm> = {}): CandidateForm {
  return {
    id: 'candidate-1',
    employee_request_form_id: 'job-1',
    candidate_id: 'user-1',
    completion_status: 'in_progress',
    photograph: '',
    date_application: '2026-03-01',
    notice_period: '',
    first_name: 'Jane',
    middle_name: '',
    last_name: 'Doe',
    hire_location: '',
    date_of_birth: '',
    place_of_birth: '',
    nationality: '',
    marital_status: null,
    religion: '',
    gender: null,
    ethnic: '',
    blood_type: null,
    id_card_address: '',
    residential_address: '',
    personal_email: 'jane@example.com',
    instagram: '',
    linkedin: '',
    phone_number: '08123',
    home_phone: '',
    id_type: '',
    id_no: '',
    available_start_date: '',
    join_date: '',
    transportation_type: '',
    transportation_ownership: '',
    residence_ownership: '',
    created_at: '2026-03-10T08:00:00',
    updated_at: '2026-03-10T08:00:00',
    employee_request_form: {
      id: 'job-1',
      main_position: 'Backend Engineer',
      site: 'Jakarta',
    },
    family_and_emergency: [],
    education: [],
    work_history: [],
    candidate_languages: [],
    candidate_skills: [],
    candidate_references: [],
    personal_statement: null,
    ...overrides,
  }
}

function createEmployeeDocuments(overrides: Partial<EmployeeDocuments> = {}): EmployeeDocuments {
  return {
    cv: [],
    integrity_pact: [],
    email_usage_policy: [],
    identity_card: [],
    family_card: [],
    latest_diploma: [],
    academic_transcript: [],
    certificate_of_employment: [],
    tax_id: [],
    bpjs_health_card: [],
    bpjs_health_statement: [],
    bpjs_employment_card: [],
    bank_account_book: [],
    format_office: [],
    skb: [],
    other: [],
    ...overrides,
  }
}

describe('CandidateFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeState.name = 'candidate-forms-create'
    routeState.params = {}
    resetNuxtNavigationMocks()
    setNuxtRouteMock(routeState)
    setNuxtRouterMock({
      push: routerPushMock,
      replace: routerReplaceMock,
      back: routerBackMock,
    })

    candidatesRef.value = []
    candidateLoadingRef.value = false
    candidateErrorRef.value = ''
    candidateSavingRef.value = false

    jobsRef.value = [
      {
        id: 'job-1',
        main_position: 'Backend Engineer',
        designation: 'Senior',
      },
    ]
    employeeRequestFormErrorRef.value = ''
    userRef.value = {
      id: 'user-1',
      email: 'user@example.com',
      full_name: 'User Example',
      phone: '08111',
      personal_data: {},
    }
    userRoleRef.value = 'super_admin'
    hasPermissionMock.mockReturnValue(true)
    hasAnyPermissionMock.mockReturnValue(true)

    createCandidateMock.mockResolvedValue(undefined)
    getCandidateByIdMock.mockImplementation(async (id: string) =>
      candidatesRef.value.find((candidate) => candidate.id === id) ?? null,
    )
    updateCandidateMock.mockResolvedValue(undefined)
    refreshCandidatesMock.mockResolvedValue(undefined)
    updateCandidateStatusMock.mockResolvedValue(undefined)
    refreshJobsMock.mockResolvedValue(undefined)

    createSignedUrlMock.mockResolvedValue({
      data: {
        signedUrl: 'https://signed.example/file',
      },
      error: null,
    })
    uploadMock.mockResolvedValue({ error: null })
    storageFromMock.mockReturnValue({
      createSignedUrl: createSignedUrlMock,
      upload: uploadMock,
    })
    callBackendApiMock.mockResolvedValue({ signed_url: 'https://signed.example/document' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    resetNuxtNavigationMocks()
  })

  it('redirects candidate users with their own existing form to edit mode', async () => {
    routeState.name = 'candidate-forms-create'
    setNuxtRouteMock(routeState)
    userRoleRef.value = 'candidate'
    candidatesRef.value = [createCandidate({ id: 'candidate-self' })]

    const { default: CandidateFormPage } = await import('../CandidateFormPage.vue')
    mount(CandidateFormPage)

    await flushPromises()

    expect(routerReplaceMock).toHaveBeenCalledWith('/candidate-forms/candidate-self/edit')
  })

  it('renders the create route as read-only without save actions', async () => {
    routeState.name = 'candidate-forms-create'
    setNuxtRouteMock(routeState)

    const { default: CandidateFormPage } = await import('../CandidateFormPage.vue')
    const wrapper = mount(CandidateFormPage)

    await flushPromises()

    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).toContain('Back')
    expect(createCandidateMock).not.toHaveBeenCalled()
    expect(updateCandidateMock).not.toHaveBeenCalled()
    expect(wrapper.text()).not.toContain('Save Candidate Form')
  })

  it('loads the existing candidate in read-only mode and shows candidate documents', async () => {
    routeState.name = 'candidate-forms-edit'
    routeState.params = { id: 'candidate-1' }
    setNuxtRouteMock(routeState)
    candidatesRef.value = [createCandidate()]
    getCandidateByIdMock.mockResolvedValueOnce(
      createCandidate({
        employee_documents: createEmployeeDocuments({
          cv: ['candidate-forms/user-1/cv/cv.pdf'],
          identity_card: ['candidate-forms/user-1/id-card.pdf'],
          family_card: ['candidate-forms/user-1/family-card.pdf'],
          latest_diploma: ['candidate-forms/user-1/diploma.pdf'],
          academic_transcript: ['candidate-forms/user-1/transcript.pdf'],
          certificate_of_employment: ['candidate-forms/user-1/coe.pdf'],
        }),
      }),
    )

    const { default: CandidateFormPage } = await import('../CandidateFormPage.vue')
    const wrapper = mount(CandidateFormPage)

    await flushPromises()

    const firstNameInput = wrapper
      .findAll('input')
      .find((input) => (input.element as HTMLInputElement).value === 'Jane Doe')

    expect(firstNameInput).toBeTruthy()
    expect(getCandidateByIdMock).toHaveBeenCalledWith('candidate-1')
    expect(wrapper.text()).toContain('Candidate Documents')
    expect(wrapper.text()).toContain('Identity Card')
    expect(wrapper.text()).toContain('Latest Degree Certificate')
    expect(wrapper.text()).toContain('Certificate of Employment (CoE)')
    expect(wrapper.text()).not.toContain('Payroll & Statutory Data')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Update Candidate Form')
    expect(updateCandidateMock).not.toHaveBeenCalled()
  })

  it('uses fetched candidate-service form details when the route id is the application id', async () => {
    routeState.name = 'candidate-forms-detail'
    routeState.params = { id: 'application-1' }
    setNuxtRouteMock(routeState)
    candidatesRef.value = [
      createCandidate({
        id: 'application-1',
        candidate_source: 'candidate_service',
        candidate_service_application_id: 'application-1',
        employee_documents: createEmployeeDocuments(),
      }),
    ]
    getCandidateByIdMock.mockResolvedValueOnce(
      createCandidate({
        id: 'form-1',
        candidate_source: 'candidate_service',
        candidate_service_form_id: 'form-1',
        candidate_service_application_id: 'application-1',
        employee_documents: createEmployeeDocuments({
          cv: ['candidate-documents/user-1/cv/cv.pdf'],
          identity_card: ['candidate-documents/user-1/id-card.pdf'],
        }),
      }),
    )

    const { default: CandidateFormPage } = await import('../CandidateFormPage.vue')
    const wrapper = mount(CandidateFormPage)

    await flushPromises()

    expect(getCandidateByIdMock).toHaveBeenCalledWith('application-1')
    expect(wrapper.text()).toContain('Candidate Documents')
    expect(wrapper.text()).toContain('CV.pdf')
    expect(wrapper.text()).toContain('id card.pdf')
    expect(wrapper.text()).not.toContain('Document not available')

    const openMock = vi.fn()
    vi.stubGlobal('open', openMock)
    const cvButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('CV.pdf'))
    expect(cvButton).toBeTruthy()
    await cvButton?.trigger('click')
    await flushPromises()

    expect(callBackendApiMock).toHaveBeenCalledWith(
      '/api/candidate-forms/documents/sign-url',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          bucket: 'candidate-documents',
          candidate_form_id: 'form-1',
          path: 'candidate-documents/user-1/cv/cv.pdf',
          storage_source: 'candidate_service',
        }),
      }),
    )
    expect(openMock).toHaveBeenCalledWith(
      'https://signed.example/document',
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('uses fetched candidate-service form details when the route id is the candidate account id', async () => {
    routeState.name = 'candidate-forms-detail'
    routeState.params = { id: 'candidate-account-1' }
    setNuxtRouteMock(routeState)
    candidatesRef.value = [
      createCandidate({
        id: 'application-1',
        candidate_source: 'candidate_service',
        candidate_service_application_id: 'application-1',
        candidate_service_candidate_id: 'candidate-account-1',
        employee_documents: createEmployeeDocuments(),
      }),
    ]
    getCandidateByIdMock.mockResolvedValueOnce(
      createCandidate({
        id: 'form-1',
        candidate_source: 'candidate_service',
        candidate_service_form_id: 'form-1',
        candidate_service_application_id: 'application-1',
        candidate_service_candidate_id: 'candidate-account-1',
        employee_documents: createEmployeeDocuments({
          cv: ['candidate-documents/user-1/cv/cv.pdf'],
          latest_diploma: ['candidate-documents/user-1/diploma.pdf'],
        }),
      }),
    )

    const { default: CandidateFormPage } = await import('../CandidateFormPage.vue')
    const wrapper = mount(CandidateFormPage)

    await flushPromises()

    expect(getCandidateByIdMock).toHaveBeenCalledWith('candidate-account-1')
    expect(wrapper.text()).toContain('Candidate Documents')
    expect(wrapper.text()).toContain('CV.pdf')
    expect(wrapper.text()).toContain('Latest Degree Certificate.pdf')
    expect(wrapper.text()).not.toContain('Document not available')
  })

  it('keeps empty candidate document cards without missing-state overlays', async () => {
    routeState.name = 'candidate-forms-edit'
    routeState.params = { id: 'candidate-missing-docs' }
    setNuxtRouteMock(routeState)
    candidatesRef.value = [createCandidate({ id: 'candidate-missing-docs' })]
    getCandidateByIdMock.mockResolvedValueOnce(
      createCandidate({
        id: 'candidate-missing-docs',
        employee_documents: createEmployeeDocuments({
          cv: ['candidate-forms/user-1/cv/cv.pdf'],
        }),
      }),
    )

    const { default: CandidateFormPage } = await import('../CandidateFormPage.vue')
    const wrapper = mount(CandidateFormPage)

    await flushPromises()

    expect(wrapper.findAll('.candidate-form-document-card')).toHaveLength(6)
    expect(wrapper.text()).toContain('CV')
    expect(wrapper.text()).toContain('CV.pdf')
    expect(wrapper.text()).toContain('Identity Card')
    expect(wrapper.text()).toContain('Family Card')
    expect(wrapper.text()).toContain('Latest Degree Certificate')
    expect(wrapper.text()).toContain('Academic Transcript')
    expect(wrapper.text()).toContain('Certificate of Employment (CoE)')
    expect(wrapper.text()).not.toContain('Document not available')
  })

  it('renders employee copy as read-only and allows viewing previous candidate data', async () => {
    routeState.name = 'candidate-forms-detail'
    routeState.params = { id: 'employee-1' }
    setNuxtRouteMock(routeState)
    candidatesRef.value = [
      createCandidate({
        id: 'employee-1',
        role: 'employee',
        employee_payroll_profile: {
          candidate_form_id: 'employee-1',
          bank_name: 'BCA',
          bank_account_number: '1234567890',
          account_holder_name: 'Jane Doe',
          branch_name: 'Jakarta',
          tax_identification_number: '09.999.888.7-123.000',
          bpjs_health_enrollment_preference: 'decline_enrollment',
          bpjs_health_decline_reason: 'other',
          bpjs_health_decline_reason_other: 'Covered by spouse',
          bpjs_employment_status: 'continue_existing',
        },
        employee_documents: createEmployeeDocuments({
          cv: ['employee-forms/user-1/cv/cv.pdf'],
          integrity_pact: ['employee-forms/user-1/integrity-pact.pdf'],
          email_usage_policy: ['employee-forms/user-1/email-policy.pdf'],
          identity_card: ['employee-forms/user-1/id-card.pdf'],
          family_card: ['employee-forms/user-1/family-card.pdf'],
          latest_diploma: ['employee-forms/user-1/diploma.pdf'],
          academic_transcript: ['employee-forms/user-1/transcript.pdf'],
          tax_id: ['employee-forms/user-1/tax-id.pdf'],
          bpjs_health_card: ['employee-forms/user-1/bpjs-health.pdf'],
          bpjs_health_statement: ['employee-forms/user-1/bpjs-statement.pdf'],
          bpjs_employment_card: ['employee-forms/user-1/bpjs-employment.pdf'],
          bank_account_book: ['employee-forms/user-1/bank-book.pdf'],
        }),
      }),
    ]

    const { default: CandidateFormPage } = await import('../CandidateFormPage.vue')
    const wrapper = mount(CandidateFormPage)

    await flushPromises()

    expect(wrapper.text()).toContain('Employee Form Details')
    expect(wrapper.text()).toContain('Candidate Data')
    expect(wrapper.text()).toContain('Contract Documents')
    expect(wrapper.text()).toContain('Payroll & Statutory Data')
    expect(wrapper.text()).toContain('Employee Documents')
    expect(wrapper.text()).toContain('Integrity Pact')
    expect(wrapper.text()).toContain('Email Usage Policy')
    expect(wrapper.text()).toContain('Tax Identification Number')
    expect(wrapper.text()).toContain('BPJS Health Card')
    expect(wrapper.text()).toContain('BPJS Employment Card')
    expect(wrapper.text()).toContain('Bank Account Book')
    expect(wrapper.text()).not.toContain('Draft Employment Contract')
    expect(wrapper.text()).not.toContain('SKB')
    expect(wrapper.text()).not.toContain('CV')
    expect(wrapper.text()).not.toContain('Family Card')
    expect(wrapper.text()).not.toContain('Latest Degree Certificate')
    expect(wrapper.text()).not.toContain('Academic Transcript')
    expect(wrapper.text()).not.toContain('Certificate of Employment (CoE)')
    expect(wrapper.text()).not.toContain('Application Data')
    expect(wrapper.text()).not.toContain('Personal Data')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Update Employee Form')
    expect(updateCandidateMock).not.toHaveBeenCalled()

    const contractDocumentsButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Contract Documents'))
    expect(contractDocumentsButton).toBeTruthy()
    await contractDocumentsButton?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Draft Employment Contract')
    expect(wrapper.text()).toContain('SKB')
    expect(wrapper.text()).not.toContain('Payroll & Statutory Data')
    expect(wrapper.text()).not.toContain('Upload PDF')

    const CandidateDataButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Candidate Data'))
    expect(CandidateDataButton).toBeTruthy()
    await CandidateDataButton?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Application Data')
    expect(wrapper.text()).toContain('Personal Data')
    expect(wrapper.text()).toContain('Candidate Documents')
    expect(wrapper.text()).toContain('Identity Card')
    expect(wrapper.text()).toContain('Certificate of Employment (CoE)')
    expect(wrapper.text()).not.toContain('Document not available')
    expect(wrapper.text()).not.toContain('Payroll & Statutory Data')
  })

  it('shows an error and goes back when the requested candidate is not found', async () => {
    routeState.name = 'candidate-forms-detail'
    routeState.params = { id: 'missing-candidate' }
    setNuxtRouteMock(routeState)
    candidatesRef.value = []
    candidateLoadingRef.value = false

    const { default: CandidateFormPage } = await import('../CandidateFormPage.vue')
    mount(CandidateFormPage)

    await flushPromises()

    expect(toastErrorMock).toHaveBeenCalledWith('Candidate form not found.')
    expect(routerBackMock).toHaveBeenCalled()
  })

  it('keeps candidate service mirrors read-only in the dashboard', async () => {
    routeState.name = 'candidate-forms-edit'
    routeState.params = { id: 'candidate-mirror' }
    setNuxtRouteMock(routeState)
    candidatesRef.value = [
      createCandidate({
        id: 'candidate-mirror',
        candidate_source: 'candidate_service',
        candidate_service_form_id: 'service-form-1',
      }),
    ]

    const { default: CandidateFormPage } = await import('../CandidateFormPage.vue')
    const wrapper = mount(CandidateFormPage)

    await flushPromises()

    expect(wrapper.find('form').exists()).toBe(false)
    expect(updateCandidateMock).not.toHaveBeenCalled()
    expect(createCandidateMock).not.toHaveBeenCalled()
    expect(wrapper.text()).not.toContain('Update Candidate Form')
  })

  it('enables submission once the draft employment contract is provided and submits selected documents together', async () => {
    routeState.name = 'candidate-forms-detail'
    routeState.params = { id: 'form-1' }
    setNuxtRouteMock(routeState)
    jobsRef.value = [
      {
        id: 'job-1',
        main_position: 'Backend Engineer',
        designation: 'Senior',
        recruitment_flow_stage: 'employee_contract_form_in_progress',
      } as any,
    ]
    candidatesRef.value = [
      createCandidate({
        id: 'form-1',
        role: 'employee',
        candidate_source: 'candidate_service',
        candidate_service_form_id: 'form-1',
        completion_status: 'completed',
        employee_payroll_profile: {
          candidate_form_id: 'form-1',
          bank_name: 'BCA',
          bank_account_number: '1234567890',
          account_holder_name: 'Jane Doe',
          branch_name: 'Jakarta',
          tax_identification_number: '09.999.888.7-123.000',
          bpjs_health_enrollment_preference: 'willing_to_enroll',
          bpjs_health_decline_reason: null,
          bpjs_health_decline_reason_other: null,
          bpjs_employment_status: 'continue_existing',
        },
        employee_documents: createEmployeeDocuments({
          integrity_pact: ['employee-forms/user-1/integrity-pact.pdf'],
          email_usage_policy: ['employee-forms/user-1/email-policy.pdf'],
        }),
      }),
    ]
    getCandidateByIdMock.mockResolvedValueOnce(candidatesRef.value[0])
    callBackendApiMock.mockResolvedValueOnce({
      candidate_form: {
        ...candidatesRef.value[0],
        employee_documents: {
          ...(candidatesRef.value[0]?.employee_documents ?? {}),
          format_office: ['employee-forms/candidate-1/format_office/contract.pdf'],
        },
      },
    })

    const { default: CandidateFormPage } = await import('../CandidateFormPage.vue')
    const wrapper = mount(CandidateFormPage)

    await flushPromises()

    const contractDocumentsButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Contract Documents'))
    expect(contractDocumentsButton).toBeTruthy()
    await contractDocumentsButton?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Draft Employment Contract')
    expect(wrapper.text()).toContain('SKB')
    expect(wrapper.text()).toContain('Lainnya')
    expect(wrapper.text()).toContain('Submit Contract Documents')

    const fileInputs = wrapper.findAll('input[type="file"]')
    expect(fileInputs).toHaveLength(3)
    expect(fileInputs.every((input) => input.attributes('multiple') !== undefined)).toBe(true)

    const submitButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Submit Contract Documents'))
    expect(submitButton).toBeTruthy()
    expect(submitButton?.attributes('disabled')).toBeDefined()

    const draftContractFile = new File(['pdf'], 'draft-contract.pdf', { type: 'application/pdf' })
    Object.defineProperty(fileInputs[0]!.element, 'files', {
      value: [draftContractFile],
      configurable: true,
    })
    await fileInputs[0]!.trigger('change')
    await flushPromises()

    expect(submitButton?.attributes('disabled')).toBeUndefined()

    const skbFile = new File(['pdf'], 'skb.pdf', { type: 'application/pdf' })
    Object.defineProperty(fileInputs[1]!.element, 'files', {
      value: [skbFile],
      configurable: true,
    })
    await fileInputs[1]!.trigger('change')
    await flushPromises()

    expect(submitButton?.attributes('disabled')).toBeUndefined()

    const otherFiles = [
      new File(['pdf'], 'other-1.pdf', { type: 'application/pdf' }),
      new File(['pdf'], 'other-2.pdf', { type: 'application/pdf' }),
    ]
    Object.defineProperty(fileInputs[2]!.element, 'files', {
      value: otherFiles,
      configurable: true,
    })
    await fileInputs[2]!.trigger('change')
    await flushPromises()

    await submitButton?.trigger('click')
    await flushPromises()

    expect(uploadMock).toHaveBeenCalledTimes(4)
    expect(callBackendApiMock).toHaveBeenCalledWith(
      '/api/candidate-forms/form-1/employee-documents',
      expect.objectContaining({
        method: 'POST',
      }),
    )
    const uploadPayload = JSON.parse(String(callBackendApiMock.mock.calls[0]?.[1]?.body ?? '{}'))
    expect(uploadPayload.documents.format_office).toHaveLength(1)
    expect(uploadPayload.documents.format_office[0]).toContain('/format_office/')
    expect(uploadPayload.documents.skb).toHaveLength(1)
    expect(uploadPayload.documents.skb[0]).toContain('/skb/')
    expect(uploadPayload.documents.other).toHaveLength(2)
    expect(uploadPayload.documents.other[0]).toContain('/other/')
    expect(uploadPayload.documents.other[1]).toContain('/other/')
    expect(toastSuccessMock).toHaveBeenCalledWith('Contract documents submitted successfully.')
  })

  it('keeps contract document upload hidden when the ERF is not in employee contract form stage', async () => {
    routeState.name = 'candidate-forms-detail'
    routeState.params = { id: 'form-pending' }
    setNuxtRouteMock(routeState)
    jobsRef.value = [
      {
        id: 'job-1',
        main_position: 'Backend Engineer',
        designation: 'Senior',
        recruitment_flow_stage: 'candidate_selected',
      } as any,
    ]
    candidatesRef.value = [
      createCandidate({
        id: 'form-pending',
        role: 'employee',
        candidate_source: 'candidate_service',
        candidate_service_form_id: 'form-pending',
        completion_status: 'completed',
        employee_payroll_profile: {
          candidate_form_id: 'form-pending',
          bank_name: 'BCA',
          bank_account_number: '1234567890',
          account_holder_name: 'Jane Doe',
          branch_name: 'Jakarta',
          tax_identification_number: '09.999.888.7-123.000',
          bpjs_health_enrollment_preference: 'willing_to_enroll',
          bpjs_health_decline_reason: null,
          bpjs_health_decline_reason_other: null,
          bpjs_employment_status: 'continue_existing',
        },
        employee_documents: createEmployeeDocuments({
          integrity_pact: ['employee-forms/user-1/integrity-pact.pdf'],
          email_usage_policy: ['employee-forms/user-1/email-policy.pdf'],
        }),
      }),
    ]

    const { default: CandidateFormPage } = await import('../CandidateFormPage.vue')
    const wrapper = mount(CandidateFormPage)

    await flushPromises()

    const contractDocumentsButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Contract Documents'))
    expect(contractDocumentsButton).toBeTruthy()
    await contractDocumentsButton?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Draft Employment Contract')
    expect(wrapper.text()).toContain('SKB')
    expect(wrapper.text()).not.toContain('Submit Contract Documents')
  })
})
