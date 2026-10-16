type TranslateText = (key: string) => string

export function candidateStatusLabel(
  text: TranslateText,
  status: string | null | undefined,
) {
  const map: Record<string, string> = {
    in_progress: text('candidateForms.list.status.inProgress'),
    completed: text('candidateForms.list.status.completed'),
  }

  return map[String(status ?? '')] || text('candidateForms.list.status.inProgress')
}

export function candidateStatusBadge(status: string | null | undefined) {
  const map: Record<string, string> = {
    in_progress: 'app-status-chip app-status-chip-warning',
    completed: 'app-status-chip app-status-chip-success',
  }

  return map[String(status ?? '')] || 'app-status-chip app-status-chip-neutral'
}
