import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import {
  resetNuxtNavigationMocks,
  setNuxtRouterMock,
} from '../../../../test-utils/nuxt-imports-stub'
import type { CandidateForm } from '@/domain/entities/CandidateForm'

const routerPushMock = vi.fn()

const toastSuccessMock = vi.fn()
const toastErrorMock = vi.fn()
const toastDeletedMock = vi.fn()

const exportCandidateFormPdfMock = vi.fn()
const refreshCandidatesMock = vi.fn()
const removeCandidateMock = vi.fn()
const getCandidateByIdMock = vi.fn()
const hasPermissionMock = vi.fn()
const hasAnyPermissionMock = vi.fn()

const candidatesRef = ref<CandidateForm[]>([])
const candidateLoadingRef = ref(false)
const candidateErrorRef = ref('')
const candidateSavingRef = ref(false)
const userRoleRef = ref('super_admin')
const previewWindowMock = {
  close: vi.fn(),
}

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
    props: ['page', 'pageSize', 'totalItems'],
    emits: ['update:page'],
    template: '<div data-testid="pagination">Pagination</div>',
  }),
}))

vi.mock('@/presentation/components/feedback/useAppToast', () => ({
  useAppToast: () => ({
    success: toastSuccessMock,
    error: toastErrorMock,
    deleted: toastDeletedMock,
  }),
}))

vi.mock('@/presentation/utils/candidateFormPdfTemplate', () => ({
  exportCandidateFormPdf: exportCandidateFormPdfMock,
}))

vi.mock('@/viewmodels/useAuthViewModel', () => ({
  useAuthViewModel: () => ({
    userRole: userRoleRef,
    hasPermission: hasPermissionMock,
    hasAnyPermission: hasAnyPermissionMock,
  }),
}))

vi.mock('@/viewmodels/useCandidateFormViewModel', () => ({
  useCandidateFormViewModel: () => ({
    candidates: candidatesRef,
    loading: candidateLoadingRef,
    error: candidateErrorRef,
    saving: candidateSavingRef,
    remove: removeCandidateMock,
    refresh: refreshCandidatesMock,
    getById: getCandidateByIdMock,
  }),
}))

function createCandidate(overrides: Partial<CandidateForm> = {}): CandidateForm {
  return {
    id: 'candidate-1',
    employee_request_form_id: 'erf-1',
    candidate_id: 'profile-1',
    completion_status: 'in_progress',
    photograph: null,
    date_application: null,
    notice_period: null,
    first_name: 'John',
    middle_name: null,
    last_name: 'Doe',
    hire_location: null,
    date_of_birth: null,
    place_of_birth: null,
    nationality: null,
    marital_status: null,
    religion: null,
    gender: null,
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
    id_no: null,
    available_start_date: null,
    join_date: null,
    transportation_type: null,
    transportation_ownership: null,
    residence_ownership: null,
    created_at: '2026-03-10T08:00:00',
    updated_at: '2026-03-10T08:00:00',
    employee_request_form: {
      id: 'erf-1',
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

describe('CandidateFormList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetNuxtNavigationMocks()
    setNuxtRouterMock({ push: routerPushMock })
    vi.stubGlobal('confirm', vi.fn(() => true))
    vi.spyOn(window, 'open').mockReturnValue(previewWindowMock as any)

    candidatesRef.value = [
      createCandidate(),
      createCandidate({
        id: 'candidate-2',
        role: null,
        first_name: 'Fina',
        last_name: 'Analyst',
        personal_email: 'fina@example.com',
        phone_number: '08222',
        completion_status: 'completed',
        employee_payroll_profile: {
          candidate_form_id: 'candidate-2',
          bank_name: 'BCA',
          bank_account_number: '1234567890',
          account_holder_name: 'Fina Analyst',
          branch_name: 'Bandung',
          tax_identification_number: '09.111.222.3-456.000',
          bpjs_health_enrollment_preference: 'willing_to_enroll',
          bpjs_health_decline_reason: null,
          bpjs_health_decline_reason_other: null,
          bpjs_employment_status: 'continue_existing',
        },
        employee_request_form_id: 'erf-2',
        employee_request_form: {
          id: 'erf-2',
          main_position: 'Finance Analyst',
          site: 'Bandung',
        },
        family_and_emergency: [
          {
            id: 'family-1',
            candidate_form_id: 'candidate-2',
            name: 'Siti Analysia',
            relationship: 'Mother',
            gender: 'Female',
            place_and_date_of_birth: 'Bandung, 1980-01-01',
            education: 'SMA',
            description: 'Emergency contact',
            occupation: 'Teacher',
            remarks: 'Primary family contact',
            category: 'Parent',
          },
        ],
      }),
    ]
    candidateLoadingRef.value = false
    candidateErrorRef.value = ''
    candidateSavingRef.value = false
    userRoleRef.value = 'super_admin'
    hasPermissionMock.mockReturnValue(true)
    hasAnyPermissionMock.mockReturnValue(true)
    getCandidateByIdMock.mockImplementation(async (id: string) =>
      candidatesRef.value.find((candidate) => candidate.id === id) ?? null,
    )
    exportCandidateFormPdfMock.mockResolvedValue(undefined)
    refreshCandidatesMock.mockResolvedValue(undefined)
    removeCandidateMock.mockResolvedValue(undefined)
  })

  it('filters candidates by search text and ERF, then refreshes the list', async () => {
    const { default: CandidateFormList } = await import('../CandidateFormList.vue')
    const wrapper = mount(CandidateFormList)

    expect(wrapper.text()).toContain('Candidate')
    expect(wrapper.text()).toContain('Employee')
    expect(wrapper.findAll('select')).toHaveLength(2)

    await wrapper.findAll('select')[0]!.setValue('completed')
    expect(wrapper.text()).toContain('Fina Analyst')
    expect(wrapper.text()).not.toContain('John Doe')

    await wrapper.findAll('select')[1]!.setValue('Finance Analyst')
    await wrapper.get('input[type="search"]').setValue('finance')
    const tableBody = wrapper.get('tbody')

    expect(tableBody.text()).toContain('Finance Analyst')
    expect(tableBody.text()).not.toContain('John Doe')

    await wrapper.findAll('select')[1]!.setValue('Backend Engineer')
    expect(wrapper.text()).toContain('No matching data found.')

    const refreshButton = wrapper.findAll('button').find((button) => button.text() === 'Refresh')
    await refreshButton!.trigger('click')

    expect(refreshCandidatesMock).toHaveBeenCalled()
  })

  it('does not render create or continue actions because the dashboard is now read-only', async () => {
    userRoleRef.value = 'candidate'
    candidatesRef.value = [createCandidate({ id: 'candidate-self' })]

    const { default: CandidateFormList } = await import('../CandidateFormList.vue')
    const wrapper = mount(CandidateFormList)

    expect(wrapper.text()).not.toContain('Continue Candidate Form')
    expect(wrapper.text()).not.toContain('Add Candidate')
  })

  it('keeps PDF export available but removes Excel and destructive row actions', async () => {
    const { default: CandidateFormList } = await import('../CandidateFormList.vue')
    const wrapper = mount(CandidateFormList)

    const exportButton = wrapper.findAll('button').find((button) => button.text() === 'Export PDF')
    const deleteButton = wrapper.findAll('button').find((button) => button.text() === 'Delete')
    const editButton = wrapper.findAll('button').find((button) => button.text() === 'Edit')
    const exportExcelButton = wrapper.findAll('button').find((button) => button.text() === 'Export Excel')

    await exportButton!.trigger('click')
    await flushPromises()

    const exportedCandidate = candidatesRef.value[0]!
    expect(getCandidateByIdMock).toHaveBeenCalledWith(exportedCandidate.id)
    expect(exportCandidateFormPdfMock).toHaveBeenCalledWith(exportedCandidate, {
      previewWindow: previewWindowMock,
    })
    expect(toastSuccessMock).toHaveBeenCalledWith('Candidate form PDF opened successfully.')
    expect(exportExcelButton).toBeUndefined()
    expect(deleteButton).toBeUndefined()
    expect(editButton).toBeUndefined()
  })

  it('shows only detail and export actions for candidate service mirrors', async () => {
    candidatesRef.value = [
      createCandidate({
        id: 'candidate-mirror',
        candidate_source: 'candidate_service',
        candidate_service_form_id: 'service-form-1',
      }),
    ]

    const { default: CandidateFormList } = await import('../CandidateFormList.vue')
    const wrapper = mount(CandidateFormList)

    const buttons = wrapper.findAll('button')
    const detailButton = buttons.find((button) => button.text() === 'Detail')
    const exportButton = buttons.find((button) => button.text() === 'Export PDF')
    const editButton = buttons.find((button) => button.text() === 'Edit')
    const deleteButton = buttons.find((button) => button.text() === 'Delete')

    expect(detailButton).toBeDefined()
    expect(exportButton).toBeDefined()
    expect(editButton).toBeUndefined()
    expect(deleteButton).toBeUndefined()
  })
})
