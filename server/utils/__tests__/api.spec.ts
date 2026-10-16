import { beforeEach, describe, expect, it, vi } from 'vitest'

const setResponseStatusMock = vi.fn()

vi.mock('h3', () => ({
  defineEventHandler: (handler: unknown) => handler,
  setResponseStatus: setResponseStatusMock,
}))

describe('defineJsonHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exposes safe client errors', async () => {
    const { defineJsonHandler } = await import('../api')
    const { createHttpError } = await import('~~/server/lib/errors.js')

    const handler = defineJsonHandler(async () => {
      throw createHttpError(400, 'Identifier is required.')
    })

    await expect(handler({} as never)).resolves.toEqual({
      ok: false,
      error: 'Identifier is required.',
    })
    expect(setResponseStatusMock).toHaveBeenCalledWith(expect.anything(), 400)
  })

  it('hides internal server error messages', async () => {
    const { defineJsonHandler } = await import('../api')

    const handler = defineJsonHandler(async () => {
      throw new Error('database connection leaked details')
    })

    await expect(handler({} as never)).resolves.toEqual({
      ok: false,
      error: 'Internal Server Error',
    })
    expect(setResponseStatusMock).toHaveBeenCalledWith(expect.anything(), 500)
  })
})
