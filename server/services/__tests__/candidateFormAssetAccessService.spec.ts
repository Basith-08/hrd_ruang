import { beforeEach, describe, expect, it, vi } from "vitest"

const getCandidateFormForDashboardMock = vi.fn()

vi.mock("~~/server/services/candidateFormReadService.js", () => ({
  getCandidateFormForDashboard: getCandidateFormForDashboardMock,
}))

describe("candidateFormAssetAccessService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("allows access when the employee document path belongs to the accessible candidate form", async () => {
    getCandidateFormForDashboardMock.mockResolvedValue({
      id: "form-1",
      employee_documents: {
        draft_contract: ["contracts/contract-1.pdf"],
      },
    })

    const { assertCandidateFormAssetAccess } = await import("../candidateFormAssetAccessService.js")

    await expect(
      assertCandidateFormAssetAccess({}, "form-1", "contracts/contract-1.pdf", "employee_document"),
    ).resolves.toEqual(
      expect.objectContaining({ id: "form-1" }),
    )
  })

  it("rejects access when the document path does not belong to the accessible candidate form", async () => {
    getCandidateFormForDashboardMock.mockResolvedValue({
      id: "form-1",
      employee_documents: {
        draft_contract: ["contracts/contract-1.pdf"],
      },
    })

    const { assertCandidateFormAssetAccess } = await import("../candidateFormAssetAccessService.js")

    await expect(
      assertCandidateFormAssetAccess({}, "form-1", "contracts/other.pdf", "employee_document"),
    ).rejects.toMatchObject({
      message: "You do not have permission to access this file.",
      status: 403,
    })
  })

  it("allows access when the photograph path belongs to the accessible candidate form", async () => {
    getCandidateFormForDashboardMock.mockResolvedValue({
      id: "form-1",
      photograph: "photos/candidate-1.jpg",
    })

    const { assertCandidateFormAssetAccess } = await import("../candidateFormAssetAccessService.js")

    await expect(
      assertCandidateFormAssetAccess({}, "form-1", "photos/candidate-1.jpg", "photograph"),
    ).resolves.toEqual(
      expect.objectContaining({ id: "form-1" }),
    )
  })

  it("allows access when the ERF document path belongs to the linked employee request form", async () => {
    getCandidateFormForDashboardMock.mockResolvedValue({
      id: "form-1",
      employee_request_form: {
        id: "erf-1",
        document_erf: ["employee-request-forms/user-1/document_erf/erf-doc.pdf"],
      },
    })

    const { assertCandidateFormAssetAccess } = await import("../candidateFormAssetAccessService.js")

    await expect(
      assertCandidateFormAssetAccess(
        {},
        "form-1",
        "employee-request-forms/user-1/document_erf/erf-doc.pdf",
        "erf_document",
      ),
    ).resolves.toEqual(
      expect.objectContaining({ id: "form-1" }),
    )
  })

  it("rejects access when the ERF document path does not belong to the linked employee request form", async () => {
    getCandidateFormForDashboardMock.mockResolvedValue({
      id: "form-1",
      employee_request_form: {
        id: "erf-1",
        document_erf: ["employee-request-forms/user-1/document_erf/erf-doc.pdf"],
      },
    })

    const { assertCandidateFormAssetAccess } = await import("../candidateFormAssetAccessService.js")

    await expect(
      assertCandidateFormAssetAccess(
        {},
        "form-1",
        "employee-request-forms/user-1/document_erf/other.pdf",
        "erf_document",
      ),
    ).rejects.toMatchObject({
      message: "You do not have permission to access this file.",
      status: 403,
    })
  })
})
