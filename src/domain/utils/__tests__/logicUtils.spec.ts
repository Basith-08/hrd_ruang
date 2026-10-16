import { describe, expect, it, vi } from 'vitest'
import { buildApprovalSummary } from '../approvalSummary'
import { getJakartaTimestamp } from '@/infrastructure/utils/jakartaTime'
import { formatDateDisplay, formatDateTimeDisplay } from '@/presentation/utils/dateFormat'

describe('shared logic utilities', () => {
  it('buildApprovalSummary prefers step data and falls back when a step is not approved', () => {
    const summary = buildApprovalSummary(
      [
        {
          step_order: 2,
          approver_name: 'GM HRD',
          approved_at: '2026-03-03 10:00',
          status: 'approved',
        },
        {
          step_order: 1,
          approver_name: 'BU Director',
          approved_at: '2026-03-02 09:00',
          status: 'rejected',
        },
      ],
      {
        approval_director_bu: 'Fallback BU',
        approval_director_bu_date: '2026-03-01 08:00',
        approval_director_hrd: 'Fallback HRD',
      },
    )

    expect(summary).toEqual({
      approval_director_bu: 'BU Director',
      approval_director_bu_date: '2026-03-01 08:00',
      approval_gm_hrd: 'GM HRD',
      approval_gm_hrd_date: '2026-03-03 10:00',
      approval_director_hrd: 'Fallback HRD',
      approval_director_hrd_date: null,
    })
  })

  it('formats naive and timezone-aware dates for Jakarta display', () => {
    expect(formatDateDisplay('2026-03-01 12:30:00')).toBe('2026-03-01')
    expect(formatDateDisplay('2026-03-01T01:30:00Z')).toBe('2026-03-01')
    expect(formatDateTimeDisplay('2026-03-01')).toBe('2026-03-01')
    expect(formatDateTimeDisplay('2026-03-01 12:30:00')).toBe('2026-03-01')
    expect(formatDateTimeDisplay('2026-03-01T01:30:00Z')).toBe('2026-03-01')
    expect(formatDateDisplay('invalid')).toBe('invalid')
    expect(formatDateTimeDisplay(null)).toBe('-')
  })

  it('produces a stable Jakarta timestamp string', () => {
    const timestamp = getJakartaTimestamp(new Date('2026-03-01T01:02:03Z'))
    expect(timestamp).toBe('2026-03-01 08:02:03')
  })
})
