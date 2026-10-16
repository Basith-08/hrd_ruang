export type AppTableColumnKind =
  | 'number'
  | 'name'
  | 'email'
  | 'phone'
  | 'department'
  | 'businessUnit'
  | 'position'
  | 'role'
  | 'status'
  | 'date'
  | 'actions'

type TableColumnSizingInput = {
  key: string
  width?: string
  minWidth?: string
  kind?: AppTableColumnKind
}

type TableColumnSizingResult = {
  width?: string
  minWidth?: string
}

const TABLE_COLUMN_KIND_DEFAULTS: Record<AppTableColumnKind, TableColumnSizingResult> = {
  number: { width: 'w-14' },
  name: { minWidth: 'min-w-[220px]' },
  email: { minWidth: 'min-w-[220px]' },
  phone: { minWidth: 'min-w-[160px]' },
  department: { minWidth: 'min-w-[200px]' },
  businessUnit: { minWidth: 'min-w-[220px]' },
  position: { minWidth: 'min-w-[220px]' },
  role: { minWidth: 'min-w-[180px]' },
  status: { minWidth: 'min-w-[180px]' },
  date: { minWidth: 'min-w-[160px]' },
  actions: { minWidth: 'min-w-[160px]' },
}

function inferTableColumnKind(key: string): AppTableColumnKind | null {
  const normalizedKey = String(key ?? '').trim().toLowerCase()

  if (!normalizedKey) return null
  if (normalizedKey === 'number' || normalizedKey === 'no') return 'number'
  if (normalizedKey.includes('action')) return 'actions'
  if (normalizedKey.includes('status')) return 'status'
  if (normalizedKey.includes('date')) return 'date'
  if (normalizedKey.includes('email')) return 'email'
  if (normalizedKey.includes('phone')) return 'phone'
  if (normalizedKey.includes('department')) return 'department'
  if (normalizedKey.includes('businessunit') || normalizedKey.includes('business_unit')) return 'businessUnit'
  if (normalizedKey.includes('position') || normalizedKey.includes('candidate') || normalizedKey.includes('interviewer')) {
    return 'position'
  }
  if (normalizedKey.includes('role')) return 'role'
  if (normalizedKey.includes('name') || normalizedKey.includes('user')) return 'name'

  return null
}

export function resolveAppTableColumnSizing(input: TableColumnSizingInput): TableColumnSizingResult {
  const kind = input.kind ?? inferTableColumnKind(input.key)
  const defaults = kind ? TABLE_COLUMN_KIND_DEFAULTS[kind] : null

  return {
    width: input.width ?? defaults?.width,
    minWidth: input.minWidth ?? defaults?.minWidth,
  }
}
