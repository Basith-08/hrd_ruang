import { describe, expect, it } from "vitest"

import {
  decodeCandidateServiceUserId,
  encodeCandidateServiceUserId,
  isCandidateServiceManagedUserId,
} from "../candidateProjectionService.js"

describe("candidateProjectionService", () => {
  it("encodes and decodes managed user ids for candidate service accounts", () => {
    expect(encodeCandidateServiceUserId("cand-1")).toBe("candidate:cand-1")
    expect(decodeCandidateServiceUserId("candidate:cand-1")).toBe("cand-1")
    expect(decodeCandidateServiceUserId("managed-1")).toBeNull()
    expect(isCandidateServiceManagedUserId("candidate:cand-1")).toBe(true)
    expect(isCandidateServiceManagedUserId("managed-1")).toBe(false)
  })
})
