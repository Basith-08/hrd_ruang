import { beforeEach, describe, expect, it, vi } from "vitest"

const getCandidateSupabaseAdminMock = vi.fn()
const getSupabaseAdminMock = vi.fn()
const encodeCandidateServiceUserIdMock = vi.fn((value: string) => `encoded:${value}`)

vi.mock("~~/server/services/candidateSupabaseAdmin.js", () => ({
  getCandidateSupabaseAdmin: getCandidateSupabaseAdminMock,
  isCandidateDatabaseConfigured: vi.fn(() => true),
}))

vi.mock("~~/server/services/candidateProjectionService.js", () => ({
  encodeCandidateServiceUserId: encodeCandidateServiceUserIdMock,
}))

vi.mock("~~/server/services/supabaseAdmin.js", () => ({
  getSupabaseAdmin: getSupabaseAdminMock,
}))

vi.mock("~~/server/lib/errors.js", () => ({
  createHttpError: (statusCode: number, message: string) => {
    const error = new Error(message) as Error & { statusCode?: number; expose?: boolean }
    error.statusCode = statusCode
    error.expose = true
    return error
  },
}))

function createListQueryRecorder() {
  const state = {
    select: "",
    eqCalls: [] as Array<[string, unknown]>,
    neqCalls: [] as Array<[string, unknown]>,
    orCalls: [] as string[],
    orderCalls: [] as Array<[string, Record<string, unknown>]>,
  }

  const query = {
    data: [],
    error: null,
    select(selection: string) {
      state.select = selection
      return query
    },
    eq(column: string, value: unknown) {
      state.eqCalls.push([column, value])
      return query
    },
    neq(column: string, value: unknown) {
      state.neqCalls.push([column, value])
      return query
    },
    order(column: string, options: Record<string, unknown>) {
      state.orderCalls.push([column, options])
      return query
    },
    or(filter: string) {
      state.orCalls.push(filter)
      return query
    },
  }

  return { query, state }
}

describe("candidateDatabaseReadService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("limits active candidate account list to rows created by the current staff user", async () => {
    const { query, state } = createListQueryRecorder()

    getCandidateSupabaseAdminMock.mockReturnValue({
      from: vi.fn((table: string) => {
        expect(table).toBe("candidate_accounts")
        return query
      }),
    })

    const { listManagedCandidateUsersFromCandidateDatabase } = await import(
      "../candidateDatabaseReadService.js"
    )

    const result = await listManagedCandidateUsersFromCandidateDatabase(
      { isStaff: true, userId: "staff-1" },
      null,
    )

    expect(result).toEqual([])
    expect(state.eqCalls).toContainEqual(["status", "active"])
    expect(state.orCalls).toEqual([
      "created_by.eq.staff-1,created_by_internal_user_id.eq.staff-1",
    ])
  })

  it("limits inactive candidate history to rows created by the current staff user", async () => {
    const { query, state } = createListQueryRecorder()

    getCandidateSupabaseAdminMock.mockReturnValue({
      from: vi.fn((table: string) => {
        expect(table).toBe("candidate_accounts")
        return query
      }),
    })

    const { loadCandidateUserHistoryFromCandidateDatabase } = await import(
      "../candidateDatabaseReadService.js"
    )

    const result = await loadCandidateUserHistoryFromCandidateDatabase({
      isStaff: true,
      userId: "staff-1",
    })

    expect(result).toEqual([])
    expect(state.neqCalls).toContainEqual(["status", "active"])
    expect(state.orCalls).toEqual([
      "created_by.eq.staff-1,created_by_internal_user_id.eq.staff-1",
    ])
  })

  it("accepts both created_by and legacy created_by_internal_user_id for staff ownership checks", async () => {
    const maybeSingle = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          id: "candidate-1",
          created_by: "staff-1",
          created_by_internal_user_id: null,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          id: "candidate-2",
          created_by: null,
          created_by_internal_user_id: "staff-1",
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          id: "candidate-3",
          created_by: "staff-2",
          created_by_internal_user_id: null,
        },
        error: null,
      })

    getCandidateSupabaseAdminMock.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle,
          })),
        })),
      })),
    })

    const { assertStaffCanManageCandidateAccount } = await import(
      "../candidateDatabaseReadService.js"
    )

    await expect(
      assertStaffCanManageCandidateAccount("candidate-1", { isStaff: true, userId: "staff-1" }),
    ).resolves.toBeUndefined()

    await expect(
      assertStaffCanManageCandidateAccount("candidate-2", { isStaff: true, userId: "staff-1" }),
    ).resolves.toBeUndefined()

    await expect(
      assertStaffCanManageCandidateAccount("candidate-3", { isStaff: true, userId: "staff-1" }),
    ).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it("treats employee candidate-service forms as in progress until employee submission is effectively completed", async () => {
    const candidateSupabase = {
      from: vi.fn((table: string) => {
        if (table === "candidate_form") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "form-1",
                    application_id: "application-1",
                    candidate_account_id: "candidate-1",
                    employee_request_form_id: "erf-1",
                    role: "employee",
                    full_name: "Legal Staff",
                    personal_email: "legal@example.com",
                    phone_number: "08123",
                    completion_status: "completed",
                    created_at: "2026-05-05T09:00:00.000Z",
                    updated_at: "2026-05-05T09:00:00.000Z",
                    employee_payroll_profile: [],
                    employee_documents: [],
                    family_and_emergency: [],
                    education: [],
                    work_history: [],
                    personal_statement: [],
                    candidate_languages: [],
                    candidate_skills: [],
                    candidate_references: [],
                  },
                  error: null,
                }),
              })),
            })),
          }
        }

        if (table === "candidate_applications") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({
                data: [
                  {
                    id: "application-1",
                    candidate_account_id: "candidate-1",
                    erf_id: "erf-1",
                    status: "draft",
                    job_snapshot: {
                      main_position: "Legal Staff",
                    },
                    submitted_at: null,
                    created_at: "2026-05-01T08:00:00.000Z",
                    updated_at: "2026-05-06T08:00:00.000Z",
                  },
                ],
                error: null,
              })),
            })),
          }
        }

        if (table === "candidate_accounts") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({
                data: [
                  {
                    id: "candidate-1",
                    identity_user_id: "identity-1",
                    email: "legal@example.com",
                    full_name: "Legal Staff",
                    phone: "08123",
                    status: "active",
                    portal_role: "employee",
                    created_at: "2026-05-01T08:00:00.000Z",
                    activated_at: "2026-05-06T08:00:00.000Z",
                  },
                ],
                error: null,
              })),
            })),
          }
        }

        throw new Error(`Unexpected candidate table: ${table}`)
      }),
    }

    getCandidateSupabaseAdminMock.mockReturnValue(candidateSupabase)
    getSupabaseAdminMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table !== "employee_request_form") {
          throw new Error(`Unexpected dashboard table: ${table}`)
        }

        return {
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        }
      }),
    })

    const { getCandidateFormFromCandidateDatabase } = await import(
      "../candidateDatabaseReadService.js"
    )

    const result = await getCandidateFormFromCandidateDatabase("form-1", { isManager: false })

    expect(result?.role).toBe("employee")
    expect(result?.completion_status).toBe("in_progress")
  })

  it("prefers the latest candidate form row for identity bindings and ERF status signals", async () => {
    const candidateSupabase = {
      from: vi.fn((table: string) => {
        if (table === "candidate_accounts") {
          const activeAccountPayload = {
            data: [
              {
                id: "candidate-1",
                identity_user_id: "identity-1",
                email: "legal@example.com",
                full_name: "Legal Staff",
                phone: "08123",
                status: "active",
                portal_role: "employee",
                created_at: "2026-05-01T08:00:00.000Z",
                activated_at: "2026-05-06T07:30:00.000Z",
              },
            ],
            error: null,
          }

          return {
            select: vi.fn(() => ({
              in: vi.fn(() => {
                const query = {
                  eq: vi.fn(() => Promise.resolve(activeAccountPayload)),
                  then: (resolve: (value: typeof activeAccountPayload) => unknown) =>
                    Promise.resolve(resolve(activeAccountPayload)),
                }

                return query
              }),
              eq: vi.fn(() => Promise.resolve(activeAccountPayload)),
            })),
          }
        }

        if (table === "candidate_applications") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({
                  data: [
                    {
                      id: "application-1",
                      candidate_account_id: "candidate-1",
                      erf_id: "erf-1",
                      status: "submitted",
                      job_snapshot: {
                        main_position: "Legal Staff",
                      },
                      submitted_at: "2026-05-06T08:00:00.000Z",
                      created_at: "2026-05-01T08:00:00.000Z",
                      updated_at: "2026-05-06T08:00:00.000Z",
                    },
                  ],
                  error: null,
                })),
              })),
              eq: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({
                  data: [
                    {
                      id: "application-1",
                      candidate_account_id: "candidate-1",
                      erf_id: "erf-1",
                      status: "submitted",
                      job_snapshot: {
                        main_position: "Legal Staff",
                      },
                      submitted_at: "2026-05-06T08:00:00.000Z",
                      created_at: "2026-05-01T08:00:00.000Z",
                      updated_at: "2026-05-06T08:00:00.000Z",
                    },
                  ],
                  error: null,
                })),
              })),
            })),
          }
        }

        if (table === "candidate_form") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({
                data: [
                  {
                    id: "form-old",
                    application_id: "application-1",
                    candidate_account_id: "candidate-1",
                    employee_request_form_id: "erf-1",
                    role: "employee",
                    full_name: "Legal Staff",
                    personal_email: "legal@example.com",
                    phone_number: "08123",
                    completion_status: "in_progress",
                    created_at: "2026-05-05T09:00:00.000Z",
                    updated_at: "2026-05-05T09:00:00.000Z",
                    employee_payroll_profile: [],
                    employee_documents: [],
                    family_and_emergency: [],
                    education: [],
                    work_history: [],
                    personal_statement: [],
                    candidate_languages: [],
                    candidate_skills: [],
                    candidate_references: [],
                  },
                  {
                    id: "form-new",
                    application_id: "application-1",
                    candidate_account_id: "candidate-1",
                    employee_request_form_id: "erf-1",
                    role: "employee",
                    full_name: "Legal Staff",
                    personal_email: "legal@example.com",
                    phone_number: "08123",
                    completion_status: "completed",
                    created_at: "2026-05-05T09:00:00.000Z",
                    updated_at: "2026-05-06T08:00:00.000Z",
                    employee_payroll_profile: {
                      bank_name: "BCA",
                      bank_account_number: "1234567890",
                      account_holder_name: "Legal Staff",
                      branch_name: "Jakarta",
                      tax_identification_number: "09.999.999.9-999.999",
                      bpjs_health_enrollment_preference: "willing_to_enroll",
                      bpjs_health_decline_reason: "",
                      bpjs_health_decline_reason_other: "",
                      bpjs_employment_status: "enroll_new",
                    },
                    employee_documents: {
                      cv: ["cv.pdf"],
                      integrity_pact: ["integrity-pact.pdf"],
                      email_usage_policy: ["email-policy.pdf"],
                      identity_card: ["ktp.pdf"],
                      family_card: ["kk.pdf"],
                      latest_diploma: ["diploma.pdf"],
                      academic_transcript: ["transcript.pdf"],
                      certificate_of_employment: [],
                      tax_id: ["npwp.pdf"],
                      bpjs_health_card: ["bpjs-health.pdf"],
                      bpjs_health_statement: [],
                      bpjs_employment_card: ["bpjs-employment.pdf"],
                      bank_account_book: ["bank.pdf"],
                      format_office: [],
                      skb: [],
                      other: [],
                    },
                    family_and_emergency: [],
                    education: [],
                    work_history: [],
                    personal_statement: [],
                    candidate_languages: [],
                    candidate_skills: [],
                    candidate_references: [],
                  },
                ],
                error: null,
              })),
            })),
          }
        }

        throw new Error(`Unexpected candidate table: ${table}`)
      }),
    }

    getCandidateSupabaseAdminMock.mockReturnValue(candidateSupabase)
    getSupabaseAdminMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table !== "employee_request_form") {
          throw new Error(`Unexpected dashboard table: ${table}`)
        }

        return {
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        }
      }),
    })

    const {
      listCandidateBindingsByIdentityUserIdsFromCandidateDatabase,
      listCandidateStatusSignalsByEmployeeRequestFormIds,
    } = await import("../candidateDatabaseReadService.js")

    const bindings = await listCandidateBindingsByIdentityUserIdsFromCandidateDatabase(["identity-1"])
    const signals = await listCandidateStatusSignalsByEmployeeRequestFormIds(
      { isAdmin: true, isCandidate: false, isManager: false, userId: null },
      ["erf-1"],
    )

    expect(bindings.get("identity-1")).toMatchObject({
      candidate_form_id: "form-new",
      candidate_form_completion_status: "completed",
      candidate_form_is_submitted: true,
    })
    expect(signals).toEqual([
      expect.objectContaining({
        employee_request_form_id: "erf-1",
        role: "employee",
        candidate_form_completion_status: "completed",
        candidate_form_is_submitted: true,
      }),
    ])
  })

  it("treats employee candidate-service forms as completed when submit timestamps only differ by formatting precision", async () => {
    const candidateSupabase = {
      from: vi.fn((table: string) => {
        if (table === "candidate_form") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "form-1",
                    application_id: "application-1",
                    candidate_account_id: "candidate-1",
                    employee_request_form_id: "erf-1",
                    role: "employee",
                    full_name: "Legal Staff",
                    personal_email: "legal@example.com",
                    phone_number: "08123",
                    completion_status: "completed",
                    created_at: "2026-05-05T09:00:00.000Z",
                    updated_at: "2026-05-06T08:00:00.000Z",
                    employee_payroll_profile: {
                      bank_name: "BCA",
                      bank_account_number: "1234567890",
                      account_holder_name: "Legal Staff",
                      branch_name: "Jakarta",
                      tax_identification_number: "09.999.999.9-999.999",
                      bpjs_health_enrollment_preference: "willing_to_enroll",
                      bpjs_health_decline_reason: "",
                      bpjs_health_decline_reason_other: "",
                      bpjs_employment_status: "enroll_new",
                    },
                    employee_documents: {
                      cv: ["cv.pdf"],
                      integrity_pact: ["integrity-pact.pdf"],
                      email_usage_policy: ["email-policy.pdf"],
                      identity_card: ["ktp.pdf"],
                      family_card: ["kk.pdf"],
                      latest_diploma: ["diploma.pdf"],
                      academic_transcript: ["transcript.pdf"],
                      certificate_of_employment: [],
                      tax_id: ["npwp.pdf"],
                      bpjs_health_card: ["bpjs-health.pdf"],
                      bpjs_health_statement: [],
                      bpjs_employment_card: ["bpjs-employment.pdf"],
                      bank_account_book: ["bank.pdf"],
                    },
                    family_and_emergency: [],
                    education: [],
                    work_history: [],
                    personal_statement: [],
                    candidate_languages: [],
                    candidate_skills: [],
                    candidate_references: [],
                  },
                  error: null,
                }),
              })),
            })),
          }
        }

        if (table === "candidate_applications") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({
                data: [
                  {
                    id: "application-1",
                    candidate_account_id: "candidate-1",
                    erf_id: "erf-1",
                    status: "submitted",
                    job_snapshot: {
                      main_position: "Legal Staff",
                    },
                    submitted_at: "2026-05-06T08:00:00Z",
                    created_at: "2026-05-01T08:00:00.000Z",
                    updated_at: "2026-05-06T08:00:00.000Z",
                  },
                ],
                error: null,
              })),
            })),
          }
        }

        if (table === "candidate_accounts") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({
                data: [
                  {
                    id: "candidate-1",
                    identity_user_id: "identity-1",
                    email: "legal@example.com",
                    full_name: "Legal Staff",
                    phone: "08123",
                    status: "active",
                    portal_role: "employee",
                    created_at: "2026-05-01T08:00:00.000Z",
                    activated_at: "2026-05-06T07:30:00.000Z",
                  },
                ],
                error: null,
              })),
            })),
          }
        }

        throw new Error(`Unexpected table ${table}`)
      }),
    }

    const dashboardSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({
            data: [
              {
                id: "erf-1",
                no: "ERF-001",
                status: "open",
                recruitment_flow_stage: "interview_evaluation_completed",
                position: "Legal Staff",
                join_date_plan: null,
                effective_date: null,
                man_power_type: null,
                request_reason: null,
                target_date: null,
                target_entry_date: null,
                qty: 1,
                salary_min: null,
                salary_max: null,
                branch: null,
                branch_code: null,
                department: null,
                sub_department: null,
                requestor_by: null,
                requested_by: null,
                manager_name: null,
                director_name: null,
                gm_name: null,
                hrd_manager_name: null,
                hrd_director_name: null,
                approval_director_bu_date: null,
                approval_gm_hrd_date: null,
                approval_director_hrd_date: null,
                closed_category: null,
              },
            ],
            error: null,
          })),
        })),
      })),
    }

    getCandidateSupabaseAdminMock.mockReturnValue(candidateSupabase)
    getSupabaseAdminMock.mockReturnValue(dashboardSupabase)

    const { getCandidateFormFromCandidateDatabase } = await import(
      "../candidateDatabaseReadService.js"
    )

    const result = await getCandidateFormFromCandidateDatabase("form-1", {
      isAdmin: true,
      isCandidate: false,
      isManager: false,
      userId: null,
    })

    expect(result?.completion_status).toBe("completed")
  })

  it("keeps employee candidate list status completed when the compact dashboard snapshot matches the submission timestamp", async () => {
    const candidateSupabase = {
      from: vi.fn((table: string) => {
        if (table === "candidate_accounts") {
          const activeAccountPayload = {
            data: [
              {
                id: "candidate-1",
                identity_user_id: "identity-1",
                email: "legal@example.com",
                full_name: "Legal Staff",
                phone: "08123",
                status: "active",
                portal_role: "employee",
                created_at: "2026-05-01T08:00:00.000Z",
                activated_at: "2026-05-06T07:30:00.000Z",
              },
            ],
            error: null,
          }

          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  then: (resolve: (value: typeof activeAccountPayload) => unknown) =>
                    Promise.resolve(resolve(activeAccountPayload)),
                })),
              })),
              in: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve(activeAccountPayload)),
                then: (resolve: (value: typeof activeAccountPayload) => unknown) =>
                  Promise.resolve(resolve(activeAccountPayload)),
              })),
            })),
          }
        }

        if (table === "candidate_applications") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({
                  data: [
                    {
                      id: "application-1",
                      candidate_account_id: "candidate-1",
                      erf_id: "erf-1",
                      status: "submitted",
                      job_snapshot: {
                        main_position: "Legal Staff",
                      },
                      submitted_at: "2026-05-06T08:00:00.000Z",
                      created_at: "2026-05-01T08:00:00.000Z",
                      updated_at: "2026-05-06T08:00:00.000Z",
                    },
                  ],
                  error: null,
                })),
              })),
            })),
          }
        }

        if (table === "candidate_form") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({
                data: [
                  {
                    id: "form-1",
                    application_id: "application-1",
                    candidate_account_id: "candidate-1",
                    employee_request_form_id: "erf-1",
                    completion_status: "completed",
                    created_at: "2026-05-05T09:00:00.000Z",
                    updated_at: "2026-05-06T08:00:00.000Z",
                    employee_payroll_profile: [],
                    employee_documents: [],
                  },
                ],
                error: null,
              })),
            })),
          }
        }

        throw new Error(`Unexpected candidate table: ${table}`)
      }),
    }

    getCandidateSupabaseAdminMock.mockReturnValue(candidateSupabase)
    const dashboardSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({
            data: [
              {
                id: "erf-1",
                site: "Jakarta",
                main_position: "Legal Staff",
                department_id: "dept-1",
                designation_id: "desig-1",
                pt: { name: "PT Test" },
                department_ref: { name: "Legal" },
                designation_ref: { name: "Officer" },
              },
            ],
            error: null,
          })),
        })),
      })),
    }

    const { listManagedCandidateUsersFromCandidateDatabase } = await import(
      "../candidateDatabaseReadService.js"
    )

    const result = await listManagedCandidateUsersFromCandidateDatabase(
      {
        isAdmin: true,
        isCandidate: false,
        isManager: false,
        userId: null,
      },
      dashboardSupabase as any,
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.candidate_form_completion_status).toBe("completed")
  })

  it("keeps ERF candidate status signals completed when the employee submission timestamp is valid", async () => {
    const candidateSupabase = {
      from: vi.fn((table: string) => {
        if (table === "candidate_accounts") {
          const activeAccountPayload = {
            data: [
              {
                id: "candidate-1",
                identity_user_id: "identity-1",
                email: "legal@example.com",
                full_name: "Legal Staff",
                phone: "08123",
                status: "active",
                portal_role: "employee",
                created_at: "2026-05-01T08:00:00.000Z",
                activated_at: "2026-05-06T07:30:00.000Z",
              },
            ],
            error: null,
          }

          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve(activeAccountPayload)),
                then: (resolve: (value: typeof activeAccountPayload) => unknown) =>
                  Promise.resolve(resolve(activeAccountPayload)),
              })),
            })),
          }
        }

        if (table === "candidate_applications") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({
                  data: [
                    {
                      id: "application-1",
                      candidate_account_id: "candidate-1",
                      erf_id: "erf-1",
                      status: "submitted",
                      job_snapshot: {
                        main_position: "Legal Staff",
                      },
                      submitted_at: "2026-05-06T08:00:00.000Z",
                      created_at: "2026-05-01T08:00:00.000Z",
                      updated_at: "2026-05-06T08:00:00.000Z",
                    },
                  ],
                  error: null,
                })),
              })),
            })),
          }
        }

        if (table === "candidate_form") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({
                data: [
                  {
                    application_id: "application-1",
                    employee_request_form_id: "erf-1",
                    created_at: "2026-05-05T09:00:00.000Z",
                    updated_at: "2026-05-06T08:00:00.000Z",
                    completion_status: "completed",
                    employee_payroll_profile: [],
                    employee_documents: [],
                  },
                ],
                error: null,
              })),
            })),
          }
        }

        throw new Error(`Unexpected candidate table: ${table}`)
      }),
    }

    getCandidateSupabaseAdminMock.mockReturnValue(candidateSupabase)

    const { listCandidateStatusSignalsByEmployeeRequestFormIds } = await import(
      "../candidateDatabaseReadService.js"
    )

    const result = await listCandidateStatusSignalsByEmployeeRequestFormIds(
      {
        isAdmin: true,
        isCandidate: false,
        isManager: false,
        userId: null,
      },
      ["erf-1"],
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.candidate_form_completion_status).toBe("completed")
  })

  it("keeps employee candidate-service forms completed after contract documents update the form timestamp", async () => {
    const candidateSupabase = {
      from: vi.fn((table: string) => {
        if (table === "candidate_form") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "form-1",
                    application_id: "application-1",
                    candidate_account_id: "candidate-1",
                    employee_request_form_id: "erf-1",
                    role: "employee",
                    full_name: "Legal Staff",
                    personal_email: "legal@example.com",
                    phone_number: "08123",
                    completion_status: "completed",
                    created_at: "2026-05-05T09:00:00.000Z",
                    updated_at: "2026-05-06T12:30:00.000Z",
                    employee_payroll_profile: {
                      bank_name: "BCA",
                      bank_account_number: "1234567890",
                      account_holder_name: "Legal Staff",
                      branch_name: "Jakarta",
                      tax_identification_number: "09.999.999.9-999.999",
                      bpjs_health_enrollment_preference: "willing_to_enroll",
                      bpjs_health_decline_reason: "",
                      bpjs_health_decline_reason_other: "",
                      bpjs_employment_status: "enroll_new",
                    },
                    employee_documents: {
                      cv: ["cv.pdf"],
                      integrity_pact: ["integrity-pact.pdf"],
                      email_usage_policy: ["email-policy.pdf"],
                      identity_card: ["ktp.pdf"],
                      family_card: ["kk.pdf"],
                      latest_diploma: ["diploma.pdf"],
                      academic_transcript: ["transcript.pdf"],
                      certificate_of_employment: [],
                      tax_id: ["npwp.pdf"],
                      bpjs_health_card: ["bpjs-health.pdf"],
                      bpjs_health_statement: [],
                      bpjs_employment_card: ["bpjs-employment.pdf"],
                      bank_account_book: ["bank.pdf"],
                      format_office: ["contract.pdf"],
                      skb: ["skb.pdf"],
                    },
                    family_and_emergency: [],
                    education: [],
                    work_history: [],
                    personal_statement: [],
                    candidate_languages: [],
                    candidate_skills: [],
                    candidate_references: [],
                  },
                  error: null,
                }),
              })),
            })),
          }
        }

        if (table === "candidate_applications") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({
                data: [
                  {
                    id: "application-1",
                    candidate_account_id: "candidate-1",
                    erf_id: "erf-1",
                    status: "submitted",
                    job_snapshot: {
                      main_position: "Legal Staff",
                    },
                    submitted_at: "2026-05-06T08:00:00.000Z",
                    created_at: "2026-05-01T08:00:00.000Z",
                    updated_at: "2026-05-06T12:30:00.000Z",
                  },
                ],
                error: null,
              })),
            })),
          }
        }

        if (table === "candidate_accounts") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({
                data: [
                  {
                    id: "candidate-1",
                    identity_user_id: "identity-1",
                    email: "legal@example.com",
                    full_name: "Legal Staff",
                    phone: "08123",
                    status: "active",
                    portal_role: "employee",
                    created_at: "2026-05-01T08:00:00.000Z",
                    activated_at: "2026-05-06T07:30:00.000Z",
                  },
                ],
                error: null,
              })),
            })),
          }
        }

        throw new Error(`Unexpected table ${table}`)
      }),
    }

    const dashboardSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({
            data: [
              {
                id: "erf-1",
                no: "ERF-001",
                status: "open",
                recruitment_flow_stage: "employee_contract_form_in_progress",
                position: "Legal Staff",
                join_date_plan: null,
                effective_date: null,
                man_power_type: null,
                request_reason: null,
                target_date: null,
                target_entry_date: null,
                qty: 1,
                salary_min: null,
                salary_max: null,
                branch: null,
                branch_code: null,
                department: null,
                sub_department: null,
                requestor_by: null,
                requested_by: null,
                manager_name: null,
                director_name: null,
                gm_name: null,
                hrd_manager_name: null,
                hrd_director_name: null,
                approval_director_bu_date: null,
                approval_gm_hrd_date: null,
                approval_director_hrd_date: null,
                closed_category: null,
              },
            ],
            error: null,
          })),
        })),
      })),
    }

    getCandidateSupabaseAdminMock.mockReturnValue(candidateSupabase)
    getSupabaseAdminMock.mockReturnValue(dashboardSupabase)

    const { getCandidateFormFromCandidateDatabase } = await import(
      "../candidateDatabaseReadService.js"
    )

    const result = await getCandidateFormFromCandidateDatabase("form-1", {
      isAdmin: true,
      isCandidate: false,
      isManager: false,
      userId: null,
    })

    expect(result?.completion_status).toBe("completed")
  })

  it("fills missing contract document entries from workspace storage when files exist in the dashboard bucket", async () => {
    const candidateSupabase = {
      from: vi.fn((table: string) => {
        if (table === "candidate_form") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "form-1",
                    application_id: "application-1",
                    candidate_account_id: "candidate-account-1",
                    employee_request_form_id: "erf-1",
                    role: "employee",
                    full_name: "Legal Staff",
                    personal_email: "legal@example.com",
                    phone_number: "08123",
                    completion_status: "completed",
                    created_at: "2026-05-05T09:00:00.000Z",
                    updated_at: "2026-05-06T12:30:00.000Z",
                    employee_payroll_profile: {
                      bank_name: "BCA",
                      bank_account_number: "1234567890",
                      account_holder_name: "Legal Staff",
                      branch_name: "Jakarta",
                      tax_identification_number: "09.999.999.9-999.999",
                      bpjs_health_enrollment_preference: "willing_to_enroll",
                      bpjs_health_decline_reason: "",
                      bpjs_health_decline_reason_other: "",
                      bpjs_employment_status: "enroll_new",
                    },
                    employee_documents: {
                      cv: ["cv.pdf"],
                      integrity_pact: ["integrity-pact.pdf"],
                      email_usage_policy: ["email-policy.pdf"],
                      identity_card: ["ktp.pdf"],
                      family_card: ["kk.pdf"],
                      latest_diploma: ["diploma.pdf"],
                      academic_transcript: ["transcript.pdf"],
                      certificate_of_employment: [],
                      tax_id: ["npwp.pdf"],
                      bpjs_health_card: ["bpjs-health.pdf"],
                      bpjs_health_statement: [],
                      bpjs_employment_card: ["bpjs-employment.pdf"],
                      bank_account_book: ["bank.pdf"],
                      format_office: [],
                      skb: [],
                      other: [],
                    },
                    family_and_emergency: [],
                    education: [],
                    work_history: [],
                    personal_statement: [],
                    candidate_languages: [],
                    candidate_skills: [],
                    candidate_references: [],
                  },
                  error: null,
                }),
              })),
            })),
          }
        }

        if (table === "candidate_applications") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({
                data: [
                  {
                    id: "application-1",
                    candidate_account_id: "candidate-account-1",
                    erf_id: "erf-1",
                    status: "submitted",
                    job_snapshot: {
                      main_position: "Legal Staff",
                    },
                    submitted_at: "2026-05-06T08:00:00.000000Z",
                    created_at: "2026-05-01T08:00:00.000Z",
                    updated_at: "2026-05-06T08:00:00.000Z",
                  },
                ],
                error: null,
              })),
            })),
          }
        }

        if (table === "candidate_accounts") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({
                data: [
                  {
                    id: "candidate-account-1",
                    identity_user_id: "identity-1",
                    email: "legal@example.com",
                    full_name: "Legal Staff",
                    phone: "08123",
                    status: "active",
                    portal_role: "employee",
                    created_at: "2026-05-01T08:00:00.000Z",
                    activated_at: "2026-05-06T08:00:00.000000Z",
                  },
                ],
                error: null,
              })),
            })),
          }
        }

        throw new Error(`Unexpected candidate table: ${table}`)
      }),
    }

    const listMock = vi.fn((prefix: string) => {
      if (prefix === "employee-forms/candidate-account-1/format_office") {
        return Promise.resolve({
          data: [
            { name: "Draft Employment Contract.emptyFolderPlaceholder" },
            { name: "draft-contract.pdf" },
          ],
          error: null,
        })
      }

      if (prefix === "employee-forms/candidate-account-1/skb") {
        return Promise.resolve({
          data: [{ name: "skb-final.pdf" }],
          error: null,
        })
      }

      if (prefix === "employee-forms/candidate-account-1/other") {
        return Promise.resolve({
          data: [{ name: "other-attachment.pdf" }],
          error: null,
        })
      }

      return Promise.resolve({ data: [], error: null })
    })

    const dashboardSupabase = {
      from: vi.fn((table: string) => ({
        select: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({
            data: table === "employee_request_form"
              ? [
                  {
                    id: "erf-1",
                    site: "Jakarta",
                    main_position: "Legal Staff",
                    department_id: null,
                    designation_id: null,
                    pt: { name: "PT Garda" },
                    department_ref: { name: "Legal" },
                    designation_ref: { name: "Staff" },
                  },
                ]
              : [],
            error: null,
          })),
        })),
      })),
      storage: {
        from: vi.fn(() => ({
          list: listMock,
        })),
      },
    }

    getCandidateSupabaseAdminMock.mockReturnValue(candidateSupabase)
    getSupabaseAdminMock.mockReturnValue(dashboardSupabase)

    const { getCandidateFormFromCandidateDatabase } = await import(
      "../candidateDatabaseReadService.js"
    )

    const result = await getCandidateFormFromCandidateDatabase("form-1", {
      isAdmin: true,
      isCandidate: false,
      isManager: false,
      userId: null,
    })

    expect(result?.employee_documents?.format_office).toEqual([
      "employee-forms/candidate-account-1/format_office/draft-contract.pdf",
    ])
    expect(result?.employee_documents?.skb).toEqual([
      "employee-forms/candidate-account-1/skb/skb-final.pdf",
    ])
    expect(result?.employee_documents?.other).toEqual([
      "employee-forms/candidate-account-1/other/other-attachment.pdf",
    ])
  })
})
