import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

import type {
  InterviewEvaluation,
  InterviewEvaluationCandidateOption,
} from '@/domain/entities/InterviewEvaluation'

const refreshMock = vi.fn()
const fetchAssignedEvaluationMock = vi.fn()
const saveEvaluationMock = vi.fn()
const updatedToastMock = vi.fn()
const hasPermissionMock = vi.fn()
const routerPushMock = vi.fn()

const errorRef = ref('')
const loadingRef = ref(false)
const savingRef = ref(false)
const assignedEvaluationsRef = ref<InterviewEvaluation[]>([])
const candidateOptionsRef = ref<InterviewEvaluationCandidateOption[]>([])
const routeState = {
  params: {
    id: 'evaluation-1',
  },
  query: {},
}

vi.mock('#imports', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    push: routerPushMock,
  }),
}))

vi.mock('@/presentation/components/feedback/useAppToast', () => ({
  useAppToast: () => ({
    updated: updatedToastMock,
  }),
}))

vi.mock('@/presentation/components/forms/SearchableSelect.vue', () => ({
  default: {
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
  },
}))

vi.mock('@/viewmodels/useAuthViewModel', () => ({
  useAuthViewModel: () => ({
    hasPermission: hasPermissionMock,
  }),
}))

vi.mock('@/viewmodels/useInterviewerFormViewModel', () => ({
  useInterviewerFormViewModel: () => ({
    assignedEvaluations: assignedEvaluationsRef,
    candidateOptions: candidateOptionsRef,
    error: errorRef,
    fetchAssignedEvaluation: fetchAssignedEvaluationMock,
    loading: loadingRef,
    refresh: refreshMock,
    saveEvaluation: saveEvaluationMock,
    saving: savingRef,
  }),
}))

function createInterviewEvaluation(
  overrides: Partial<InterviewEvaluation> = {},
): InterviewEvaluation {
  return {
    id: 'evaluation-1',
    employee_request_form_id: 'erf-1',
    recruitment_flow_stage: 'interview_evaluation_in_progress',
    vacancy_status: 'interview',
    candidate_service_candidate_id: 'candidate-service-1',
    candidate_service_application_id: 'application-1',
    candidate_name: 'Yono Koh',
    applied_position: 'Staff Admin',
    interviewer_name: 'Rina',
    interviewer_recipients: [
      {
        user_id: 'user-interviewer-1',
        name: 'Rina',
        email: 'rina@example.com',
        job_level: 'Lead',
        label: 'Rina - Lead',
      },
    ],
    interview_date: '2026-04-06',
    notes: null,
    comments: '',
    recommendation: null,
    created_by: 'user-1',
    updated_by: 'user-1',
    created_at: '2026-04-06T08:00:00',
    updated_at: '2026-04-06T08:00:00',
    scores: Array.from({ length: 10 }, (_, index) => ({
      id: `score-${index + 1}`,
      interview_evaluation_form_id: 'evaluation-1',
      item_number: index + 1,
      category_title: `Category ${index + 1}`,
      category_description: `Description ${index + 1}`,
      score: null,
      info: '',
      created_at: '2026-04-06T08:00:00',
      updated_at: '2026-04-06T08:00:00',
    })),
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

describe('InterviewerFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeState.query = {}

    errorRef.value = ''
    loadingRef.value = false
    savingRef.value = false
    assignedEvaluationsRef.value = [createInterviewEvaluation()]
    candidateOptionsRef.value = [createCandidateOption()]
    hasPermissionMock.mockImplementation(
      (permission: string) => permission !== 'interview_evaluation:read',
    )
    fetchAssignedEvaluationMock.mockResolvedValue(createInterviewEvaluation())
    refreshMock.mockResolvedValue(undefined)
    saveEvaluationMock.mockResolvedValue(undefined)
    routerPushMock.mockResolvedValue(undefined)
  })

  it('shows assigned interviews and opens the evaluation page', async () => {
    const { default: InterviewerFormPage } = await import('../InterviewerFormPage.vue')
    const wrapper = mount(InterviewerFormPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Assigned Interviews')
    expect(wrapper.text()).toContain('Yono Koh')
    expect(wrapper.text()).toContain('Interview Evaluation In Progress')

    const evaluateButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Evaluate'))
    expect(evaluateButton).toBeDefined()
    await evaluateButton!.trigger('click')

    expect(routerPushMock).toHaveBeenCalledWith({
      path: '/interview-evaluations/evaluate/evaluation-1',
      query: {},
    })
    expect(wrapper.text()).not.toContain('Evaluation Grid')
  })

  it('shows loading overlay while opening the evaluation page', async () => {
    let resolveNavigation: () => void = () => undefined
    routerPushMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveNavigation = resolve
        }),
    )

    const { default: InterviewerFormPage } = await import('../InterviewerFormPage.vue')
    const wrapper = mount(InterviewerFormPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    const evaluateButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Evaluate'))
    expect(evaluateButton).toBeDefined()

    await evaluateButton!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Loading data...')

    resolveNavigation()
    await flushPromises()

    expect(wrapper.text()).not.toContain('Loading data...')
  })

  it('disables evaluate action when user lacks interviewer/update permission', async () => {
    hasPermissionMock.mockReturnValue(false)

    const { default: InterviewerFormPage } = await import('../InterviewerFormPage.vue')
    const wrapper = mount(InterviewerFormPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    const evaluateButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Evaluate'))
    expect(evaluateButton).toBeUndefined()
    expect(routerPushMock).not.toHaveBeenCalled()
  })

  it('disables evaluate action when user only has interview_evaluation:update', async () => {
    hasPermissionMock.mockImplementation(
      (permission: string) => permission === 'interview_evaluation:update',
    )

    const { default: InterviewerFormPage } = await import('../InterviewerFormPage.vue')
    const wrapper = mount(InterviewerFormPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    const evaluateButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Evaluate'))
    expect(evaluateButton).toBeUndefined()
  })

  it('shows detail action for users with read-only access', async () => {
    hasPermissionMock.mockImplementation(
      (permission: string) => permission === 'interview_evaluation:read',
    )

    const { default: InterviewerFormPage } = await import('../InterviewerFormPage.vue')
    const wrapper = mount(InterviewerFormPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    const detailButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Detail'))
    expect(detailButton).toBeDefined()
    expect(wrapper.text()).not.toContain('Evaluate')

    await detailButton!.trigger('click')

    expect(routerPushMock).toHaveBeenCalledWith({
      path: '/interview-evaluations/evaluate/evaluation-1',
      query: {
        mode: 'detail',
        interviewer_user_id: 'user-interviewer-1',
      },
    })
  })

  it('keeps the evaluation page read-only for users with detail access only', async () => {
    hasPermissionMock.mockImplementation(
      (permission: string) => permission === 'interview_evaluation:read',
    )
    routeState.query = { mode: 'detail' }

    const { default: InterviewerEvaluationPage } = await import('../InterviewerEvaluationPage.vue')
    const wrapper = mount(InterviewerEvaluationPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    const assessmentTab = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Assessment'))
    expect(assessmentTab).toBeDefined()
    await assessmentTab!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('Save Evaluation')
    expect(
      wrapper.findAll('select').every((select) => select.attributes('disabled') !== undefined),
    ).toBe(true)
    expect(wrapper.find('textarea').attributes('disabled')).toBeDefined()
  })

  it('shows interviewer column for non-interviewer users', async () => {
    hasPermissionMock.mockImplementation(
      (permission: string) => permission === 'interview_evaluation:read',
    )

    assignedEvaluationsRef.value = [
      createInterviewEvaluation({
        interviewer_name: 'Legacy Name',
        interviewer_recipients: [
          {
            user_id: 'user-interviewer-2',
            name: 'Hafis Maulana',
            email: 'hafis@example.com',
            job_level: 'Mgr',
            label: 'Hafis Maulana - Mgr',
          },
        ],
      }),
    ]

    const { default: InterviewerFormPage } = await import('../InterviewerFormPage.vue')
    const wrapper = mount(InterviewerFormPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Interviewer')
    expect(wrapper.text()).toContain('Hafis Maulana - Mgr')
    expect(wrapper.text()).not.toContain('Legacy Name')
    expect(wrapper.text()).toContain('Interview Evaluation In Progress')
  })

  it('renders one row per interviewer when an assessment has multiple interviewers', async () => {
    hasPermissionMock.mockImplementation(
      (permission: string) => permission === 'interview_evaluation:read',
    )

    assignedEvaluationsRef.value = [
      createInterviewEvaluation({
        interviewer_name: 'Legacy Name',
        interviewer_recipients: [
          {
            user_id: 'user-interviewer-1',
            name: 'Rina',
            email: 'rina@example.com',
            job_level: 'Lead',
            label: 'Rina - Lead',
          },
          {
            user_id: 'user-interviewer-2',
            name: 'Hafis Maulana',
            email: 'hafis@example.com',
            job_level: 'Mgr',
            label: 'Hafis Maulana - Mgr',
          },
        ],
      }),
    ]

    const { default: InterviewerFormPage } = await import('../InterviewerFormPage.vue')
    const wrapper = mount(InterviewerFormPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(wrapper.text()).toContain('Rina - Lead')
    expect(wrapper.text()).toContain('Hafis Maulana - Mgr')
  })

  it('opens detail with the selected interviewer identity', async () => {
    hasPermissionMock.mockImplementation(
      (permission: string) => permission === 'interview_evaluation:read',
    )

    assignedEvaluationsRef.value = [
      createInterviewEvaluation({
        interviewer_recipients: [
          {
            user_id: 'user-interviewer-1',
            name: 'Rina',
            email: 'rina@example.com',
            job_level: 'Lead',
            label: 'Rina - Lead',
          },
          {
            user_id: 'user-interviewer-2',
            name: 'Hafis Maulana',
            email: 'hafis@example.com',
            job_level: 'Mgr',
            label: 'Hafis Maulana - Mgr',
          },
        ],
        interviewer_results: [
          {
            id: 'interviewer-result-1',
            interview_evaluation_form_id: 'evaluation-1',
            interviewer: {
              user_id: 'user-interviewer-1',
              name: 'Rina',
              email: 'rina@example.com',
              job_level: 'Lead',
              label: 'Rina - Lead',
            },
            comments: 'Rina comments',
            recommendation: 'continue_recruitment',
            scores: [],
          },
          {
            id: 'interviewer-result-2',
            interview_evaluation_form_id: 'evaluation-1',
            interviewer: {
              user_id: 'user-interviewer-2',
              name: 'Hafis Maulana',
              email: 'hafis@example.com',
              job_level: 'Mgr',
              label: 'Hafis Maulana - Mgr',
            },
            comments: 'Hafis comments',
            recommendation: 'continue_recruitment',
            scores: [],
          },
        ],
      }),
    ]

    const { default: InterviewerFormPage } = await import('../InterviewerFormPage.vue')
    const wrapper = mount(InterviewerFormPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    const detailButtons = wrapper
      .findAll('button')
      .filter((button) => button.text().includes('Detail'))

    expect(detailButtons).toHaveLength(2)
    await detailButtons[1]!.trigger('click')

    expect(routerPushMock).toHaveBeenCalledWith({
      path: '/interview-evaluations/evaluate/evaluation-1',
      query: {
        mode: 'detail',
        interviewer_result_id: 'interviewer-result-2',
      },
    })
  })

  it('shows completed only for the interviewer who has submitted scores', async () => {
    hasPermissionMock.mockImplementation(
      (permission: string) => permission === 'interview_evaluation:read',
    )

    assignedEvaluationsRef.value = [
      createInterviewEvaluation({
        interviewer_recipients: [
          {
            user_id: 'user-interviewer-1',
            name: 'Rina',
            email: 'rina@example.com',
            job_level: 'Lead',
            label: 'Rina - Lead',
          },
          {
            user_id: 'user-interviewer-2',
            name: 'Hafis Maulana',
            email: 'hafis@example.com',
            job_level: 'Mgr',
            label: 'Hafis Maulana - Mgr',
          },
        ],
        interviewer_results: [
          {
            id: 'interviewer-1',
            interview_evaluation_form_id: 'evaluation-1',
            interviewer: {
              user_id: 'user-interviewer-1',
              name: 'Rina',
              email: 'rina@example.com',
              job_level: 'Lead',
              label: 'Rina - Lead',
            },
            comments: 'Done',
            recommendation: 'continue_recruitment',
            scores: Array.from({ length: 10 }, (_, index) => ({
              id: `score-${index + 1}`,
              interview_evaluation_form_id: 'evaluation-1',
              interview_evaluation_interviewer_id: 'interviewer-1',
              item_number: index + 1,
              category_title: `Category ${index + 1}`,
              category_description: `Description ${index + 1}`,
              score: 5,
              info: '',
              created_at: null,
              updated_at: null,
            })),
          },
          {
            id: 'interviewer-2',
            interview_evaluation_form_id: 'evaluation-1',
            interviewer: {
              user_id: 'user-interviewer-2',
              name: 'Hafis Maulana',
              email: 'hafis@example.com',
              job_level: 'Mgr',
              label: 'Hafis Maulana - Mgr',
            },
            comments: null,
            recommendation: null,
            scores: [],
          },
        ],
      }),
    ]

    const { default: InterviewerFormPage } = await import('../InterviewerFormPage.vue')
    const wrapper = mount(InterviewerFormPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Completed')
    expect(wrapper.text()).toContain('Pending')
  })

  it('shows only the assigned interviewer row for interviewer users', async () => {
    hasPermissionMock.mockImplementation(
      (permission: string) => permission === 'interview_evaluation:interviewer_form',
    )

    assignedEvaluationsRef.value = [
      createInterviewEvaluation({
        interviewer_name: 'Rina - Lead',
        interviewer_recipients: [
          {
            user_id: 'user-interviewer-1',
            name: 'Rina',
            email: 'rina@example.com',
            job_level: 'Lead',
            label: 'Rina - Lead',
          },
          {
            user_id: 'user-interviewer-2',
            name: 'Hafis Maulana',
            email: 'hafis@example.com',
            job_level: 'Mgr',
            label: 'Hafis Maulana - Mgr',
          },
        ],
        interviewer_results: [
          {
            id: 'interviewer-1',
            interview_evaluation_form_id: 'evaluation-1',
            interviewer: {
              user_id: 'user-interviewer-1',
              name: 'Rina',
              email: 'rina@example.com',
              job_level: 'Lead',
              label: 'Rina - Lead',
            },
            comments: null,
            recommendation: null,
            scores: [],
          },
          {
            id: 'interviewer-2',
            interview_evaluation_form_id: 'evaluation-1',
            interviewer: {
              user_id: 'user-interviewer-2',
              name: 'Hafis Maulana',
              email: 'hafis@example.com',
              job_level: 'Mgr',
              label: 'Hafis Maulana - Mgr',
            },
            comments: null,
            recommendation: null,
            scores: [],
          },
        ],
      }),
    ]

    const { default: InterviewerFormPage } = await import('../InterviewerFormPage.vue')
    const wrapper = mount(InterviewerFormPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.find('thead').text()).not.toContain('Interviewer')
    expect(wrapper.text()).not.toContain('Hafis Maulana - Mgr')
  })

  it('saves the interviewer evaluation from the evaluation page', async () => {
    const { default: InterviewerEvaluationPage } = await import('../InterviewerEvaluationPage.vue')
    const wrapper = mount(InterviewerEvaluationPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    const assessmentTab = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Assessment'))
    expect(assessmentTab).toBeDefined()
    await assessmentTab!.trigger('click')
    await flushPromises()

    const selects = wrapper.findAll('select')
    await selects[0]!.setValue('4')
    await selects[10]!.setValue('continue_recruitment')
    await wrapper.get('textarea').setValue('Recommended to move forward.')

    const saveButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Save Evaluation'))
    expect(saveButton).toBeDefined()
    await saveButton!.trigger('click')

    expect(saveEvaluationMock).toHaveBeenCalledWith(
      'evaluation-1',
      expect.objectContaining({
        selected_candidate_option_id: 'candidate_service:form-1',
        recommendation: 'continue_recruitment',
        comments: 'Recommended to move forward.',
      }),
    )
    expect(updatedToastMock).toHaveBeenCalledWith('Interview evaluation')
  })

  it('shows complete family and emergency fields from the candidate form', async () => {
    fetchAssignedEvaluationMock.mockResolvedValue(
      createInterviewEvaluation({
        candidate_form: {
          family_and_emergency: [
            {
              id: 'family-1',
              candidate_form_id: 'candidate-form-1',
              category: 'Emergency Contact',
              relationship: 'Sibling',
              name: 'Rina',
              gender: 'female',
              place_and_date_of_birth: 'Jakarta, 1990-01-01',
              education: 'Bachelor',
              occupation: 'Teacher',
              remarks: 'Available on weekends',
              description: 'Lives nearby',
            },
          ],
        } as any,
      }),
    )

    const { default: InterviewerEvaluationPage } = await import('../InterviewerEvaluationPage.vue')
    const wrapper = mount(InterviewerEvaluationPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Teacher')
    expect(wrapper.text()).toContain('Bachelor')
    expect(wrapper.text()).toContain('Jakarta, 1990-01-01')
    expect(wrapper.text()).toContain('Available on weekends')
    expect(wrapper.text()).toContain('Lives nearby')
  })

  it('shows the clicked interviewer result instead of another interviewer data', async () => {
    routeState.query = {
      mode: 'detail',
      interviewer_result_id: 'interviewer-result-2',
    }
    fetchAssignedEvaluationMock.mockResolvedValue(
      createInterviewEvaluation({
        interviewer_name: 'Rina - Lead',
        comments: 'Default comments',
        recommendation: 'continue_recruitment',
        interviewer_recipients: [
          {
            user_id: 'user-interviewer-1',
            name: 'Rina',
            email: 'rina@example.com',
            job_level: 'Lead',
            label: 'Rina - Lead',
          },
          {
            user_id: 'user-interviewer-2',
            name: 'Hafis Maulana',
            email: 'hafis@example.com',
            job_level: 'Mgr',
            label: 'Hafis Maulana - Mgr',
          },
        ],
        interviewer_results: [
          {
            id: 'interviewer-result-1',
            interview_evaluation_form_id: 'evaluation-1',
            interviewer: {
              user_id: 'user-interviewer-1',
              name: 'Rina',
              email: 'rina@example.com',
              job_level: 'Lead',
              label: 'Rina - Lead',
            },
            comments: 'Comments A',
            recommendation: 'continue_recruitment',
            scores: Array.from({ length: 10 }, (_, index) => ({
              id: `score-a-${index + 1}`,
              interview_evaluation_form_id: 'evaluation-1',
              interview_evaluation_interviewer_id: 'interviewer-result-1',
              item_number: index + 1,
              category_title: `Category ${index + 1}`,
              category_description: `Description ${index + 1}`,
              score: 4,
              info: 'A',
              created_at: null,
              updated_at: null,
            })),
          },
          {
            id: 'interviewer-result-2',
            interview_evaluation_form_id: 'evaluation-1',
            interviewer: {
              user_id: 'user-interviewer-2',
              name: 'Hafis Maulana',
              email: 'hafis@example.com',
              job_level: 'Mgr',
              label: 'Hafis Maulana - Mgr',
            },
            comments: 'Comments B',
            recommendation: 'continue_recruitment',
            scores: Array.from({ length: 10 }, (_, index) => ({
              id: `score-b-${index + 1}`,
              interview_evaluation_form_id: 'evaluation-1',
              interview_evaluation_interviewer_id: 'interviewer-result-2',
              item_number: index + 1,
              category_title: `Category ${index + 1}`,
              category_description: `Description ${index + 1}`,
              score: 5,
              info: 'B',
              created_at: null,
              updated_at: null,
            })),
          },
        ],
      }),
    )

    const { default: InterviewerEvaluationPage } = await import('../InterviewerEvaluationPage.vue')
    const wrapper = mount(InterviewerEvaluationPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    const assessmentTab = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Assessment'))
    expect(assessmentTab).toBeDefined()
    await assessmentTab!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('5.00')
    expect(wrapper.get('textarea').element.value).toBe('Comments B')
  })

  it('hides major for formal education entries', async () => {
    fetchAssignedEvaluationMock.mockResolvedValue(
      createInterviewEvaluation({
        candidate_form: {
          family_and_emergency: [],
          education: [
            {
              id: 'education-1',
              candidate_form_id: 'candidate-form-1',
              category: 'Formal Education',
              level: 'SD / Sederajat',
              institution: 'SD Jakarta',
              city: 'Jakarta',
              major: '',
              from_year: 1999,
              to_year: 2006,
              description: '',
            },
          ],
        } as any,
      }),
    )

    const { default: InterviewerEvaluationPage } = await import('../InterviewerEvaluationPage.vue')
    const wrapper = mount(InterviewerEvaluationPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('SD / Sederajat')
    expect(wrapper.text()).toContain('SD Jakarta')
    expect(wrapper.text()).not.toContain('Major')
  })
})
