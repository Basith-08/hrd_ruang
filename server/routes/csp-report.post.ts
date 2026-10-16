import { readBody } from "h3"

import { enforceRateLimit, getClientIpAddress } from "~~/server/lib/rateLimit.js"
import { defineJsonHandler } from "~~/server/utils/api"

function normalizeText(value, maxLength = 500) {
  const normalized = typeof value === "string" ? value.trim() : ""
  return normalized.slice(0, maxLength)
}

function extractCspReport(body) {
  if (Array.isArray(body)) {
    const firstCspItem = body.find((item) => item && typeof item === "object" && item.body)
    const nestedBody = firstCspItem?.body
    return nestedBody && typeof nestedBody === "object" ? nestedBody : null
  }

  if (body && typeof body === "object") {
    const nestedReport = body["csp-report"]
    if (nestedReport && typeof nestedReport === "object") {
      return nestedReport
    }

    const nestedBody = body.body
    if (nestedBody && typeof nestedBody === "object") {
      return nestedBody
    }
  }

  return null
}

function sanitizeCspReport(report, clientIp) {
  return {
    document_uri: normalizeText(report["document-uri"]),
    violated_directive: normalizeText(report["violated-directive"]),
    effective_directive: normalizeText(report["effective-directive"]),
    blocked_uri: normalizeText(report["blocked-uri"]),
    source_file: normalizeText(report["source-file"]),
    line_number: Number(report["line-number"] ?? 0) || 0,
    column_number: Number(report["column-number"] ?? 0) || 0,
    disposition: normalizeText(report.disposition),
    original_policy: normalizeText(report["original-policy"], 1000),
    referrer: normalizeText(report.referrer),
    status_code: Number(report["status-code"] ?? 0) || 0,
    client_ip: normalizeText(clientIp, 120),
  }
}

export default defineJsonHandler(async (event) => {
  const clientIp = getClientIpAddress(event)
  enforceRateLimit(
    "csp.report",
    clientIp,
    60,
    60 * 1000,
    "Too many CSP reports. Please retry shortly.",
  )

  const body = await readBody(event)
  const report = extractCspReport(body)

  if (report) {
    console.warn(
      "CSP violation report:",
      sanitizeCspReport(report, clientIp),
    )
  }

  return { ok: true }
})
