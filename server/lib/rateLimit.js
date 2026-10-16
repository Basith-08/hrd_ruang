import { createHttpError } from "~~/server/lib/errors.js"

const buckets = new Map()

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : ""
}

function getBucketKey(name, key) {
  return `${name}:${key || "anonymous"}`
}

export function resetRateLimitStore() {
  buckets.clear()
}

export function getClientIpAddress(event) {
  const forwardedFor = normalizeText(event?.node?.req?.headers?.["x-forwarded-for"])
  if (forwardedFor) {
    return normalizeText(forwardedFor.split(",")[0])
  }

  const realIp = normalizeText(event?.node?.req?.headers?.["x-real-ip"])
  if (realIp) {
    return realIp
  }

  return normalizeText(event?.node?.req?.socket?.remoteAddress) || "unknown"
}

export function enforceRateLimit(name, key, limit, windowMs, message = "Too many requests.") {
  const now = Date.now()
  const bucketKey = getBucketKey(name, normalizeText(key))
  const bucket = buckets.get(bucketKey) ?? []
  const activeEntries = bucket.filter((timestamp) => now - timestamp < windowMs)

  if (activeEntries.length >= limit) {
    throw createHttpError(429, message)
  }

  activeEntries.push(now)
  buckets.set(bucketKey, activeEntries)
}
