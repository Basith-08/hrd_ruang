import { beforeEach, describe, expect, it, vi } from "vitest"
import { mount } from "@vue/test-utils"
import { ref } from "vue"

import type { InterviewEvaluation } from "@/domain/entities/InterviewEvaluation"

const hasPermissionMock = vi.fn()
const routerPushMock = vi.fn()
const refreshInterviewEvaluationsMock = vi.fn()
const refreshAssignedEvaluationsMock = vi.fn()
const removeMock = vi.fn()

const interviewEvaluationsRef = ref<InterviewEvaluation[]>([])
const assignedEvaluationsRef = ref<InterviewEvaluation[]>([])
const listErrorRef = ref("")
const assignmentErrorRef = ref("")
const listLoadingRef = ref(false)
const assignmentLoadingRef = ref(false)
const tablePropsHistory: Array<Record<string, unknown>> = []

vi.mock("#imports", () => ({
  useRouter: () => ({
    push: routerPushMock,
  }),
}))

vi.mock("@/composables/useLocale", () => ({
  useLocale: () => ({
    text: (key: string) => key,
  }),
}))

vi.mock("@/viewmodels/useAuthViewModel", () => ({
  useAuthViewModel: () => ({
    hasPermission: hasPermissionMock,
    user: ref({
      id: "user-interviewer-1",
      email: "rina@example.com",
    }),
  }),
}))

vi.mock("@/viewmodels/useInterviewEvaluationViewModel", () => ({
  useInterviewEvaluationViewModel: () => ({
    error: listErrorRef,
    interviewEvaluations: interviewEvaluationsRef,
    loading: listLoadingRef,
    refresh: refreshInterviewEvaluationsMock,
    remove: removeMock,
  }),
}))

vi.mock("@/viewmodels/useInterviewerFormViewModel", () => ({
  useInterviewerFormViewModel: () => ({
    assignedEvaluations: assignedEvaluationsRef,
    error: assignmentErrorRef,
    loading: assignmentLoadingRef,
    refresh: refreshAssignedEvaluationsMock,
  }),
}))

vi.mock("@/presentation/components/feedback/useAppToast", () => ({
  useAppToast: () => ({
    error: vi.fn(),
    deleted: vi.fn(),
  }),
}))

vi.mock("@/presentation/components/feedback/useAppConfirm", () => ({
  useAppConfirm: () => ({
    confirm: vi.fn(),
  }),
}))

vi.mock("@/presentation/components/buttons/AppActionButton.vue", () => ({
  default: {
    props: ["label"],
    emits: ["click"],
    template: '<button type="button" @click="$emit(\'click\')">{{ label }}</button>',
  },
}))

vi.mock("@/presentation/components/feedback/AppAlert.vue", () => ({
  default: {
    props: ["message"],
    template: '<div v-if="message">{{ message }}</div>',
  },
}))

vi.mock("@/presentation/components/feedback/AppLoadingOverlay.vue", () => ({
  default: {
    template: '<div data-testid="loading-overlay" />',
  },
}))

vi.mock("@/presentation/components/forms/AppSearchInput.vue", () => ({
  default: {
    props: ["modelValue", "placeholder"],
    emits: ["update:modelValue"],
    template: `
      <input
        :value="modelValue"
        :placeholder="placeholder"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    `,
  },
}))

vi.mock("../components/InterviewEvaluationTable.vue", () => ({
  default: {
    props: ["evaluations", "emptyLabel", "buildRowActions", "formatAverageScore"],
    emits: ["sort"],
    setup(props: Record<string, unknown>) {
      tablePropsHistory.push(props)
      return props
    },
    template: `
      <div data-testid="interview-evaluation-table">
        <button type="button" data-testid="sort-candidate" @click="$emit('sort', 'candidate_name')">Sort</button>
        <div v-for="evaluation in evaluations" :key="evaluation.id" data-testid="candidate-name">
          {{ evaluation.candidate_name }}
        </div>
        {{ emptyLabel }}
      </div>
    `,
  },
}))

describe("InterviewEvaluationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tablePropsHistory.length = 0
    interviewEvaluationsRef.value = []
    assignedEvaluationsRef.value = []
    listErrorRef.value = ""
    assignmentErrorRef.value = ""
    listLoadingRef.value = false
    assignmentLoadingRef.value = false
    refreshInterviewEvaluationsMock.mockResolvedValue(undefined)
    refreshAssignedEvaluationsMock.mockResolvedValue(undefined)
    removeMock.mockResolvedValue(undefined)
    routerPushMock.mockResolvedValue(undefined)
  })

  function createInterviewEvaluation(overrides: Partial<InterviewEvaluation> = {}): InterviewEvaluation {
    return {
      id: "evaluation-1",
      employee_request_form_id: "erf-1",
      candidate_service_candidate_id: "candidate-service-1",
      candidate_service_application_id: "application-1",
      candidate_name: "Yono Koh",
      applied_position: "Staff Admin",
      interviewer_name: "Rina - Lead",
      interviewer_recipients: [
        {
          user_id: "user-interviewer-1",
          name: "Rina",
          email: "rina@example.com",
          job_level: "Lead",
          label: "Rina - Lead",
        },
      ],
      interview_date: "2026-04-06",
      notes: null,
      comments: null,
      recommendation: null,
      created_by: "user-1",
      updated_by: "user-1",
      created_at: "2026-04-06T08:00:00",
      updated_at: "2026-04-06T08:00:00",
      scores: [],
      interviewer_results: [
        {
          id: "result-1",
          interview_evaluation_form_id: "evaluation-1",
          interviewer: {
            user_id: "user-interviewer-1",
            name: "Rina",
            email: "rina@example.com",
            job_level: "Lead",
            label: "Rina - Lead",
          },
          comments: null,
          recommendation: null,
          scores: [],
        },
      ],
      ...overrides,
    }
  }

  it("renders a single table for readers", async () => {
    hasPermissionMock.mockImplementation((permission: string) =>
      ["interview_evaluation:read", "interview_evaluation:create"].includes(permission),
    )

    const { default: InterviewEvaluationsPage } = await import("../InterviewEvaluationsPage.vue")
    const wrapper = mount(InterviewEvaluationsPage)

    expect(wrapper.findAll('[data-testid="interview-evaluation-table"]')).toHaveLength(1)
    expect(wrapper.text()).toContain("interviewEvaluations.list.actions.newAssessment")
    expect(tablePropsHistory).toHaveLength(1)
    expect(tablePropsHistory[0]?.emptyLabel).toBe("interviewEvaluations.list.noSaved")
  })

  it("keeps a single table and hides assessment create action for interviewer-only access", async () => {
    hasPermissionMock.mockImplementation((permission: string) =>
      permission === "interview_evaluation:interviewer_form",
    )

    const { default: InterviewEvaluationsPage } = await import("../InterviewEvaluationsPage.vue")
    const wrapper = mount(InterviewEvaluationsPage)

    expect(wrapper.findAll('[data-testid="interview-evaluation-table"]')).toHaveLength(1)
    expect(wrapper.text()).not.toContain("interviewEvaluations.list.actions.newAssessment")
    expect(tablePropsHistory).toHaveLength(1)
    expect(tablePropsHistory[0]?.emptyLabel).toBe("interviewEvaluations.interviewer.noAssignments")
  })

  it("shows interviewer average from the matched interviewer result when assigned summary scores are empty", async () => {
    hasPermissionMock.mockImplementation((permission: string) =>
      permission === "interview_evaluation:interviewer_form",
    )

    assignedEvaluationsRef.value = [
      createInterviewEvaluation({
        average_score: null,
        scores: [],
        interviewer_results: [
          {
            id: "result-1",
            interview_evaluation_form_id: "evaluation-1",
            interviewer: {
              user_id: "user-interviewer-1",
              name: "Rina",
              email: "rina@example.com",
              job_level: "Lead",
              label: "Rina - Lead",
            },
            comments: null,
            recommendation: "continue_recruitment",
            scores: Array.from({ length: 4 }, (_, index) => ({
              id: `score-${index + 1}`,
              interview_evaluation_form_id: "evaluation-1",
              interview_evaluation_interviewer_id: "result-1",
              item_number: index + 1,
              category_title: `Category ${index + 1}`,
              category_description: `Description ${index + 1}`,
              score: 3,
              info: null,
              created_at: "2026-04-06T08:00:00",
              updated_at: "2026-04-06T08:00:00",
            })),
          },
        ],
      }),
    ]

    const { default: InterviewEvaluationsPage } = await import("../InterviewEvaluationsPage.vue")
    mount(InterviewEvaluationsPage)

    const formatter = tablePropsHistory[0]?.formatAverageScore as
      | ((evaluation: InterviewEvaluation) => string)
      | undefined

    expect(formatter).toBeTypeOf("function")
    expect(formatter?.(assignedEvaluationsRef.value[0]!)).toBe("3.00")
  })

  it("orders mixed-role row actions as evaluate, detail, edit schedule, then delete", async () => {
    hasPermissionMock.mockImplementation((permission: string) =>
      [
        "interview_evaluation:read",
        "interview_evaluation:interviewer_form",
        "interview_evaluation:update",
        "interview_evaluation:delete",
      ].includes(permission),
    )
    interviewEvaluationsRef.value = [createInterviewEvaluation()]

    const { default: InterviewEvaluationsPage } = await import("../InterviewEvaluationsPage.vue")
    mount(InterviewEvaluationsPage)

    const buildRowActions = tablePropsHistory[0]?.buildRowActions as ((evaluation: InterviewEvaluation) => Array<{ label: string }>)
    const actions = buildRowActions(interviewEvaluationsRef.value[0]!)

    expect(actions.map((action) => action.label)).toEqual([
      "interviewEvaluations.interviewer.actions.evaluate",
      "common.actions.detail",
      "interviewEvaluations.page.actions.editAssessment",
      "interviewEvaluations.list.actions.delete",
    ])
  })

  it("sorts candidate names when /interview-evaluations table triggers sort", async () => {
    hasPermissionMock.mockImplementation((permission: string) =>
      permission === "interview_evaluation:read",
    )
    interviewEvaluationsRef.value = [
      createInterviewEvaluation({ id: "evaluation-1", candidate_name: "Zeta Candidate" }),
      createInterviewEvaluation({ id: "evaluation-2", candidate_name: "Alpha Candidate" }),
    ]

    const { default: InterviewEvaluationsPage } = await import("../InterviewEvaluationsPage.vue")
    const wrapper = mount(InterviewEvaluationsPage)

    const candidateNames = () =>
      wrapper.findAll('[data-testid="candidate-name"]').map((node) => node.text())

    expect(candidateNames()).toEqual(["Zeta Candidate", "Alpha Candidate"])

    await wrapper.get('[data-testid="sort-candidate"]').trigger("click")
    expect(candidateNames()).toEqual(["Alpha Candidate", "Zeta Candidate"])
  })
})
