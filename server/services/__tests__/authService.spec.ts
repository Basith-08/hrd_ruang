import { beforeEach, describe, expect, it, vi } from 'vitest'

const maybeSingleMock = vi.fn()
const ilikeMock = vi.fn(() => ({
  maybeSingle: maybeSingleMock,
}))
const selectMock = vi.fn(() => ({
  ilike: ilikeMock,
}))
const fromMock = vi.fn(() => ({
  select: selectMock,
}))
const getSupabaseAdminMock = vi.fn(() => ({
  from: fromMock,
}))

vi.mock('~~/server/services/supabaseAdmin.js', () => ({
  getSupabaseAdmin: getSupabaseAdminMock,
}))

describe('authService.resolveLoginIdentifier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the email directly when the identifier is already an email', async () => {
    const { resolveLoginIdentifier } = await import('../authService.js')

    await expect(resolveLoginIdentifier('user@example.com')).resolves.toEqual({
      email: 'user@example.com',
    })

    expect(getSupabaseAdminMock).not.toHaveBeenCalled()
  })

  it('returns the mapped email when a username exists', async () => {
    maybeSingleMock.mockResolvedValue({
      data: { email: 'mapped@example.com' },
      error: null,
    })

    const { resolveLoginIdentifier } = await import('../authService.js')

    await expect(resolveLoginIdentifier('mapped-user')).resolves.toEqual({
      email: 'mapped@example.com',
    })
  })

  it('returns a fallback invalid email when the username is unknown', async () => {
    maybeSingleMock.mockResolvedValue({
      data: null,
      error: null,
    })

    const { resolveLoginIdentifier } = await import('../authService.js')

    await expect(resolveLoginIdentifier('@Unknown User')).resolves.toEqual({
      email: 'unknownuser@example.invalid',
    })
  })
})
