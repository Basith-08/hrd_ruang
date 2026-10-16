import { beforeEach, describe, expect, it, vi } from "vitest"

const readBodyMock = vi.fn()
const requireAnyPermissionMock = vi.fn()
const isStaffRoleMock = vi.fn()
const normalizeRoleNameMock = vi.fn((value: unknown) => String(value ?? "").trim().toLowerCase())
const listManagedCandidateUsersByEmployeeRequestFormIdsMock = vi.fn()
const getCandidateFormFromCandidateDatabaseMock = vi.fn()
const requireRequestContextMock = vi.fn()
const employeeRequestFormInMock = vi.fn()
const employeeRequestFormSelectMock = vi.fn()
const employeeRequestFormFromMock = vi.fn()

vi.mock("h3", async () => {
  const actual = await vi.importActual<typeof import("h3")>("h3")
  return {
    ...actual,
    readBody: readBodyMock,
  }
})

vi.mock("~~/server/lib/context.js", () => ({
  requireAnyPermission: requireAnyPermissionMock,
}))

vi.mock("~~/server/lib/utils.js", () => ({
  isStaffRole: isStaffRoleMock,
  normalizeRoleName: normalizeRoleNameMock,
}))

vi.mock("~~/server/services/candidateDatabaseReadService.js", () => ({
  listManagedCandidateUsersByEmployeeRequestFormIds:
    listManagedCandidateUsersByEmployeeRequestFormIdsMock,
  getCandidateFormFromCandidateDatabase: getCandidateFormFromCandidateDatabaseMock,
}))

vi.mock("~~/server/utils/requestContext", () => ({
  requireRequestContext: requireRequestContextMock,
}))

describe("POST /api/employee-request-forms/export-candidates", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    readBodyMock.mockResolvedValue({
      employee_request_form_ids: ["erf-1"],
    })
    isStaffRoleMock.mockReturnValue(false)
    listManagedCandidateUsersByEmployeeRequestFormIdsMock.mockResolvedValue([
      {
        id: "candidate-account-1",
        employee_request_form_id: "erf-1",
        role: "candidate",
        full_name: "Draft Candidate",
        email: "draft@example.com",
        candidate_form_completion_status: "in_progress",
      },
      {
        id: "candidate-account-2",
        employee_request_form_id: "erf-1",
        role: "employee",
        full_name: "Selected Candidate",
        email: "selected@example.com",
        candidate_form_completion_status: "completed",
      },
    ])
    getCandidateFormFromCandidateDatabaseMock.mockResolvedValue({
      id: "form-1",
      full_name: "Selected Candidate",
      personal_email: "selected@example.com",
      phone_number: "08123456789",
      date_of_birth: "1998-07-21",
      place_of_birth: "Bandung",
      gender: "Female",
      marital_status: "Single",
      nationality: "Indonesia",
      religion: "Islam",
      id_no: "3273012107980001",
      id_card_address: "Jl. KTP No. 1",
      residential_address: "Jl. Domisili No. 2",
      available_start_date: "2026-04-15",
      notice_period: "30 days",
      completion_status: "completed",
      education: [
        {
          level: "SMA / SMK / MA / Sederajat",
          institution: "SMAN 1",
          major: "IPA",
          from_year: 2011,
          to_year: 2014,
        },
        {
          level: "Sarjana (S1)",
          institution: "ITB",
          major: "Informatika",
          from_year: 2014,
          to_year: 2018,
        },
      ],
      work_history: [
        {
          company: "PT Lama",
          position: "Junior Developer",
          from_year: 2018,
          to_year: 2021,
        },
        {
          company: "PT Maju",
          position: "Software Engineer",
          from_year: 2021,
          to_year: 2025,
        },
      ],
    })
    requireRequestContextMock.mockResolvedValue({
      roleName: "HR",
      userId: "user-1",
      supabase: {
        from: employeeRequestFormFromMock,
      },
    })
    employeeRequestFormInMock.mockResolvedValue({
      data: [
        {
          id: "erf-1",
          direct_manager: "Lead Manager - Finance",
        },
      ],
      error: null,
    })
    employeeRequestFormSelectMock.mockReturnValue({
      in: employeeRequestFormInMock,
    })
    employeeRequestFormFromMock.mockImplementation((table: string) => {
      if (table === "employee_request_form") {
        return {
          select: employeeRequestFormSelectMock,
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    })
  })

  it("returns enriched selected candidate data for closed export", async () => {
    const { default: handler } = await import("../export-candidates.post")

    const result = await handler({} as any)

    expect(requireAnyPermissionMock).toHaveBeenCalledWith(
      {
        roleName: "HR",
        userId: "user-1",
        supabase: {
          from: expect.any(Function),
        },
      },
      ["recruitment:read"],
    )
    expect(listManagedCandidateUsersByEmployeeRequestFormIdsMock).toHaveBeenCalledWith(
      {
        isStaff: false,
        isManager: false,
        roleName: "HR",
        userId: "user-1",
        employeeRequestFormIds: ["erf-1"],
      },
      ["erf-1"],
    )
    expect(getCandidateFormFromCandidateDatabaseMock).toHaveBeenCalledWith("candidate-account-2", {
      isStaff: false,
      isManager: false,
      roleName: "HR",
      userId: "user-1",
      employeeRequestFormIds: ["erf-1"],
    })
    expect(result).toEqual({
      candidates: [
        {
          employee_request_form_id: "erf-1",
          candidate_id: "candidate-account-2",
          full_name: "Selected Candidate",
          email: "selected@example.com",
          phone_number: "08123456789",
          date_of_birth: "1998-07-21",
          place_of_birth: "Bandung",
          gender: "Female",
          marital_status: "Single",
          nationality: "Indonesia",
          religion: "Islam",
          id_no: "3273012107980001",
          id_card_address: "Jl. KTP No. 1",
          residential_address: "Jl. Domisili No. 2",
          available_start_date: "2026-04-15",
          notice_period: "30 days",
          latest_education: "Sarjana (S1) - ITB - Informatika",
          latest_work_history: "Software Engineer - PT Maju",
          candidate_form_completion_status: "completed",
        },
      ],
      employee_request_forms: [
        {
          id: "erf-1",
          direct_manager: "Lead Manager - Finance",
        },
      ],
      candidate_forms: [
        expect.objectContaining({
          id: "form-1",
          full_name: "Selected Candidate",
          personal_email: "selected@example.com",
          phone_number: "08123456789",
        }),
      ],
    })
  })
})
