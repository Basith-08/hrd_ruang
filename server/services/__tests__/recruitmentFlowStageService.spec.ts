import { beforeEach, describe, expect, it, vi } from "vitest"

const listManagedCandidateUsersFromCandidateDatabaseMock = vi.fn()

vi.mock("~~/server/services/candidateDatabaseReadService.js", () => ({
  listCandidateStatusSignalsByEmployeeRequestFormIds:
    listManagedCandidateUsersFromCandidateDatabaseMock,
}))

function createSupabase(options?: {
  employeeRequestForm?: Record<string, unknown>
  approvalChain?: Record<string, unknown> | null
  interviewForms?: Array<Record<string, unknown>>
  employeeContractForms?: Array<Record<string, unknown>>
  employeeRequestFormUpdateError?: { message: string } | null
}) {
  const employeeRequestFormState = {
    ...(options?.employeeRequestForm ?? {
      id: "erf-1",
      status: "open",
      closed_category: null,
    }),
  }
  const employeeRequestFormUpdates = []
  const employeeRequestForm = employeeRequestFormState
  const approvalChain = options?.approvalChain ?? {
    id: "erf-1",
    status: "approved",
    steps: [
      { step_order: 1, status: "approved" },
      { step_order: 2, status: "approved" },
      { step_order: 3, status: "approved" },
    ],
  }
  const interviewForms = options?.interviewForms ?? []
  const employeeContractForms = options?.employeeContractForms ?? []
  const employeeRequestFormUpdateError = options?.employeeRequestFormUpdateError ?? null

  return {
    __employeeRequestFormUpdates: employeeRequestFormUpdates,
    from: vi.fn((table: string) => {
      if (table === "employee_request_form") {
        const maybeSingle = vi.fn().mockResolvedValue({
          data: employeeRequestFormState,
          error: null,
        })
        const eq = vi.fn(() => ({
          maybeSingle,
        }))
        const inMock = vi.fn().mockResolvedValue({
          data: [
            {
              id: employeeRequestFormState.id,
              recruitment_flow_stage: employeeRequestFormState.recruitment_flow_stage ?? null,
              status: employeeRequestFormState.status,
            },
          ],
          error: null,
        })

        return {
          select: vi.fn(() => ({
            eq,
            in: inMock,
          })),
          update: vi.fn((payload) => {
            employeeRequestFormUpdates.push(payload)
            Object.assign(employeeRequestFormState, payload)

            return {
              eq: vi.fn().mockResolvedValue({
                error: employeeRequestFormUpdateError,
              }),
            }
          }),
        }
      }

      if (table === "approval_chains") {
        const maybeSingle = vi.fn().mockResolvedValue({
          data: approvalChain,
          error: null,
        })
        const limit = vi.fn(() => ({ maybeSingle }))
        const secondOrder = vi.fn(() => ({ limit }))
        const firstOrder = vi.fn(() => ({ order: secondOrder }))
        const eq = vi.fn(() => ({ order: firstOrder }))
        return {
          select: vi.fn(() => ({ eq })),
        }
      }

      if (table === "interview_evaluation_forms") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: interviewForms,
              error: null,
            }),
          })),
        }
      }

      if (table === "employee_contract_form") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({
                data: employeeContractForms,
                error: null,
              }),
            })),
          })),
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    }),
  }
}

describe("recruitmentFlowStageService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns candidate form in progress when a candidate has started the form", async () => {
    listManagedCandidateUsersFromCandidateDatabaseMock.mockResolvedValue([
      {
        id: "candidate-1",
        employee_request_form_id: "erf-1",
        role: "candidate",
        candidate_form_completion_status: "in_progress",
        candidate_form_created_at: "2026-05-20T08:00:00",
        candidate_form_updated_at: "2026-05-21T09:00:00",
      },
    ])

    const { resolvePersistedRecruitmentFlowStage } = await import("../recruitmentFlowStageService.js")
    const stage = await resolvePersistedRecruitmentFlowStage(createSupabase() as any, "erf-1")

    expect(stage).toBe("assessment_list_created")
  })

  it("returns approval in progress when the approval chain still has a pending step", async () => {
    listManagedCandidateUsersFromCandidateDatabaseMock.mockResolvedValue([])

    const { resolvePersistedRecruitmentFlowStage } = await import("../recruitmentFlowStageService.js")
    const stage = await resolvePersistedRecruitmentFlowStage(createSupabase({
      approvalChain: {
        id: "chain-1",
        status: "pending",
        steps: [
          { step_order: 1, status: "approved" },
          { step_order: 2, status: "pending" },
          { step_order: 3, status: "pending" },
        ],
      },
    }) as any, "erf-1")

    expect(stage).toBe("approval_in_progress")
  })

  it("returns interview scheduled when an assessment list already exists", async () => {
    listManagedCandidateUsersFromCandidateDatabaseMock.mockResolvedValue([
      {
        id: "candidate-1",
        employee_request_form_id: "erf-1",
        role: "candidate",
        candidate_form_completion_status: "in_progress",
        candidate_form_created_at: "2026-05-20T08:00:00",
        candidate_form_updated_at: "2026-05-21T09:00:00",
      },
    ])

    const { resolvePersistedRecruitmentFlowStage } = await import("../recruitmentFlowStageService.js")
    const stage = await resolvePersistedRecruitmentFlowStage(createSupabase({
      interviewForms: [{ id: "evaluation-1", interview_date: null, interviewers: [] }],
    }) as any, "erf-1")

    expect(stage).toBe("interview_scheduled")
  })

  it("returns interview evaluation in progress when one interviewer has completed the assessment", async () => {
    listManagedCandidateUsersFromCandidateDatabaseMock.mockResolvedValue([
      {
        id: "candidate-1",
        employee_request_form_id: "erf-1",
        role: "candidate",
        candidate_form_completion_status: "in_progress",
        candidate_form_created_at: "2026-05-20T08:00:00",
        candidate_form_updated_at: "2026-05-21T09:00:00",
      },
    ])

    const completedScores = Array.from({ length: 10 }, (_, index) => ({ score: 5, item_number: index + 1 }))

    const { resolvePersistedRecruitmentFlowStage } = await import("../recruitmentFlowStageService.js")
    const stage = await resolvePersistedRecruitmentFlowStage(createSupabase({
      interviewForms: [
        {
          id: "evaluation-1",
          interview_date: null,
          interviewers: [
            {
              recommendation: "continue_recruitment",
              scores: completedScores,
            },
            {
              recommendation: null,
              scores: [],
            },
          ],
        },
      ],
    }) as any, "erf-1")

    expect(stage).toBe("interview_evaluation_in_progress")
  })

  it("treats an interviewer as completed when all 10 scores are filled even if no recommendation was selected", async () => {
    listManagedCandidateUsersFromCandidateDatabaseMock.mockResolvedValue([
      {
        id: "candidate-1",
        employee_request_form_id: "erf-1",
        role: "candidate",
        candidate_form_completion_status: "in_progress",
        candidate_form_created_at: "2026-05-20T08:00:00",
        candidate_form_updated_at: "2026-05-21T09:00:00",
      },
    ])

    const completedScores = Array.from({ length: 10 }, (_, index) => ({ score: 4, item_number: index + 1 }))

    const { resolvePersistedRecruitmentFlowStage } = await import("../recruitmentFlowStageService.js")
    const stage = await resolvePersistedRecruitmentFlowStage(createSupabase({
      interviewForms: [
        {
          id: "evaluation-1",
          interview_date: "2026-07-14",
          interviewers: [
            {
              recommendation: null,
              scores: completedScores,
            },
          ],
        },
      ],
    }) as any, "erf-1")

    expect(stage).toBe("interview_evaluation_completed")
  })

  it("returns interview evaluation completed when at least one candidate's interview is fully completed, even if another candidate on the same ERF is still in progress", async () => {
    listManagedCandidateUsersFromCandidateDatabaseMock.mockResolvedValue([
      {
        id: "candidate-1",
        employee_request_form_id: "erf-1",
        role: "candidate",
        candidate_form_completion_status: "completed",
        candidate_form_created_at: "2026-05-20T08:00:00",
        candidate_form_updated_at: "2026-05-21T09:00:00",
      },
      {
        id: "candidate-2",
        employee_request_form_id: "erf-1",
        role: "candidate",
        candidate_form_completion_status: "in_progress",
        candidate_form_created_at: "2026-05-20T08:00:00",
        candidate_form_updated_at: "2026-05-21T09:00:00",
      },
    ])

    const completedScores = Array.from({ length: 10 }, (_, index) => ({ score: 5, item_number: index + 1 }))

    const { resolvePersistedRecruitmentFlowStage } = await import("../recruitmentFlowStageService.js")
    const stage = await resolvePersistedRecruitmentFlowStage(createSupabase({
      interviewForms: [
        {
          id: "evaluation-candidate-1",
          interview_date: "2026-05-25",
          interviewers: [
            {
              recommendation: "continue_recruitment",
              scores: completedScores,
            },
          ],
        },
        {
          id: "evaluation-candidate-2",
          interview_date: "2026-05-26",
          interviewers: [
            {
              recommendation: null,
              scores: [],
            },
          ],
        },
      ],
    }) as any, "erf-1")

    expect(stage).toBe("interview_evaluation_completed")
  })

  it("returns employee form in progress when the employee has started the form", async () => {
    listManagedCandidateUsersFromCandidateDatabaseMock.mockResolvedValue([
      {
        id: "candidate-1",
        employee_request_form_id: "erf-1",
        role: "employee",
        candidate_form_completion_status: "in_progress",
        candidate_form_created_at: "2026-05-20T08:00:00",
        candidate_form_updated_at: "2026-05-21T09:00:00",
      },
    ])

    const { resolvePersistedRecruitmentFlowStage } = await import("../recruitmentFlowStageService.js")
    const stage = await resolvePersistedRecruitmentFlowStage(createSupabase() as any, "erf-1")

    expect(stage).toBe("candidate_selected")
  })

  it("returns employee contract form in progress when the employee has submitted the form", async () => {
    listManagedCandidateUsersFromCandidateDatabaseMock.mockResolvedValue([
      {
        id: "candidate-1",
        employee_request_form_id: "erf-1",
        role: "employee",
        candidate_form_completion_status: "completed",
        candidate_form_is_submitted: true,
        candidate_form_created_at: "2026-05-20T08:00:00",
        candidate_form_updated_at: "2026-05-21T09:00:00",
      },
    ])

    const { resolvePersistedRecruitmentFlowStage } = await import("../recruitmentFlowStageService.js")
    const stage = await resolvePersistedRecruitmentFlowStage(createSupabase() as any, "erf-1")

    expect(stage).toBe("employee_contract_form_in_progress")
  })

  it("keeps employee form in progress when submission is stale and effective completion is not reached", async () => {
    listManagedCandidateUsersFromCandidateDatabaseMock.mockResolvedValue([
      {
        id: "candidate-1",
        employee_request_form_id: "erf-1",
        role: "employee",
        candidate_form_completion_status: "in_progress",
        candidate_form_is_submitted: true,
        candidate_form_created_at: "2026-05-20T08:00:00",
        candidate_form_updated_at: "2026-05-21T09:00:00",
      },
    ])

    const { resolvePersistedRecruitmentFlowStage } = await import("../recruitmentFlowStageService.js")
    const stage = await resolvePersistedRecruitmentFlowStage(createSupabase() as any, "erf-1")

    expect(stage).toBe("candidate_selected")
  })

  it("returns candidate sourcing when the candidate form is still untouched after account binding", async () => {
    listManagedCandidateUsersFromCandidateDatabaseMock.mockResolvedValue([
      {
        id: "candidate-1",
        employee_request_form_id: "erf-1",
        role: "candidate",
        candidate_form_completion_status: "in_progress",
        candidate_form_created_at: "2026-05-20T08:00:00",
        candidate_form_updated_at: "2026-05-20T08:00:00",
      },
    ])

    const { resolvePersistedRecruitmentFlowStage } = await import("../recruitmentFlowStageService.js")
    const stage = await resolvePersistedRecruitmentFlowStage(createSupabase() as any, "erf-1")

    expect(stage).toBe("candidate_sourcing")
  })

  it("returns assign recruiter when the ERF is approved and already has a recruiter", async () => {
    listManagedCandidateUsersFromCandidateDatabaseMock.mockResolvedValue([])

    const { resolvePersistedRecruitmentFlowStage } = await import("../recruitmentFlowStageService.js")
    const stage = await resolvePersistedRecruitmentFlowStage(createSupabase({
      employeeRequestForm: {
        id: "erf-1",
        status: "open",
        closed_category: null,
        recruiter_user_id: "recruiter-1",
      },
    }) as any, "erf-1")

    expect(stage).toBe("assign_recruiter")
  })

  it("closes the ERF as hired when employee contract documents are complete", async () => {
    listManagedCandidateUsersFromCandidateDatabaseMock.mockResolvedValue([
      {
        id: "candidate-1",
        employee_request_form_id: "erf-1",
        role: "employee",
        candidate_form_completion_status: "completed",
        candidate_form_is_submitted: true,
        candidate_form_created_at: "2026-05-20T08:00:00",
        candidate_form_updated_at: "2026-05-21T09:00:00",
        candidate_form_has_contract_documents: true,
      },
    ])

    const supabase = createSupabase() as any

    const { syncRecruitmentFlowStage } = await import("../recruitmentFlowStageService.js")
    const stage = await syncRecruitmentFlowStage(supabase, "erf-1")

    expect(stage).toBe("hiring_completed")
    expect(supabase.__employeeRequestFormUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: "closed",
          closed_category: "employee hired",
          reason: "hired",
        }),
        expect.objectContaining({
          recruitment_flow_stage: "hiring_completed",
        }),
      ]),
    )
  })

  it("does not self-heal stale persisted stages to employee contract form in progress until the employee form is effectively completed", async () => {
    listManagedCandidateUsersFromCandidateDatabaseMock.mockResolvedValue([
      {
        id: "candidate-1",
        employee_request_form_id: "erf-1",
        role: "employee",
        candidate_form_completion_status: "in_progress",
        candidate_form_is_submitted: true,
        candidate_form_created_at: "2026-05-20T08:00:00",
        candidate_form_updated_at: "2026-05-21T09:00:00",
      },
    ])

    const supabase = createSupabase({
      employeeRequestForm: {
        id: "erf-1",
        status: "open",
        closed_category: null,
        recruitment_flow_stage: "candidate_selected",
      },
    }) as any

    const { listPersistedRecruitmentFlowStages } = await import("../recruitmentFlowStageService.js")
    const result = await listPersistedRecruitmentFlowStages(supabase, ["erf-1"])

    expect(result.get("erf-1")).toBe("candidate_selected")
    expect(supabase.__employeeRequestFormUpdates).toEqual([])
  })

  it("does not throw when the database constraint still rejects the new stage", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

    listManagedCandidateUsersFromCandidateDatabaseMock.mockResolvedValue([
      {
        id: "candidate-1",
        employee_request_form_id: "erf-1",
        role: "employee",
        candidate_form_completion_status: "in_progress",
        candidate_form_is_submitted: true,
        candidate_form_created_at: "2026-05-20T08:00:00",
        candidate_form_updated_at: "2026-05-21T09:00:00",
      },
    ])

    const supabase = createSupabase({
      employeeRequestFormUpdateError: {
        message:
          'new row for relation "employee_request_form" violates check constraint "employee_request_form_recruitment_flow_stage_check"',
      },
    }) as any

    const { syncRecruitmentFlowStage } = await import("../recruitmentFlowStageService.js")
    const stage = await syncRecruitmentFlowStage(supabase, "erf-1")

    expect(stage).toBe("candidate_selected")
    expect(warnSpy).toHaveBeenCalled()

    warnSpy.mockRestore()
  })
})
