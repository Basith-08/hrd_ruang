import { beforeEach, describe, expect, it, vi } from "vitest"
import { defineComponent, h, ref } from "vue"
import { flushPromises, mount } from "@vue/test-utils"

import type { InterviewEvaluation } from "@/domain/entities/InterviewEvaluation"

const removeMock = vi.fn()
const refreshMock = vi.fn()
const deletedToastMock = vi.fn()
const errorToastMock = vi.fn()
const hasPermissionMock = vi.fn()
const routerPushMock = vi.fn()

const errorRef = ref("")
const loadingRef = ref(false)
const interviewEvaluationsRef = ref<InterviewEvaluation[]>([])

vi.mock("#imports", () => ({
  useRouter: () => ({
    push: routerPushMock,
  }),
}))

vi.mock("@/presentation/components/menus/RowActionsMenu.vue", () => ({
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
          "div",
          {},
          (props.actions as Array<{ label: string; disabled?: boolean; onClick: () => void }>).map(
            (action) =>
              h(
                "button",
                {
                  type: "button",
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

vi.mock("@/presentation/components/feedback/useAppToast", () => ({
  useAppToast: () => ({
    deleted: deletedToastMock,
    error: errorToastMock,
  }),
}))

vi.mock("@/viewmodels/useAuthViewModel", () => ({
  useAuthViewModel: () => ({
    hasPermission: hasPermissionMock,
  }),
}))

vi.mock("@/viewmodels/useInterviewEvaluationViewModel", () => ({
  useInterviewEvaluationViewModel: () => ({
    error: errorRef,
    interviewEvaluations: interviewEvaluationsRef,
    loading: loadingRef,
    refresh: refreshMock,
    remove: removeMock,
  }),
}))

function createInterviewEvaluation(overrides: Partial<InterviewEvaluation> = {}): InterviewEvaluation {
  return {
    id: "evaluation-1",
    employee_request_form_id: "erf-1",
    candidate_service_candidate_id: "candidate-service-1",
    candidate_service_application_id: "application-1",
    candidate_name: "Yono Koh",
    applied_position: "Staff Admin",
    interviewer_name: "Rina",
    interviewer_recipients: [],
    interview_date: "2026-04-06",
    notes: null,
    comments: "Strong communication and initiative.",
    recommendation: "continue_recruitment",
    created_by: "user-1",
    updated_by: "user-1",
    created_at: "2026-04-06T08:00:00",
    updated_at: "2026-04-06T08:00:00",
    scores: [
      {
        id: "score-1",
        interview_evaluation_form_id: "evaluation-1",
        item_number: 1,
        category_title: "Work Experience",
        category_description: "Alignment of years of service.",
        score: 4,
        info: "Relevant background",
        created_at: "2026-04-06T08:00:00",
        updated_at: "2026-04-06T08:00:00",
      },
    ],
    ...overrides,
  }
}

function createInterviewEvaluationBatch(count: number) {
  return Array.from({ length: count }, (_, index) =>
    createInterviewEvaluation({
      id: `evaluation-${index + 1}`,
      candidate_name: `Candidate ${index + 1}`,
      comments: `Comment ${index + 1}`,
      scores: [
        {
          id: `score-${index + 1}`,
          interview_evaluation_form_id: `evaluation-${index + 1}`,
          item_number: 1,
          category_title: "Work Experience",
          category_description: "Alignment of years of service.",
          score: 4,
          info: `Info ${index + 1}`,
          created_at: "2026-04-06T08:00:00",
          updated_at: "2026-04-06T08:00:00",
        },
      ],
    }),
  )
}

describe("InterviewEvaluationListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal("confirm", vi.fn(() => true))

    errorRef.value = ""
    loadingRef.value = false
    interviewEvaluationsRef.value = [createInterviewEvaluation()]
    hasPermissionMock.mockReturnValue(true)
    removeMock.mockResolvedValue(undefined)
    refreshMock.mockResolvedValue(undefined)
  })

  it("routes to the form page when editing a saved assessment", async () => {
    interviewEvaluationsRef.value = [
      createInterviewEvaluation({
        scores: [],
      }),
    ]

    const { default: InterviewEvaluationListPage } = await import("../InterviewEvaluationListPage.vue")
    const wrapper = mount(InterviewEvaluationListPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    const editButton = wrapper.findAll("button").find((button) => button.text().includes("Edit"))
    expect(editButton).toBeDefined()
    await editButton!.trigger("click")

    expect(routerPushMock).toHaveBeenCalledWith({
      path: "/interview-evaluations/manage",
      query: { edit: "evaluation-1" },
    })
  })

  it("opens the new assessment form from the header action", async () => {
    const { default: InterviewEvaluationListPage } = await import("../InterviewEvaluationListPage.vue")
    const wrapper = mount(InterviewEvaluationListPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    const newAssessmentButton = wrapper
      .findAll("button")
      .find((button) => button.text().includes("New Assessment"))
    expect(newAssessmentButton).toBeDefined()
    await newAssessmentButton!.trigger("click")

    expect(routerPushMock).toHaveBeenCalledWith({
      path: "/interview-evaluations/manage",
      query: {},
    })
  })

  it("shows an empty-state table row when no assessments are saved", async () => {
    interviewEvaluationsRef.value = []

    const { default: InterviewEvaluationListPage } = await import("../InterviewEvaluationListPage.vue")
    const wrapper = mount(InterviewEvaluationListPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain("No interview evaluations have been saved yet.")
  })

  it("paginates the assessment table", async () => {
    interviewEvaluationsRef.value = createInterviewEvaluationBatch(12)

    const { default: InterviewEvaluationListPage } = await import("../InterviewEvaluationListPage.vue")
    const wrapper = mount(InterviewEvaluationListPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    const firstPageCells = wrapper.findAll("tbody tr td:first-child")
    expect(firstPageCells[0]?.text()).toBe("1")
    expect(firstPageCells[9]?.text()).toBe("10")
    expect(wrapper.text()).toContain("Candidate 1")
    expect(wrapper.text()).toContain("Candidate 10")
    expect(wrapper.text()).toContain("Showing")
    expect(wrapper.text()).toContain("12")
    expect(wrapper.findAll("tbody tr")).toHaveLength(10)

    const nextButton = wrapper.findAll("button").find((button) => button.text().includes("Next"))
    expect(nextButton).toBeDefined()
    await nextButton!.trigger("click")

    expect(wrapper.text()).toContain("Candidate 11")
    expect(wrapper.text()).toContain("Candidate 12")
    expect(wrapper.text()).toContain("Page 2 / 2")
    expect(wrapper.findAll("tbody tr")).toHaveLength(2)

    const secondPageCells = wrapper.findAll("tbody tr td:first-child")
    expect(secondPageCells[0]?.text()).toBe("11")
    expect(secondPageCells[1]?.text()).toBe("12")
  })

  it("uses interviewer recipients for display and search", async () => {
    interviewEvaluationsRef.value = [
      createInterviewEvaluation({
        interviewer_name: "Legacy Name",
        interviewer_recipients: [
          {
            user_id: "user-9",
            name: "Dewi",
            email: "dewi@example.com",
            job_level: "Senior",
            label: "Dewi - Senior",
          },
        ],
      }),
    ]

    const { default: InterviewEvaluationListPage } = await import("../InterviewEvaluationListPage.vue")
    const wrapper = mount(InterviewEvaluationListPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain("Dewi - Senior")
    expect(wrapper.text()).not.toContain("Legacy Name")

    const searchInput = wrapper.find('input[type="search"]')
    await searchInput.setValue("user-9")
    await flushPromises()

    expect(wrapper.text()).toContain("Yono Koh")
  })

  it("uses persisted average_score when available", async () => {
    interviewEvaluationsRef.value = [
      createInterviewEvaluation({
        average_score: 3.25,
        scores: [],
      }),
    ]

    const { default: InterviewEvaluationListPage } = await import("../InterviewEvaluationListPage.vue")
    const wrapper = mount(InterviewEvaluationListPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain("3.25")
  })
})
