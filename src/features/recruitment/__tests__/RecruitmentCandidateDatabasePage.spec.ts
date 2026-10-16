import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import {
  resetNuxtNavigationMocks,
  setNuxtRouterMock,
} from '../../../../test-utils/nuxt-imports-stub'
import type { CandidateForm } from '@/domain/entities/CandidateForm'

const routerPushMock = vi.fn()
const refreshMock = vi.fn()
const getCandidateByIdMock = vi.fn()
const hasAnyPermissionMock = vi.fn()
const callBackendApiMock = vi.fn()
const fetchBackendApiMock = vi.fn()
const toastSuccessMock = vi.fn()
const toastErrorMock = vi.fn()
const anchorClickMock = vi.fn()

const candidatesRef = ref<CandidateForm[]>([])
const loadingRef = ref(false)
const errorRef = ref('')

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

vi.mock('@/presentation/components/tables/TablePagination.vue', () => ({
  default: defineComponent({
    template: '<div data-testid="pagination">Pagination</div>',
  }),
}))

vi.mock('@/presentation/components/feedback/AppLoadingOverlay.vue', () => ({
  default: defineComponent({
    props: ['message'],
    template: '<div data-testid="loading-overlay">{{ message }}</div>',
  }),
}))

vi.mock('@/presentation/components/feedback/useAppToast', () => ({
  useAppToast: () => ({
    success: toastSuccessMock,
    error: toastErrorMock,
  }),
}))

vi.mock('@/infrastructure/http/backendApi', () => ({
  callBackendApi: callBackendApiMock,
  fetchBackendApi: fetchBackendApiMock,
}))

vi.mock('@/viewmodels/useAuthViewModel', () => ({
  useAuthViewModel: () => ({
    hasAnyPermission: hasAnyPermissionMock,
  }),
}))

vi.mock('@/viewmodels/useCandidateFormViewModel', () => ({
  useCandidateFormViewModel: () => ({
    candidates: candidatesRef,
    loading: loadingRef,
    error: errorRef,
    refresh: refreshMock,
    getById: getCandidateByIdMock,
  }),
}))

function createCandidate(overrides: Partial<CandidateForm> = {}): CandidateForm {
  return {
    id: 'candidate-1',
    employee_request_form_id: 'erf-1',
    candidate_id: 'profile-1',
    role: 'candidate',
    candidate_source: 'local',
    completion_status: 'in_progress',
    photograph: null,
    date_application: '2026-03-10',
    notice_period: null,
    first_name: 'John',
    middle_name: null,
    last_name: 'Doe',
    full_name: null,
    hire_location: null,
    date_of_birth: '1998-01-01',
    place_of_birth: 'Jakarta',
    nationality: 'Indonesia',
    marital_status: 'Single',
    religion: null,
    gender: 'Male',
    ethnic: null,
    blood_type: null,
    id_card_address: null,
    residential_address: null,
    personal_email: 'john@example.com',
    instagram: null,
    linkedin: null,
    phone_number: '08123',
    home_phone: null,
    id_type: null,
    id_no: '3171',
    available_start_date: '2026-04-01',
    join_date: null,
    transportation_type: null,
    transportation_ownership: null,
    residence_ownership: null,
    created_at: '2026-03-10T08:00:00',
    updated_at: '2026-03-10T08:00:00',
    employee_request_form: {
      id: 'erf-1',
      main_position: 'Backend Engineer',
      pt_name: 'PT One',
      department: 'Engineering',
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
  } as CandidateForm
}

describe('RecruitmentCandidateDatabasePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    resetNuxtNavigationMocks()
    setNuxtRouterMock({ push: routerPushMock })
    window.localStorage.clear()
    vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:download-url')
    vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => undefined)
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(anchorClickMock)

    hasAnyPermissionMock.mockReturnValue(true)

    const candidateOne = createCandidate()
    const candidateTwo = createCandidate({
      id: 'candidate-2',
      employee_request_form_id: 'erf-2',
      role: 'employee',
      candidate_source: 'candidate_service',
      completion_status: 'completed',
      first_name: 'Fina',
      last_name: 'Analyst',
      personal_email: 'fina@example.com',
      phone_number: '08222',
      date_application: '2026-03-15',
      available_start_date: '2026-04-15',
      employee_request_form: {
        id: 'erf-2',
        main_position: 'Finance Analyst',
        pt_name: 'PT Two',
        department: 'Finance',
        site: 'Bandung',
      },
    })

    candidatesRef.value = [candidateOne, candidateTwo]
    loadingRef.value = false
    errorRef.value = ''
    refreshMock.mockResolvedValue(undefined)
    callBackendApiMock.mockImplementation(async (path: string) => {
      if (path === '/api/candidate-forms/export-jobs') {
        return {
          export_job: {
            id: 'job-1',
            status: 'queued',
            error: null,
            filename: null,
          },
        }
      }

      if (path === '/api/candidate-forms/export-jobs/job-1') {
        return {
          export_job: {
            id: 'job-1',
            status: 'completed',
            error: null,
            filename: 'candidate-forms-all.xlsx',
          },
        }
      }

      throw new Error(`Unexpected path: ${path}`)
    })
    fetchBackendApiMock.mockResolvedValue({
      blob: vi.fn().mockResolvedValue(new Blob(['xlsx'])),
      headers: {
        get: vi.fn(() => 'attachment; filename="candidate-forms-all.xlsx"'),
      },
    })
    getCandidateByIdMock.mockImplementation(async (id: string) => {
      if (id === 'candidate-1') {
        return createCandidate({
          id: 'candidate-1',
          education: [
            {
              id: 'edu-1',
              candidate_form_id: 'candidate-1',
              level: 'Sarjana (S1)',
              institution: 'ITB',
              city: 'Bandung',
              major: 'Informatika',
              from_year: 2016,
              to_year: 2020,
              category: 'Formal Education',
              description: null,
            },
          ],
          work_history: [
            {
              id: 'work-1',
              candidate_form_id: 'candidate-1',
              company: 'PT Tech',
              position: 'Senior Engineer',
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
        })
      }

      if (id === 'candidate-2') {
        return createCandidate({
          id: 'candidate-2',
          employee_request_form_id: 'erf-2',
          role: 'employee',
          candidate_source: 'candidate_service',
          completion_status: 'completed',
          first_name: 'Fina',
          last_name: 'Analyst',
          personal_email: 'fina@example.com',
          phone_number: '08222',
          date_application: '2026-03-15',
          available_start_date: '2026-04-15',
          employee_request_form: {
            id: 'erf-2',
            main_position: 'Finance Analyst',
            pt_name: 'PT Two',
            department: 'Finance',
            site: 'Bandung',
          },
          education: [
            {
              id: 'edu-2',
              candidate_form_id: 'candidate-2',
              level: 'Diploma IV (D4)',
              institution: 'Polban',
              city: 'Bandung',
              major: 'Akuntansi',
              from_year: 2015,
              to_year: 2019,
              category: 'Formal Education',
              description: null,
            },
          ],
          work_history: [
            {
              id: 'work-2',
              candidate_form_id: 'candidate-2',
              company: 'PT Finance',
              position: 'Finance Staff',
              from_year: 2020,
              to_year: 2024,
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
        })
      }

      return null
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders candidates and hydrates paged details for education and work history', async () => {
    const { default: RecruitmentCandidateDatabasePage } = await import('../RecruitmentCandidateDatabasePage.vue')
    const wrapper = mount(RecruitmentCandidateDatabasePage)

    await flushPromises()
    await flushPromises()

    expect(getCandidateByIdMock).toHaveBeenCalledWith('candidate-1')
    expect(getCandidateByIdMock).toHaveBeenCalledWith('candidate-2')
    expect(wrapper.text()).toContain('Backend Engineer')
    expect(wrapper.text()).toContain('Finance Analyst')
    expect(wrapper.text()).toContain('Sarjana (S1) - ITB - Informatika')
    expect(wrapper.text()).toContain('Senior Engineer - PT Tech')
    expect(wrapper.text()).toContain('Diploma IV (D4) - Polban - Akuntansi')
    expect(wrapper.text()).toContain('Finance Staff - PT Finance')
  })

  it('filters candidates by search, status, department, and application date', async () => {
    const { default: RecruitmentCandidateDatabasePage } = await import('../RecruitmentCandidateDatabasePage.vue')
    const wrapper = mount(RecruitmentCandidateDatabasePage)

    await flushPromises()
    await flushPromises()

    await wrapper.get('input[type="search"]').setValue('finance')
    await flushPromises()

    expect(wrapper.text()).toContain('Finance Analyst')
    expect(wrapper.text()).not.toContain('John Doe')

    const selects = wrapper.findAll('select')
    await selects[0]!.setValue('completed')
    await selects[3]!.setValue('Finance')
    await flushPromises()

    const dateInputs = wrapper.findAll('input[type="date"]')
    await dateInputs[0]!.setValue('2026-03-12')
    await dateInputs[1]!.setValue('2026-03-20')
    await flushPromises()

    expect(wrapper.text()).toContain('Finance Analyst')
    expect(wrapper.text()).not.toContain('John Doe')
  })

  it('opens candidate form detail when the detail action is clicked', async () => {
    const { default: RecruitmentCandidateDatabasePage } = await import('../RecruitmentCandidateDatabasePage.vue')
    const wrapper = mount(RecruitmentCandidateDatabasePage)

    await flushPromises()
    await flushPromises()

    const detailButton = wrapper.findAll('button').find((button) => button.text() === 'Detail')
    await detailButton!.trigger('click')

    expect(routerPushMock).toHaveBeenCalledWith('/candidate-forms/candidate-1')
  })

  it('exports filtered candidates to Excel from recruitment candidate data page', async () => {
    const { default: RecruitmentCandidateDatabasePage } = await import('../RecruitmentCandidateDatabasePage.vue')
    const wrapper = mount(RecruitmentCandidateDatabasePage)

    await flushPromises()
    await flushPromises()

    await wrapper.get('input[type="search"]').setValue('finance')
    await flushPromises()

    const exportButton = wrapper.findAll('button').find((button) => button.text() === 'Export Excel')
    await exportButton!.trigger('click')
    await flushPromises()
    await vi.runAllTimersAsync()
    await flushPromises()

    expect(callBackendApiMock).toHaveBeenNthCalledWith(
      1,
      '/api/candidate-forms/export-jobs',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          candidate_form_ids: ['candidate-2'],
        }),
      }),
    )
    expect(callBackendApiMock).toHaveBeenNthCalledWith(
      2,
      '/api/candidate-forms/export-jobs/job-1',
    )
    expect(fetchBackendApiMock).toHaveBeenCalledWith('/api/candidate-forms/export-jobs/job-1/download')
    expect(anchorClickMock).toHaveBeenCalled()
    expect(toastSuccessMock).toHaveBeenNthCalledWith(
      1,
      'The system is preparing the export file. Download will start automatically.',
    )
    expect(toastSuccessMock).toHaveBeenNthCalledWith(
      2,
      'Candidate form Excel exported successfully.',
    )
  })
})
