import { APP_BASE_URL } from "~~/server/config/env.js"
import { createHttpError } from "~~/server/lib/errors.js"

function normalizeOrigin(value) {
  try {
    const url = new URL(String(value ?? "").trim())

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Invalid protocol")
    }

    url.pathname = ""
    url.search = ""
    url.hash = ""

    return url.toString().replace(/\/$/, "")
  } catch {
    throw createHttpError(400, "Unable to resolve a trusted app origin.")
  }
}

export function resolveTrustedAppOrigin(event) {
  void event

  if (APP_BASE_URL) {
    return normalizeOrigin(APP_BASE_URL)
  }

  throw createHttpError(500, "APP_BASE_URL is not configured.", {
    expose: false,
  })
}
