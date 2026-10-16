export type TableSortDirection = 'asc' | 'desc'

export function compareNullableValues(
  left: number | string | null | undefined,
  right: number | string | null | undefined,
  direction: TableSortDirection,
) {
  if (left == null && right == null) return 0
  if (left == null) return 1
  if (right == null) return -1

  const factor = direction === 'asc' ? 1 : -1

  if (typeof left === 'number' && typeof right === 'number') {
    return (left - right) * factor
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: 'base',
  }) * factor
}

export function parseSortDate(value: string | null | undefined) {
  const timestamp = Date.parse(String(value ?? '').trim())
  return Number.isNaN(timestamp) ? null : timestamp
}
