import { beforeEach, describe, expect, it, vi } from "vitest"

const syncRecruitmentFlowStageMock = vi.fn()

vi.mock("~~/server/services/recruitmentFlowStageService.js", () => ({
  syncRecruitmentFlowStage: syncRecruitmentFlowStageMock,
}))

describe("candidateProjectionEventService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("syncs recruitment_flow_stage for all ERFs present in candidate summary events", async () => {
    const { syncCandidateProjectionEvent } = await import("../candidateProjectionEventService.js")

    const result = await syncCandidateProjectionEvent(
      { supabase: { tag: "supabase" } },
      {
        event_type: "candidate.employee_draft_contract_submitted",
        candidate_form_id: "candidate-form-1",
        summary: {
          primary_application: {
            erf_id: "erf-1",
          },
          applications: [
            { erf_id: "erf-1" },
            { erf_id: "erf-2" },
            { erf_id: " " },
          ],
        },
      },
    )

    expect(syncRecruitmentFlowStageMock).toHaveBeenCalledTimes(2)
    expect(syncRecruitmentFlowStageMock).toHaveBeenNthCalledWith(1, { tag: "supabase" }, "erf-1")
    expect(syncRecruitmentFlowStageMock).toHaveBeenNthCalledWith(2, { tag: "supabase" }, "erf-2")
    expect(result).toEqual({
      ok: true,
      event_type: "candidate.employee_draft_contract_submitted",
      synced_employee_request_form_ids: ["erf-1", "erf-2"],
    })
  })

  it("acknowledges candidate events that do not carry ERF ids without syncing any stage", async () => {
    const { syncCandidateProjectionEvent } = await import("../candidateProjectionEventService.js")

    const result = await syncCandidateProjectionEvent(
      { supabase: null },
      {
        event_type: "candidate.application_submitted",
        candidate_form_id: "candidate-form-1",
      },
    )

    expect(syncRecruitmentFlowStageMock).not.toHaveBeenCalled()
    expect(result).toEqual({
      ok: true,
      event_type: "candidate.application_submitted",
      synced_employee_request_form_ids: [],
    })
  })
})
