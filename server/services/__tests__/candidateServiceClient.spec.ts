import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("~~/server/config/env.js", () => ({
  HRD_PINTU_SERVICE_BASE_URL: "http://hrd-pintu-service.test",
  HRD_PINTU_SERVICE_INTERNAL_TOKEN: "internal-token",
}))

describe("candidateServiceClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("sends candidate_form_id when requesting a candidate service storage signed URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        signed_url: "https://hrd-pintu-service.test/signed-url",
      }),
    })

    vi.stubGlobal("fetch", fetchMock)

    const { getCandidateServiceStorageSignedUrl } = await import("../candidateServiceClient.js")
    const result = await getCandidateServiceStorageSignedUrl(
      "candidate-documents",
      "candidate-form-1",
      "candidate-documents/legal/file.pdf",
    )

    expect(fetchMock).toHaveBeenCalledWith(
      "http://hrd-pintu-service.test/internal/storage/sign-url",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          bucket: "candidate-documents",
          candidate_form_id: "candidate-form-1",
          path: "candidate-documents/legal/file.pdf",
        }),
        headers: expect.any(Headers),
      }),
    )
    expect(result).toBe("https://hrd-pintu-service.test/signed-url")
  })

  it("falls back to the summary endpoint when switch-to-employee returns an empty body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          candidate: {
            candidate_id: "cand-1",
            identity_user_id: "auth-1",
            email: "candidate@example.com",
            full_name: "Candidate User",
            phone: "08123",
            status: "active",
            role: "employee",
            application_count: 0,
            applications: [],
          },
        }),
      })

    vi.stubGlobal("fetch", fetchMock)

    const { switchCandidateServiceAccountToEmployee } = await import("../candidateServiceClient.js")
    const result = await switchCandidateServiceAccountToEmployee("cand-1")

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://hrd-pintu-service.test/internal/candidates/cand-1/switch-to-employee",
      expect.objectContaining({
        method: "POST",
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://hrd-pintu-service.test/internal/candidates/cand-1/summary",
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    )
    expect(result).toMatchObject({
      candidate_id: "cand-1",
      role: "employee",
      status: "active",
    })
  })

  it("throws when the fallback summary is still not active employee", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          candidate: {
            candidate_id: "cand-1",
            role: "candidate",
            status: "inactive",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          candidate: {
            candidate_id: "cand-1",
            role: "candidate",
            status: "inactive",
          },
        }),
      })

    vi.stubGlobal("fetch", fetchMock)

    const { switchCandidateServiceAccountToEmployee } = await import("../candidateServiceClient.js")

    await expect(switchCandidateServiceAccountToEmployee("cand-1")).rejects.toThrow(
      "Candidate service did not confirm the portal role change to employee",
    )
  })

  it("repairs stale switch responses by forcing an employee update", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          candidate: {
            candidate_id: "cand-1",
            role: "candidate",
            status: "active",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          candidate: {
            candidate_id: "cand-1",
            role: "employee",
            status: "active",
          },
        }),
      })

    vi.stubGlobal("fetch", fetchMock)

    const { switchCandidateServiceAccountToEmployee } = await import("../candidateServiceClient.js")
    const result = await switchCandidateServiceAccountToEmployee("cand-1")

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://hrd-pintu-service.test/internal/candidates/cand-1",
      expect.objectContaining({
        method: "PUT",
      }),
    )
    expect(result).toMatchObject({
      candidate_id: "cand-1",
      role: "employee",
      status: "active",
    })
  })
})
