import {
  HRD_PINTU_SERVICE_BASE_URL,
  HRD_PINTU_SERVICE_INTERNAL_TOKEN,
} from "~~/server/config/env.js"
import { createHttpError } from "~~/server/lib/errors.js"

function ensureCandidateSummary(payload, operation) {
  const candidate = payload?.candidate

  if (!candidate || typeof candidate !== "object") {
    throw createHttpError(
      502,
      `Candidate service returned an empty response while trying to ${operation}.`,
      { expose: true },
    )
  }

  if (!String(candidate.candidate_id ?? "").trim()) {
    throw createHttpError(
      502,
      `Candidate service returned an invalid candidate payload while trying to ${operation}.`,
      { expose: true },
    )
  }

  return candidate
}

function isEmployeeModeConfirmed(summary) {
  return (
    String(summary?.role ?? "").trim().toLowerCase() === "employee" &&
    String(summary?.status ?? "").trim().toLowerCase() === "active"
  )
}

async function getCandidateServiceSummary(candidateId, operation) {
  const payload = await callCandidateService(
    `/internal/candidates/${encodeURIComponent(candidateId)}/summary`,
  )

  return ensureCandidateSummary(payload, operation)
}

function getBaseUrl() {
  const baseUrl = String(HRD_PINTU_SERVICE_BASE_URL ?? "").trim().replace(/\/$/, "")
  if (!baseUrl) {
    throw createHttpError(500, "HRD_PINTU_SERVICE_BASE_URL is not configured.", {
      expose: false,
    })
  }

  return baseUrl
}

function getInternalToken() {
  const token = String(HRD_PINTU_SERVICE_INTERNAL_TOKEN ?? "").trim()
  if (!token) {
    throw createHttpError(500, "HRD_PINTU_SERVICE_INTERNAL_TOKEN is not configured.", {
      expose: false,
    })
  }

  return token
}

async function callCandidateService(path, init = {}) {
  const headers = new Headers(init.headers)
  headers.set("x-internal-service-token", getInternalToken())

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  let response

  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      ...init,
      headers,
    })
  } catch (error) {
    console.error("Candidate service network error:", error)
    throw createHttpError(
      503,
      "Candidate service is unreachable. Please make sure hrd_pintu is running and HRD_PINTU_SERVICE_BASE_URL points to the correct URL.",
      { expose: true },
    )
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const rawError =
      typeof payload?.error === "string" ? payload.error.trim() : ""
    const message =
      rawError && rawError !== "Internal Server Error"
        ? rawError
        : response.status >= 500
          ? "Candidate service is not ready. Please check hrd_pintu environment variables and apply the latest candidate database migration."
          : `Candidate service request failed with HTTP ${response.status}.`

    throw createHttpError(
      response.status,
      message,
      { expose: true },
    )
  }

  return payload
}

export async function createCandidateServiceAccount(input) {
  const payload = await callCandidateService("/internal/candidates", {
    method: "POST",
    body: JSON.stringify(input),
  })

  return ensureCandidateSummary(payload, "create a candidate account")
}

export async function getCandidateServiceCandidateFormSnapshot(candidateFormId) {
  const payload = await callCandidateService(
    `/internal/candidate-forms/${encodeURIComponent(candidateFormId)}`,
  )

  const snapshot = payload?.candidate_form

  if (!snapshot || typeof snapshot !== "object" || !String(snapshot.id ?? "").trim()) {
    throw createHttpError(
      502,
      "Candidate service returned an invalid candidate form snapshot.",
      { expose: true },
    )
  }

  return snapshot
}

export async function appendCandidateServiceCandidateFormEmployeeDocuments(
  candidateFormId,
  input,
) {
  const payload = await callCandidateService(
    `/internal/candidate-forms/${encodeURIComponent(candidateFormId)}/employee-documents`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  )

  const snapshot = payload?.candidate_form

  if (!snapshot || typeof snapshot !== "object" || !String(snapshot.id ?? "").trim()) {
    throw createHttpError(
      502,
      "Candidate service returned an invalid candidate form snapshot after updating employee documents.",
      { expose: true },
    )
  }

  return snapshot
}

export async function removeCandidateServiceCandidateFormEmployeeDocument(
  candidateFormId,
  input,
) {
  const payload = await callCandidateService(
    `/internal/candidate-forms/${encodeURIComponent(candidateFormId)}/employee-documents`,
    {
      method: "DELETE",
      body: JSON.stringify(input),
    },
  )

  const snapshot = payload?.candidate_form

  if (!snapshot || typeof snapshot !== "object" || !String(snapshot.id ?? "").trim()) {
    throw createHttpError(
      502,
      "Candidate service returned an invalid candidate form snapshot after removing an employee document.",
      { expose: true },
    )
  }

  return snapshot
}

export async function getCandidateServiceStorageSignedUrl(
  bucket,
  candidateFormId,
  path,
) {
  const payload = await callCandidateService(
    "/internal/storage/sign-url",
    {
      method: "POST",
      body: JSON.stringify({
        bucket,
        candidate_form_id: candidateFormId,
        path,
      }),
    },
  )

  const signedUrl = String(payload?.signed_url ?? "").trim()
  if (!signedUrl) {
    throw createHttpError(
      502,
      "Candidate service returned an invalid signed storage URL.",
      { expose: true },
    )
  }

  return signedUrl
}

export async function updateCandidateServiceAccount(candidateId, input) {
  const payload = await callCandidateService(
    `/internal/candidates/${encodeURIComponent(candidateId)}`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  )

  return ensureCandidateSummary(payload, "update a candidate account")
}

export async function addCandidateServiceApplication(candidateId, input) {
  const payload = await callCandidateService(
    `/internal/candidates/${encodeURIComponent(candidateId)}/applications`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  )

  return ensureCandidateSummary(payload, "add a candidate application")
}

export async function resetCandidateServicePassword(candidateId, password) {
  const payload = await callCandidateService(
    `/internal/candidates/${encodeURIComponent(candidateId)}/reset-password`,
    {
      method: "POST",
      body: JSON.stringify({ password }),
    },
  )

  return ensureCandidateSummary(payload, "reset a candidate password")
}

export async function switchCandidateServiceAccountToEmployee(candidateId) {
  const payload = await callCandidateService(
    `/internal/candidates/${encodeURIComponent(candidateId)}/switch-to-employee`,
    {
      method: "POST",
    },
  )

  const candidate = payload?.candidate
  const summary =
    candidate && typeof candidate === "object" && String(candidate.candidate_id ?? "").trim()
      ? candidate
      : await getCandidateServiceSummary(
    candidateId,
    "switch a candidate account to employee mode",
  )

  if (isEmployeeModeConfirmed(summary)) {
    return summary
  }

  const repairedPayload = await callCandidateService(
    `/internal/candidates/${encodeURIComponent(candidateId)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        portal_role: "employee",
        status: "active",
      }),
    },
  )
  const repairedCandidate =
    repairedPayload?.candidate &&
    typeof repairedPayload.candidate === "object" &&
    String(repairedPayload.candidate.candidate_id ?? "").trim()
      ? repairedPayload.candidate
      : await getCandidateServiceSummary(
    candidateId,
    "switch a candidate account to employee mode",
  )

  if (String(repairedCandidate.role ?? "").trim().toLowerCase() !== "employee") {
    throw createHttpError(
      502,
      "Candidate service did not confirm the portal role change to employee. Please restart hrd_pintu and try again.",
      { expose: true },
    )
  }

  if (String(repairedCandidate.status ?? "").trim().toLowerCase() !== "active") {
    throw createHttpError(
      502,
      "Candidate service did not confirm account activation after switching to employee mode.",
      { expose: true },
    )
  }

  return repairedCandidate
}

export async function setCandidateServiceAccountActive(candidateId, isActive) {
  const payload = await callCandidateService(
    `/internal/candidates/${encodeURIComponent(candidateId)}/active`,
    {
      method: "PATCH",
      body: JSON.stringify({ is_active: Boolean(isActive) }),
    },
  )

  return ensureCandidateSummary(payload, "change candidate active status")
}

export async function revokeCandidateServiceAccount(candidateId) {
  const payload = await callCandidateService(
    `/internal/candidates/${encodeURIComponent(candidateId)}`,
    {
      method: "DELETE",
    },
  )

  return ensureCandidateSummary(payload, "revoke a candidate account")
}
