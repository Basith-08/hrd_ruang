export function stripLeadingNumberCode(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return value
  }

  const normalizedValue = String(value).trim()
  const withoutCodePrefix = normalizedValue.replace(/^\d+\s*[.)-:]?\s*/, '').trim()

  return withoutCodePrefix || normalizedValue
}
