import { beforeEach, describe, expect, it, vi } from "vitest"

const requireRequestContextMock = vi.fn()
const listEmployeeContractFormApprovalUsersMock = vi.fn()

vi.mock("~~/server/utils/requestContext", () => ({
  requireRequestContext: requireRequestContextMock,
}))

vi.mock("~~/server/services/employeeContractFormService.js", () => ({
  listEmployeeContractFormApprovalUsers: listEmployeeContractFormApprovalUsersMock,
}))

describe("GET /recruitment/employee-contract-forms/approval-users/[employeeRequestFormId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireRequestContextMock.mockResolvedValue({
      userId: "hr-1",
      permissions: ["employee_contract_form:create"],
    })
    listEmployeeContractFormApprovalUsersMock.mockResolvedValue([
      {
        id: "user-1",
        full_name: "BU Director",
        email: "director@example.com",
      },
      {
        id: "user-2",
        full_name: "GM HRD",
        email: "gm@example.com",
      },
    ])
  })

  it("returns signer users for the selected ERF context", async () => {
    const { default: handler } = await import("../../approval-users/[employeeRequestFormId].get")

    const result = await handler({
      context: {
        params: {
          employeeRequestFormId: "erf-1",
        },
      },
    } as never)

    expect(listEmployeeContractFormApprovalUsersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "hr-1",
        permissions: ["employee_contract_form:create"],
      }),
      "erf-1",
    )
    expect(result).toEqual({
      approval_users: [
        {
          id: "user-1",
          full_name: "BU Director",
          email: "director@example.com",
        },
        {
          id: "user-2",
          full_name: "GM HRD",
          email: "gm@example.com",
        },
      ],
    })
  })
})
