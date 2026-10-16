import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

import type { InterviewEvaluation } from '@/domain/entities/InterviewEvaluation'

const refreshMock = vi.fn()
const errorRef = ref('')
const loadingRef = ref(false)
const interviewEvaluationsRef = ref<InterviewEvaluation[]>([])

vi.mock('@/viewmodels/useInterviewEvaluationViewModel', () => ({
  useInterviewEvaluationViewModel: () => ({
    error: errorRef,
    interviewEvaluations: interviewEvaluationsRef,
    loading: loadingRef,
    refresh: refreshMock,
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

function createInterviewEvaluation(): InterviewEvaluation {
  return {
    id: 'evaluation-1',
    employee_request_form_id: 'erf-1',
    recruitment_flow_stage: 'interview_evaluation_in_progress',
    vacancy_status: 'interview',
    candidate_service_candidate_id: 'candidate-1',
    candidate_service_application_id: 'application-1',
    candidate_name: 'Brian Joyo',
    applied_position: 'HR Ops',
    interviewer_name: 'Legacy Interviewer',
    interviewer_recipients: [
      {
        user_id: 'user-1',
        name: 'Hafis Maulana',
        email: 'hafis@example.com',
        job_level: 'Mgr',
        label: 'Hafis Maulana - Mgr',
      },
      {
        user_id: 'user-2',
        name: 'As Fine Basith',
        email: 'basith@example.com',
        job_level: 'Dir',
        label: 'As Fine Basith - Dir',
      },
    ],
    interview_date: '2026-04-24',
    notes: null,
    comments: 'Legacy comment',
    recommendation: 'find_comparison_candidate',
    created_by: 'hr-1',
    updated_by: 'hr-1',
    created_at: '2026-04-24T10:00:00Z',
    updated_at: '2026-04-24T10:00:00Z',
    scores: [],
    interviewer_results: [
      {
        id: 'interviewer-1',
        interview_evaluation_form_id: 'evaluation-1',
        interviewer: {
          user_id: 'user-1',
          name: 'Hafis Maulana',
          email: 'hafis@example.com',
          job_level: 'Mgr',
          label: 'Hafis Maulana - Mgr',
        },
        comments: 'Strong leadership.',
        recommendation: 'continue_recruitment',
        scores: Array.from({ length: 10 }, (_, index) => ({
          id: `score-1-${index + 1}`,
          interview_evaluation_form_id: 'evaluation-1',
          interview_evaluation_interviewer_id: 'interviewer-1',
          item_number: index + 1,
          category_title: `Category ${index + 1}`,
          category_description: `Description ${index + 1}`,
          score: 5,
          info: `Positive note ${index + 1}`,
          created_at: null,
          updated_at: null,
        })),
      },
      {
        id: 'interviewer-2',
        interview_evaluation_form_id: 'evaluation-1',
        interviewer: {
          user_id: 'user-2',
          name: 'As Fine Basith',
          email: 'basith@example.com',
          job_level: 'Dir',
          label: 'As Fine Basith - Dir',
        },
        comments: 'Needs stronger strategic examples.',
        recommendation: 'stop_recruitment',
        scores: Array.from({ length: 10 }, (_, index) => ({
          id: `score-2-${index + 1}`,
          interview_evaluation_form_id: 'evaluation-1',
          interview_evaluation_interviewer_id: 'interviewer-2',
          item_number: index + 1,
          category_title: `Category ${index + 1}`,
          category_description: `Description ${index + 1}`,
          score: 1,
          info: `Critical note ${index + 1}`,
          created_at: null,
          updated_at: null,
        })),
      },
    ],
  }
}

describe('InterviewEvaluasiPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-24T10:00:00+07:00'))
    errorRef.value = ''
    loadingRef.value = false
    interviewEvaluationsRef.value = [createInterviewEvaluation()]
    refreshMock.mockResolvedValue(undefined)
  })

  it('renders one row per interviewer result with distinct remarks and score', async () => {
    const { default: InterviewEvaluasiPage } = await import('../InterviewEvaluasiPage.vue')
    const wrapper = mount(InterviewEvaluasiPage)

    await flushPromises()

    const tableRows = wrapper.findAll('tbody tr')

    expect(tableRows).toHaveLength(2)
    expect(wrapper.text()).toContain('Hafis Maulana - Mgr (scored)')
    expect(wrapper.text()).toContain('As Fine Basith - Dir (scored)')
    expect(wrapper.text()).toContain('Strong leadership.')
    expect(wrapper.text()).toContain('Needs stronger strategic examples.')
    expect(wrapper.text()).toContain('5.00')
    expect(wrapper.text()).toContain('1.00')
    expect(wrapper.text()).toContain('Interview Evaluation In Progress')
  })

  it('marks scored only for interviewer rows that have submitted scores', async () => {
    interviewEvaluationsRef.value = [
      {
        ...createInterviewEvaluation(),
        interviewer_results: [
          {
            id: 'interviewer-1',
            interview_evaluation_form_id: 'evaluation-1',
            interviewer: {
              user_id: 'user-1',
              name: 'Hafis Maulana',
              email: 'hafis@example.com',
              job_level: 'Mgr',
              label: 'Hafis Maulana - Mgr',
            },
            comments: 'Strong leadership.',
            recommendation: 'continue_recruitment',
            scores: Array.from({ length: 10 }, (_, index) => ({
              id: `score-1-${index + 1}`,
              interview_evaluation_form_id: 'evaluation-1',
              interview_evaluation_interviewer_id: 'interviewer-1',
              item_number: index + 1,
              category_title: `Category ${index + 1}`,
              category_description: `Description ${index + 1}`,
              score: 5,
              info: `Positive note ${index + 1}`,
              created_at: null,
              updated_at: null,
            })),
          },
          {
            id: 'interviewer-2',
            interview_evaluation_form_id: 'evaluation-1',
            interviewer: {
              user_id: 'user-2',
              name: 'As Fine Basith',
              email: 'basith@example.com',
              job_level: 'Dir',
              label: 'As Fine Basith - Dir',
            },
            comments: null,
            recommendation: null,
            scores: [],
          },
        ],
      },
    ]

    const { default: InterviewEvaluasiPage } = await import('../InterviewEvaluasiPage.vue')
    const wrapper = mount(InterviewEvaluasiPage)

    await flushPromises()

    expect(wrapper.text()).toContain('Hafis Maulana - Mgr (scored)')
    expect(wrapper.text()).toContain('As Fine Basith - Dir')
    expect(wrapper.text()).not.toContain('As Fine Basith - Dir (scored)')
  })

  it('filters evaluations by interview date and resets period to the current month', async () => {
    interviewEvaluationsRef.value = [
      createInterviewEvaluation(),
      {
        ...createInterviewEvaluation(),
        id: 'evaluation-2',
        candidate_name: 'Dina Laras',
        interview_date: '2026-03-21',
        interviewer_results: [
          {
            id: 'interviewer-3',
            interview_evaluation_form_id: 'evaluation-2',
            interviewer: {
              user_id: 'user-3',
              name: 'Rina',
              email: 'rina@example.com',
              job_level: 'Lead',
              label: 'Rina - Lead',
            },
            comments: 'March interview',
            recommendation: 'continue_recruitment',
            scores: Array.from({ length: 10 }, (_, index) => ({
              id: `score-3-${index + 1}`,
              interview_evaluation_form_id: 'evaluation-2',
              interview_evaluation_interviewer_id: 'interviewer-3',
              item_number: index + 1,
              category_title: `Category ${index + 1}`,
              category_description: `Description ${index + 1}`,
              score: 4,
              info: `Note ${index + 1}`,
              created_at: null,
              updated_at: null,
            })),
          },
        ],
      },
    ]

    const { default: InterviewEvaluasiPage } = await import('../InterviewEvaluasiPage.vue')
    const wrapper = mount(InterviewEvaluasiPage)

    await flushPromises()

    expect(wrapper.text()).toContain('Brian Joyo')
    expect(wrapper.text()).toContain('Dina Laras')

    const dateInputs = wrapper.findAll('input[type="date"]')
    await dateInputs[0]!.setValue('2026-04-01')
    await dateInputs[1]!.setValue('2026-04-30')

    expect(wrapper.text()).toContain('Brian Joyo')
    expect(wrapper.text()).not.toContain('Dina Laras')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Current Month')!
      .trigger('click')

    expect((dateInputs[0]!.element as HTMLInputElement).value).toBe('2026-04-01')
    expect((dateInputs[1]!.element as HTMLInputElement).value).toBe('2026-04-30')
  })
})
