export function getSafeInternalRedirect(value: unknown): string | null {
  const normalized = String(value ?? '').trim()

  if (!normalized.startsWith('/')) {
    return null
  }

  if (normalized.startsWith('//')) {
    return null
  }

  if (/[\\\r\n]/.test(normalized)) {
    return null
  }

  return normalized
}
