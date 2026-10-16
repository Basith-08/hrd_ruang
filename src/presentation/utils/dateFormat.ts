function parseNaiveDateTime(value: string) {
  const match = value
    .trim()
    .match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/,
    )

  if (!match) {
    return null
  }

  const [, year, month, day, hour, minute] = match
  return { year, month, day, hour, minute }
}

function hasExplicitTimezone(value: string) {
  const text = value.trim()
  return text.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(text)
}

function getJakartaDateParts(value: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = formatter.formatToParts(new Date(value))
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return {
    year: byType.year,
    month: byType.month,
    day: byType.day,
  }
}

export function formatDateDisplay(value: string | null | undefined) {
  if (!value) return '-'

  const naiveParts = parseNaiveDateTime(value)
  if (naiveParts && !hasExplicitTimezone(value)) {
    return `${naiveParts.year}-${naiveParts.month}-${naiveParts.day}`
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  const parts = getJakartaDateParts(value)
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function formatDateTimeDisplay(value: string | null | undefined) {
  return formatDateDisplay(value)
}

function getJakartaDateTimeParts(value: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(new Date(value))
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return {
    year: byType.year,
    month: byType.month,
    day: byType.day,
    hour: byType.hour,
    minute: byType.minute,
  }
}

export function formatInterviewDateTimeDisplay(value: string | null | undefined) {
  if (!value) return '-'

  const naiveParts = parseNaiveDateTime(value)
  if (naiveParts && !hasExplicitTimezone(value)) {
    if (!naiveParts.hour || !naiveParts.minute) {
      return `${naiveParts.year}-${naiveParts.month}-${naiveParts.day}`
    }

    return `${naiveParts.year}-${naiveParts.month}-${naiveParts.day} ${naiveParts.hour}:${naiveParts.minute}`
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  const parts = getJakartaDateTimeParts(value)
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`
}
