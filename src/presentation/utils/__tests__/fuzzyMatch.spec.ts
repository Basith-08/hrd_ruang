import { describe, expect, it } from 'vitest'

import { findOptionByLabel, stringSimilarity } from '../fuzzyMatch'

describe('findOptionByLabel', () => {
  const options = [
    { value: 'dep-1', label: '99. BU Departement (Testing)' },
    { value: 'dep-2', label: 'Finance' },
  ]

  it('matches on exact label regardless of case', () => {
    expect(findOptionByLabel(options, 'FINANCE')?.value).toBe('dep-2')
  })

  it('matches a hand-typed value with a small typo via fuzzy similarity', () => {
    // "Department" vs the master data's "Departement" — a single extra letter.
    expect(findOptionByLabel(options, '99. BU Department (Testing)')?.value).toBe('dep-1')
  })

  it('does not match a genuinely different value', () => {
    expect(findOptionByLabel(options, 'Human Resources')).toBeNull()
  })

  it('returns null for an empty value', () => {
    expect(findOptionByLabel(options, '   ')).toBeNull()
  })
})

describe('stringSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(stringSimilarity('staff', 'staff')).toBe(1)
  })

  it('returns 0 for completely different strings of equal length', () => {
    expect(stringSimilarity('abc', 'xyz')).toBe(0)
  })
})
