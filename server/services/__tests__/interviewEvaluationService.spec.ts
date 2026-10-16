import { beforeEach, describe, expect, it, vi } from "vitest"

const listCandidateFormsForDashboardMock = vi.fn()
const getCandidateFormForDashboardMock = vi.fn()
const getTransporterMock = vi.fn()
const listCandidateStatusSignalsByEmployeeRequestFormIdsMock = vi.fn()

vi.mock("~~/server/services/candidateFormReadService.js", () => ({
  getCandidateFormForDashboard: getCandidateFormForDashboardMock,
  listCandidateFormsForDashboard: listCandidateFormsForDashboardMock,
}))

vi.mock("~~/server/services/candidateDatabaseReadService.js", () => ({
  listCandidateStatusSignalsByEmployeeRequestFormIds:
    listCandidateStatusSignalsByEmployeeRequestFormIdsMock,
}))

vi.mock("~~/server/services/mailer.js", () => ({
  getTransporter: getTransporterMock,
}))

function createEvaluationRow() {
  const firstInterviewerScores = Array.from({ length: 10 }, (_, index) => ({
    id: `score-1-${index + 1}`,
    interview_evaluation_interviewer_id: "interviewer-1",
    item_number: index + 1,
    category_title: `Category ${index + 1}`,
    category_description: `Description ${index + 1}`,
    score: 5,
    info: `Positive note ${index + 1}`,
  }))

  const secondInterviewerScores = Array.from({ length: 10 }, (_, index) => ({
    id: `score-2-${index + 1}`,
    interview_evaluation_interviewer_id: "interviewer-2",
    item_number: index + 1,
    category_title: `Category ${index + 1}`,
    category_description: `Description ${index + 1}`,
    score: 1,
    info: `Critical note ${index + 1}`,
  }))

  return {
    id: "evaluation-1",
    employee_request_form_id: "erf-1",
    candidate_service_candidate_id: "candidate-1",
    candidate_service_application_id: "application-1",
    candidate_name: "Brian Joyo",
    applied_position: "HR Ops",
    interviewer_name: "Legacy Interviewer",
    interviewer_recipients: [
      {
        user_id: "user-1",
        name: "Hafis Maulana",
        email: "hafis@example.com",
        job_level: "Mgr",
        label: "Hafis Maulana - Mgr",
      },
      {
        user_id: "user-2",
        name: "As Fine Basith",
        email: "basith@example.com",
        job_level: "Dir",
        label: "As Fine Basith - Dir",
      },
    ],
    interview_date: "2026-04-24",
    comments: "Legacy comment",
    recommendation: "find_comparison_candidate",
    created_by: "hr-1",
    updated_by: "hr-1",
    created_at: "2026-04-24T10:00:00Z",
    updated_at: "2026-04-24T10:00:00Z",
    scores: [
      {
        id: "legacy-score-1",
        interview_evaluation_form_id: "evaluation-1",
        item_number: 1,
        category_title: "Work Experience",
        category_description: "Legacy score",
        score: 2,
        info: "Legacy info",
      },
    ],
    interviewers: [
      {
        id: "interviewer-1",
        interview_evaluation_form_id: "evaluation-1",
        interviewer_user_id: "user-1",
        interviewer_name: "Hafis Maulana",
        interviewer_email: "hafis@example.com",
        interviewer_job_level: "Mgr",
        interviewer_label: "Hafis Maulana - Mgr",
        comments: "Strong leadership.",
        recommendation: "continue_recruitment",
        scores: firstInterviewerScores,
      },
      {
        id: "interviewer-2",
        interview_evaluation_form_id: "evaluation-1",
        interviewer_user_id: "user-2",
        interviewer_name: "As Fine Basith",
        interviewer_email: "basith@example.com",
        interviewer_job_level: "Dir",
        interviewer_label: "As Fine Basith - Dir",
        comments: "Needs stronger strategic examples.",
        recommendation: "stop_recruitment",
        scores: secondInterviewerScores,
      },
    ],
  }
}

function createSupabaseContext(rows) {
  const formsSelectMock = vi.fn((selection) => {
    if (typeof selection !== "string" || !selection.includes("interviewers:interview_evaluation_interviewers")) {
      throw new Error(`Unexpected select clause: ${String(selection)}`)
    }

    return {
      order: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({ data: rows, error: null }),
      })),
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({ data: rows[0] ?? null, error: null }),
      })),
    }
  })

  const employeeRequestFormIds = [
    ...new Set(rows.map((row) => String(row.employee_request_form_id ?? "").trim()).filter(Boolean)),
  ]

  return {
    permissions: ["interview_evaluation:interviewer_form"],
    roleName: "Interviewer",
    userId: "user-1",
    authUser: {
      email: "hafis@example.com",
    },
    supabase: {
      from: vi.fn((table) => {
        if (table === "interview_evaluation_forms") {
          return {
            select: formsSelectMock,
          }
        }

        if (table === "employee_request_form") {
          return {
            select: vi.fn(() => ({
              in: vi.fn().mockResolvedValue({
                data: employeeRequestFormIds.map((id) => ({
                  id,
                  recruitment_flow_stage: "interview_evaluation_in_progress",
                })),
                error: null,
              }),
            })),
          }
        }

        throw new Error(`Unexpected table: ${table}`)
      }),
    },
  }
}

describe("interviewEvaluationService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listCandidateFormsForDashboardMock.mockResolvedValue([])
    getCandidateFormForDashboardMock.mockResolvedValue(null)
    listCandidateStatusSignalsByEmployeeRequestFormIdsMock.mockResolvedValue([])
    getTransporterMock.mockReturnValue({
      sendMail: vi.fn(),
    })
  })

  it("returns interviewer-specific evaluation details for the assigned user", async () => {
    const { getAssignedInterviewEvaluation } = await import("../interviewEvaluationService.js")
    const row = createEvaluationRow()
    const context = createSupabaseContext([row])

    const evaluation = await getAssignedInterviewEvaluation(context, row.id)

    expect(evaluation.interviewer_name).toBe("Hafis Maulana - Mgr")
    expect(evaluation.comments).toBe("Strong leadership.")
    expect(evaluation.recommendation).toBe("continue_recruitment")
    expect(evaluation.scores).toHaveLength(10)
    expect(evaluation.scores[0]).toMatchObject({
      item_number: 1,
      score: 5,
      info: "Positive note 1",
      interview_evaluation_form_id: row.id,
    })
  })

  it("returns different results for different interviewers on the same form", async () => {
    const { getAssignedInterviewEvaluation, listAssignedInterviewEvaluations } = await import(
      "../interviewEvaluationService.js"
    )
    const row = createEvaluationRow()
    const firstContext = createSupabaseContext([row])
    const secondContext = createSupabaseContext([row])

    firstContext.userId = "user-1"
    firstContext.authUser.email = "hafis@example.com"
    secondContext.userId = "user-2"
    secondContext.authUser.email = "basith@example.com"

    const [firstEvaluation, secondEvaluation, secondList] = await Promise.all([
      getAssignedInterviewEvaluation(firstContext, row.id),
      getAssignedInterviewEvaluation(secondContext, row.id),
      listAssignedInterviewEvaluations(secondContext),
    ])

    expect(firstEvaluation.interviewer_name).toBe("Hafis Maulana - Mgr")
    expect(firstEvaluation.recommendation).toBe("continue_recruitment")
    expect(firstEvaluation.scores[0]?.score).toBe(5)
    expect(firstEvaluation.average_score).toBe(3)

    expect(secondEvaluation.interviewer_name).toBe("As Fine Basith - Dir")
    expect(secondEvaluation.comments).toBe("Needs stronger strategic examples.")
    expect(secondEvaluation.recommendation).toBe("stop_recruitment")
    expect(secondEvaluation.scores[0]?.score).toBe(1)
    expect(secondEvaluation.average_score).toBe(3)

    expect(secondList).toEqual([
      expect.objectContaining({
        id: row.id,
        employee_request_form_id: row.employee_request_form_id,
        recruitment_flow_stage: "interview_evaluation_in_progress",
        candidate_service_candidate_id: row.candidate_service_candidate_id,
        candidate_service_application_id: row.candidate_service_application_id,
        average_score: 3,
        interviewer_name: "As Fine Basith - Dir",
        is_completed: true,
      }),
    ])
  })

  it("falls back to employee form progress only when persisted stage is unavailable", async () => {
    const { listAssignedInterviewEvaluations } = await import("../interviewEvaluationService.js")
    const row = createEvaluationRow()
    const context = createSupabaseContext([row])

    context.permissions = ["interview_evaluation:read"]
    context.supabase.from = vi.fn((table) => {
      if (table === "interview_evaluation_forms") {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: [row], error: null }),
            })),
          })),
        }
      }

      if (table === "employee_request_form") {
        return {
          select: vi.fn(() => ({
            in: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "erf-1",
                  recruitment_flow_stage: null,
                },
              ],
              error: null,
            }),
          })),
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    })
    listCandidateStatusSignalsByEmployeeRequestFormIdsMock.mockResolvedValue([
      {
        employee_request_form_id: "erf-1",
        role: "employee",
        candidate_form_completion_status: "in_progress",
        candidate_form_created_at: "2026-05-20T08:00:00",
        candidate_form_updated_at: "2026-05-21T09:00:00",
      },
    ])

    const evaluations = await listAssignedInterviewEvaluations(context)

    expect(evaluations[0]?.recruitment_flow_stage).toBe("candidate_selected")
  })

  it("keeps fallback at employee form in progress until the employee form is effectively completed", async () => {
    const { listAssignedInterviewEvaluations } = await import("../interviewEvaluationService.js")
    const row = createEvaluationRow()
    const context = createSupabaseContext([row])

    context.permissions = ["interview_evaluation:read"]
    context.supabase.from = vi.fn((table) => {
      if (table === "interview_evaluation_forms") {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: [row], error: null }),
            })),
          })),
        }
      }

      if (table === "employee_request_form") {
        return {
          select: vi.fn(() => ({
            in: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "erf-1",
                  recruitment_flow_stage: null,
                },
              ],
              error: null,
            }),
          })),
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    })
    listCandidateStatusSignalsByEmployeeRequestFormIdsMock.mockResolvedValue([
      {
        employee_request_form_id: "erf-1",
        role: "employee",
        candidate_form_completion_status: "in_progress",
        candidate_form_is_submitted: true,
        candidate_form_created_at: "2026-05-20T08:00:00",
        candidate_form_updated_at: "2026-05-21T09:00:00",
        candidate_form_has_contract_documents: false,
      },
    ])

    const evaluations = await listAssignedInterviewEvaluations(context)

    expect(evaluations[0]?.recruitment_flow_stage).toBe("candidate_selected")
  })

  it("matches interviewer rows by user id during update even when names are identical", async () => {
    const { updateInterviewEvaluation } = await import("../interviewEvaluationService.js")

    listCandidateFormsForDashboardMock.mockResolvedValue([
      {
        id: "form-1",
        role: "candidate",
        candidate_source: "candidate_service",
        full_name: "Brian Joyo",
        employee_request_form_id: "erf-1",
        candidate_service_candidate_id: "candidate-1",
        candidate_service_application_id: "application-1",
        completion_status: "completed",
        updated_at: "2026-04-24T10:00:00Z",
        employee_request_form: {
          main_position: "HR Ops",
        },
      },
    ])

    const syncedRows = [
      {
        id: "row-1",
        interview_evaluation_form_id: "evaluation-1",
        interviewer_user_id: "user-1",
        interviewer_name: "Alex",
        interviewer_email: "alex1@example.com",
        interviewer_job_level: "Mgr",
        interviewer_label: "Alex",
        comments: null,
        recommendation: null,
        scores: [],
      },
      {
        id: "row-2",
        interview_evaluation_form_id: "evaluation-1",
        interviewer_user_id: "user-2",
        interviewer_name: "Alex",
        interviewer_email: "alex2@example.com",
        interviewer_job_level: "Mgr",
        interviewer_label: "Alex",
        comments: null,
        recommendation: null,
        scores: [],
      },
    ]

    const interviewerSyncUpdates: Array<{ id: string; payload: Record<string, unknown> }> = []
    const interviewerMetaUpdates: Array<{ id: string; payload: Record<string, unknown> }> = []
    const scoreInsertPayloads: Array<Array<Record<string, unknown>>> = []
    const formUpdatePayloads: Array<Record<string, unknown>> = []

    const context = {
      permissions: ["interview_evaluation:update"],
      roleName: "HR",
      userId: "user-editor",
      authUser: {
        email: "editor@example.com",
      },
      supabase: {
        from: vi.fn((table) => {
          if (table === "interview_evaluation_forms") {
            return {
              select: vi.fn((selection) => {
                if (selection === "id") {
                  return {
                    eq: vi.fn(() => ({
                      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "evaluation-1" }, error: null }),
                    })),
                  }
                }

                if (selection === "id, interviewer_name, interviewer_recipients, interviewers:interview_evaluation_interviewers(*)") {
                  return {
                    eq: vi.fn(() => ({
                      limit: vi.fn().mockResolvedValue({
                        data: [
                          {
                            id: "evaluation-1",
                            interviewer_name: "Alex, Alex",
                            interviewer_recipients: [
                              {
                                user_id: "user-1",
                                name: "Alex",
                                email: "alex1@example.com",
                                job_level: "Mgr",
                                label: "Alex",
                              },
                              {
                                user_id: "user-2",
                                name: "Alex",
                                email: "alex2@example.com",
                                job_level: "Mgr",
                                label: "Alex",
                              },
                            ],
                            interviewers: syncedRows,
                          },
                        ],
                        error: null,
                      }),
                    })),
                  }
                }

                return {
                  eq: vi.fn(() => ({
                    limit: vi.fn().mockResolvedValue({
                      data: [
                        {
                          id: "evaluation-1",
                          candidate_name: "Brian Joyo",
                          applied_position: "HR Ops",
                          interviewer_name: "Alex, Alex",
                          interviewer_recipients: [
                            {
                              user_id: "user-2",
                              name: "Alex",
                              email: "alex2@example.com",
                              job_level: "Mgr",
                              label: "Alex",
                            },
                            {
                              user_id: "user-1",
                              name: "Alex",
                              email: "alex1@example.com",
                              job_level: "Mgr",
                              label: "Alex",
                            },
                          ],
                          interview_date: "2026-04-24",
                          interviewers: syncedRows,
                        },
                      ],
                      error: null,
                    }),
                  })),
                }
              }),
              update: vi.fn((payload) => ({
                eq: vi.fn().mockImplementation(() => {
                  formUpdatePayloads.push(payload)
                  return Promise.resolve({ error: null })
                }),
              })),
            }
          }

          if (table === "interview_evaluation_interviewers") {
            return {
              select: vi.fn((selection) => {
                if (selection === "*") {
                  return {
                    eq: vi.fn().mockResolvedValue({ data: syncedRows, error: null }),
                  }
                }

                return {
                  eq: vi.fn().mockResolvedValue({ data: syncedRows, error: null }),
                }
              }),
              update: vi.fn((payload) => ({
                eq: vi.fn((column, value) => {
                  const id = value ?? column
                  if ("comments" in payload || "recommendation" in payload) {
                    interviewerMetaUpdates.push({ id, payload })
                  } else {
                    interviewerSyncUpdates.push({ id, payload })
                  }

                  return Promise.resolve({ error: null })
                }),
              })),
              delete: vi.fn(() => ({
                in: vi.fn().mockResolvedValue({ error: null }),
              })),
            }
          }

          if (table === "interview_evaluation_interviewer_scores") {
            return {
              delete: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({ error: null }),
              })),
              insert: vi.fn((payload) => {
                scoreInsertPayloads.push(Array.isArray(payload) ? payload : [])
                return Promise.resolve({ error: null })
              }),
            }
          }

          throw new Error(`Unexpected table: ${table}`)
        }),
      },
    }

    await updateInterviewEvaluation(
      context,
      "evaluation-1",
      {
        selected_candidate_option_id: "candidate_service:form-1",
        interviewer_name: "Alex, Alex",
        interviewer_recipients: [
          {
            user_id: "user-2",
            name: "Alex",
            email: "alex2@example.com",
            job_level: "Mgr",
            label: "Alex",
          },
          {
            user_id: "user-1",
            name: "Alex",
            email: "alex1@example.com",
            job_level: "Mgr",
            label: "Alex",
          },
        ],
        interview_date: "2026-04-24T10:00",
        comments: "Aligned by user id",
        recommendation: "continue_recruitment",
        scores: Array.from({ length: 10 }, (_, index) => ({
          item_number: index + 1,
          score: 5,
          info: `Info ${index + 1}`,
        })),
      },
      { appOrigin: "https://example.com" },
    )

    expect(interviewerSyncUpdates).toEqual([
      expect.objectContaining({
        id: "row-2",
        payload: expect.objectContaining({
          interviewer_user_id: "user-2",
          interviewer_email: "alex2@example.com",
          updated_by: "user-editor",
        }),
      }),
      expect.objectContaining({
        id: "row-1",
        payload: expect.objectContaining({
          interviewer_user_id: "user-1",
          interviewer_email: "alex1@example.com",
          updated_by: "user-editor",
        }),
      }),
    ])
    expect(interviewerMetaUpdates).toContainEqual(
      expect.objectContaining({
        id: "row-2",
        payload: expect.objectContaining({
          comments: "Aligned by user id",
          recommendation: "continue_recruitment",
          updated_by: "user-editor",
        }),
      }),
    )
    expect(scoreInsertPayloads[0]?.[0]).toMatchObject({
      interview_evaluation_interviewer_id: "row-2",
      created_by: "user-editor",
      updated_by: "user-editor",
    })
    expect(formUpdatePayloads).toContainEqual(
      expect.objectContaining({
        updated_by: "user-editor",
      }),
    )
  })

  it("restricts a staff user with only read access to evaluations they created", async () => {
    const ownRow = { ...createEvaluationRow(), id: "evaluation-own", created_by: "user-1" }
    const otherRow = { ...createEvaluationRow(), id: "evaluation-other", created_by: "hr-1" }
    const context = createSupabaseContext([ownRow, otherRow])
    context.permissions = ["interview_evaluation:read"]
    context.roleName = "staff recruitment"
    context.userId = "user-1"

    const { listInterviewEvaluations } = await import("../interviewEvaluationService.js")
    const result = await listInterviewEvaluations(context)

    expect(result.map((evaluation) => evaluation.id)).toEqual(["evaluation-own"])
  })

  it("lets a staff user with read_all see evaluations from other creators", async () => {
    const ownRow = { ...createEvaluationRow(), id: "evaluation-own", created_by: "user-1" }
    const otherRow = { ...createEvaluationRow(), id: "evaluation-other", created_by: "hr-1" }
    const context = createSupabaseContext([ownRow, otherRow])
    context.permissions = ["interview_evaluation:read", "interview_evaluation:read_all"]
    context.roleName = "staff recruitment"
    context.userId = "user-1"

    const { listInterviewEvaluations } = await import("../interviewEvaluationService.js")
    const result = await listInterviewEvaluations(context)

    expect(result.map((evaluation) => evaluation.id).sort()).toEqual(["evaluation-other", "evaluation-own"])
  })

  it("does not restrict a non-staff role even without read_all", async () => {
    const ownRow = { ...createEvaluationRow(), id: "evaluation-own", created_by: "user-1" }
    const otherRow = { ...createEvaluationRow(), id: "evaluation-other", created_by: "hr-1" }
    const context = createSupabaseContext([ownRow, otherRow])
    context.permissions = ["interview_evaluation:read"]
    context.roleName = "hr"
    context.userId = "user-1"

    const { listInterviewEvaluations } = await import("../interviewEvaluationService.js")
    const result = await listInterviewEvaluations(context)

    expect(result.map((evaluation) => evaluation.id).sort()).toEqual(["evaluation-other", "evaluation-own"])
  })
})
