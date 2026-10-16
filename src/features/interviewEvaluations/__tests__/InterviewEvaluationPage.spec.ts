import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, reactive, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

import type {
  InterviewEvaluation,
  InterviewEvaluationCandidateOption,
} from '@/domain/entities/InterviewEvaluation'

const createMock = vi.fn()
const updateMock = vi.fn()
const refreshMock = vi.fn()
const createdToastMock = vi.fn()
const updatedToastMock = vi.fn()
const hasPermissionMock = vi.fn()
const routerReplaceMock = vi.fn()
const routerPushMock = vi.fn()
const supabaseFromMock = vi.fn()
const useInterviewEvaluationViewModelMock = vi.fn()

const routeState = reactive({
  query: {} as Record<string, string>,
})

const errorRef = ref('')
const loadingRef = ref(false)
const savingRef = ref(false)
const interviewEvaluationsRef = ref<InterviewEvaluation[]>([])
const candidateOptionsRef = ref<InterviewEvaluationCandidateOption[]>([])
let profileRows: Array<Record<string, unknown>> = []
let roleRows: Array<Record<string, unknown>> = []

vi.mock('#imports', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    push: routerPushMock,
    replace: routerReplaceMock,
  }),
}))

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
    from: supabaseFromMock,
  },
}))

vi.mock('@/presentation/components/feedback/useAppToast', () => ({
  useAppToast: () => ({
    created: createdToastMock,
    updated: updatedToastMock,
  }),
}))

vi.mock('@/viewmodels/useAuthViewModel', () => ({
  useAuthViewModel: () => ({
    hasPermission: hasPermissionMock,
  }),
}))

vi.mock('@/viewmodels/useInterviewEvaluationViewModel', () => ({
  useInterviewEvaluationViewModel: (options?: Record<string, unknown>) => {
    useInterviewEvaluationViewModelMock(options)
    return {
      candidateOptions: candidateOptionsRef,
      create: createMock,
      error: errorRef,
      interviewEvaluations: interviewEvaluationsRef,
      loading: loadingRef,
      refresh: refreshMock,
      saving: savingRef,
      update: updateMock,
    }
  },
}))

function createInterviewEvaluation(
  overrides: Partial<InterviewEvaluation> = {},
): InterviewEvaluation {
  return {
    id: 'evaluation-1',
    employee_request_form_id: 'erf-1',
    candidate_service_candidate_id: 'candidate-service-1',
    candidate_service_application_id: 'application-1',
    candidate_name: 'Yono Koh',
    applied_position: 'Staff Admin',
    interviewer_name: 'Rina',
    interviewer_recipients: [],
    interview_date: '2026-04-06',
    notes: null,
    comments: 'Strong communication and initiative.',
    recommendation: 'continue_recruitment',
    created_by: 'user-1',
    updated_by: 'user-1',
    created_at: '2026-04-06T08:00:00',
    updated_at: '2026-04-06T08:00:00',
    scores: [
      {
        id: 'score-1',
        interview_evaluation_form_id: 'evaluation-1',
        item_number: 1,
        category_title: 'Work Experience',
        category_description: 'Alignment of years of service.',
        score: 4,
        info: 'Relevant background',
        created_at: '2026-04-06T08:00:00',
        updated_at: '2026-04-06T08:00:00',
      },
    ],
    ...overrides,
  }
}

function createCandidateOption(
  overrides: Partial<InterviewEvaluationCandidateOption> = {},
): InterviewEvaluationCandidateOption {
  return {
    id: 'candidate_service:form-1',
    candidate_name: 'Yono Koh',
    applied_position: 'Staff Admin',
    employee_request_form_id: 'erf-1',
    candidate_service_candidate_id: 'candidate-service-1',
    candidate_service_application_id: 'application-1',
    personal_email: 'yono@example.com',
    phone_number: '08123',
    completion_status: 'completed',
    updated_at: '2026-04-06T08:00:00',
    ...overrides,
  }
}

describe('InterviewEvaluationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    routeState.query = {}
    errorRef.value = ''
    loadingRef.value = false
    savingRef.value = false
    interviewEvaluationsRef.value = [createInterviewEvaluation()]
    candidateOptionsRef.value = [createCandidateOption()]
    profileRows = [
      {
        id: 'user-hr-1',
        full_name: 'Dewi',
        username: 'dewi',
        email: 'dewi@example.com',
        main_position: 'Senior Recruiter',
        master_designation_ref: { name: 'Senior' },
      },
      {
        id: 'user-hr-2',
        full_name: 'Budi',
        username: 'budi',
        email: 'budi@example.com',
        main_position: 'Recruitment Officer',
        master_designation_ref: { name: 'Recruiter' },
      },
      {
        id: 'user-interviewer-1',
        full_name: 'Rina',
        username: 'rina',
        email: 'rina@example.com',
        main_position: 'Technical Lead',
        master_designation_ref: { name: 'Lead' },
      },
      {
        id: 'user-admin-1',
        full_name: 'Admin User',
        username: 'admin',
        email: 'admin@example.com',
        main_position: 'Admin Manager',
        master_designation_ref: { name: 'Manager' },
      },
      {
        id: 'user-candidate-1',
        full_name: 'Candidate User',
        username: 'candidate',
        email: 'candidate@example.com',
        main_position: 'Candidate Position',
        master_designation_ref: { name: 'Candidate' },
      },
      {
        id: 'user-employee-1',
        full_name: 'Employee User',
        username: 'employee',
        email: 'employee@example.com',
        main_position: 'Employee Position',
        master_designation_ref: { name: 'Employee' },
      },
    ]
    roleRows = [
      { user_id: 'user-hr-1', roles: { name: 'HR' } },
      { user_id: 'user-hr-2', roles: { name: 'Recruiter' } },
      { user_id: 'user-interviewer-1', roles: { name: 'Interviewer' } },
      { user_id: 'user-admin-1', roles: { name: 'super_admin' } },
      { user_id: 'user-candidate-1', roles: { name: 'candidate' } },
      { user_id: 'user-employee-1', roles: { name: 'employee' } },
    ]
    supabaseFromMock.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockResolvedValue({ data: profileRows, error: null }),
        }
      }

      if (table === 'user_roles') {
        return {
          select: vi.fn(() => ({
            in: vi.fn().mockResolvedValue({ data: roleRows, error: null }),
          })),
        }
      }

      return {
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
    })
    hasPermissionMock.mockReturnValue(true)
    createMock.mockResolvedValue(undefined)
    updateMock.mockResolvedValue(undefined)
    refreshMock.mockResolvedValue(undefined)
  })

  it('creates a new interview evaluation after selecting a candidate', async () => {
    const { default: InterviewEvaluationPage } = await import('../InterviewEvaluationPage.vue')
    const wrapper = mount(InterviewEvaluationPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    const selects = wrapper.findAll('select')
    const interviewerOptions = selects[1]!.findAll('option').map((option) => option.text())
    expect(interviewerOptions).toContain('Dewi - Senior Recruiter')
    expect(interviewerOptions).toContain('Budi - Recruitment Officer')
    expect(interviewerOptions).toContain('Rina - Technical Lead')
    expect(interviewerOptions).not.toContain('Admin User - Admin Manager')
    expect(interviewerOptions).not.toContain('Candidate User - Candidate Position')
    expect(interviewerOptions).not.toContain('Employee User - Employee Position')
    expect(wrapper.text()).not.toContain('Evaluation Grid')
    expect(wrapper.text()).not.toContain('Recommendation')
    expect(wrapper.text()).not.toContain('Comments')

    await selects[0]!.setValue('candidate_service:form-1')
    await selects[1]!.setValue('user-hr-1')
    await selects[1]!.setValue('user-hr-2')
    await wrapper.get('input[type="date"]').setValue('2026-04-07')
    await wrapper.get('input[type="time"]').setValue('10:00')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(createMock).toHaveBeenCalledTimes(1)
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        selected_candidate_option_id: 'candidate_service:form-1',
        interviewer_name: 'Dewi - Senior Recruiter, Budi - Recruitment Officer',
        interviewer_recipients: [
          {
            user_id: 'user-hr-1',
            name: 'Dewi',
            email: 'dewi@example.com',
            job_level: 'Senior',
            label: 'Dewi - Senior Recruiter',
          },
          {
            user_id: 'user-hr-2',
            name: 'Budi',
            email: 'budi@example.com',
            job_level: 'Recruiter',
            label: 'Budi - Recruitment Officer',
          },
        ],
        interview_date: '2026-04-07T10:00',
      }),
    )
    expect(createdToastMock).toHaveBeenCalledWith('Interview evaluation')
    expect(routerPushMock).toHaveBeenCalledWith({
      path: '/interview-evaluations',
    })
  })

  it('keeps interviewer users on the form page when they cannot read the assessment list', async () => {
    hasPermissionMock.mockImplementation(
      (permission: string) => permission === 'interview_evaluation:create',
    )

    const { default: InterviewEvaluationPage } = await import('../InterviewEvaluationPage.vue')
    const wrapper = mount(InterviewEvaluationPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    expect(useInterviewEvaluationViewModelMock).toHaveBeenCalledWith({
      loadCandidateOptionsOnMounted: true,
      loadEvaluationsOnMounted: false,
    })
    expect(wrapper.text()).not.toContain('Assessment List')

    const selects = wrapper.findAll('select')
    await selects[0]!.setValue('candidate_service:form-1')
    await selects[1]!.setValue('user-hr-1')
    await wrapper.get('input[type="date"]').setValue('2026-04-07')
    await wrapper.get('input[type="time"]').setValue('10:00')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(createMock).toHaveBeenCalled()
    expect(routerPushMock).not.toHaveBeenCalled()
  })

  it('shows only completed candidate forms in candidate select options', async () => {
    candidateOptionsRef.value = [
      createCandidateOption({
        id: 'candidate_service:form-1',
        candidate_name: 'Completed Candidate',
        completion_status: 'completed',
      }),
      createCandidateOption({
        id: 'candidate_service:form-2',
        candidate_name: 'In Progress Candidate',
        completion_status: 'in_progress',
      }),
    ]

    const { default: InterviewEvaluationPage } = await import('../InterviewEvaluationPage.vue')
    const wrapper = mount(InterviewEvaluationPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    const candidateOptions = wrapper
      .findAll('select')[0]!
      .findAll('option')
      .map((option) => option.text())
    expect(candidateOptions).toContain('Completed Candidate - Staff Admin')
    expect(candidateOptions).not.toContain('In Progress Candidate - Staff Admin')
  })

  it('loads an existing interview evaluation into the form for editing from the route query', async () => {
    routeState.query = { edit: 'evaluation-1' }

    const { default: InterviewEvaluationPage } = await import('../InterviewEvaluationPage.vue')
    const wrapper = mount(InterviewEvaluationPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    const interviewerSelect = wrapper.findAll('select')[1]!
    expect(wrapper.text()).toContain('Rina')

    const removeInterviewerButton = wrapper
      .findAll('button')
      .find((button) => button.attributes('aria-label') === 'Remove interviewer')
    expect(removeInterviewerButton).toBeDefined()
    await removeInterviewerButton!.trigger('click')

    await interviewerSelect.setValue('user-hr-2')
    await interviewerSelect.setValue('user-interviewer-1')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(updateMock).toHaveBeenCalledWith(
      'evaluation-1',
      expect.objectContaining({
        interviewer_name: 'Budi - Recruitment Officer, Rina - Technical Lead',
        interviewer_recipients: [
          {
            user_id: 'user-hr-2',
            name: 'Budi',
            email: 'budi@example.com',
            job_level: 'Recruiter',
            label: 'Budi - Recruitment Officer',
          },
          {
            user_id: 'user-interviewer-1',
            name: 'Rina',
            email: 'rina@example.com',
            job_level: 'Lead',
            label: 'Rina - Technical Lead',
          },
        ],
      }),
    )
    expect(updatedToastMock).toHaveBeenCalledWith('Interview evaluation')
    expect(routerPushMock).toHaveBeenCalledWith({
      path: '/interview-evaluations',
    })
  })

  it('keeps the existing candidate visible in edit mode when the candidate is no longer in current options', async () => {
    routeState.query = { edit: 'evaluation-1' }
    candidateOptionsRef.value = []

    const { default: InterviewEvaluationPage } = await import('../InterviewEvaluationPage.vue')
    const wrapper = mount(InterviewEvaluationPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    const candidateOptions = wrapper
      .findAll('select')[0]!
      .findAll('option')
      .map((option) => option.text())
    expect(candidateOptions).toContain('Yono Koh - Staff Admin')
    expect(wrapper.text()).toContain('Yono Koh')
    expect(wrapper.text()).toContain('Staff Admin')
  })

  it('clears edit state and route query when canceling edit mode', async () => {
    routeState.query = { edit: 'evaluation-1' }

    const { default: InterviewEvaluationPage } = await import('../InterviewEvaluationPage.vue')
    const wrapper = mount(InterviewEvaluationPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()
    const cancelEditButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Cancel Edit'))
    expect(cancelEditButton).toBeDefined()
    await cancelEditButton!.trigger('click')

    expect(routerReplaceMock).toHaveBeenCalledWith({
      path: '/interview-evaluations/manage',
      query: {},
    })
  })
})
