import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  header: vi.fn(), status: vi.fn(), responseHeader: vi.fn(), upsert: vi.fn(),
  from: vi.fn(), createClient: vi.fn(),
  env: { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'server-key' },
}))
vi.mock('h3', () => ({
  defineEventHandler: (handler: unknown) => handler,
  getRequestHeader: mocks.header,
  setResponseStatus: mocks.status,
  setResponseHeader: mocks.responseHeader,
}))
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }))
vi.mock('~~/server/config/env.js', () => mocks.env)
import handler from '../keepalive.get'

const invoke = () => handler({} as Parameters<typeof handler>[0])

describe('GET /api/cron/keepalive', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubEnv('CRON_SECRET', 'test-secret')
    mocks.header.mockReturnValue('Bearer test-secret')
    mocks.env.SUPABASE_URL = 'https://example.supabase.co'
    mocks.createClient.mockReturnValue({ from: mocks.from })
    mocks.from.mockReturnValue({ upsert: mocks.upsert })
    mocks.upsert.mockResolvedValue({ error: null })
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); vi.restoreAllMocks() })

  it.each([undefined, 'Bearer wrong', 'Bearer wrong-secret', 'test-secret'])('rejects authorization %s', async (header) => {
    mocks.header.mockReturnValue(header)
    expect(await invoke()).toEqual({ ok: false, error: 'Unauthorized' })
    expect(mocks.status).toHaveBeenCalledWith(expect.anything(), 401)
    expect(mocks.createClient).not.toHaveBeenCalled()
  })
  it('rejects a missing secret', async () => {
    vi.stubEnv('CRON_SECRET', '')
    await invoke()
    expect(mocks.status).toHaveBeenCalledWith(expect.anything(), 401)
    expect(mocks.createClient).not.toHaveBeenCalled()
  })
  it('upserts the singleton with a fresh timestamp on repeated calls', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-19T15:00:00Z'))
    expect(await invoke()).toEqual({ ok: true, timestamp: '2026-11-19T15:00:00.000Z' })
    vi.setSystemTime(new Date('2026-11-22T15:00:00Z'))
    expect(await invoke()).toEqual({ ok: true, timestamp: '2026-11-22T15:00:00.000Z' })
    expect(mocks.from).toHaveBeenCalledWith('app_heartbeat')
    expect(mocks.upsert.mock.calls).toEqual([
      [{ id: 1, last_ping_at: '2026-11-19T15:00:00.000Z' }, { onConflict: 'id' }],
      [{ id: 1, last_ping_at: '2026-11-22T15:00:00.000Z' }, { onConflict: 'id' }],
    ])
    expect(mocks.createClient).toHaveBeenCalledWith(mocks.env.SUPABASE_URL, 'server-key', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
    expect(mocks.responseHeader).toHaveBeenCalledWith(expect.anything(), 'Cache-Control', 'no-store')
  })
  it.each(['database', 'network', 'configuration'])('returns 503 on %s failure without leaking details', async (failure) => {
    if (failure === 'database') mocks.upsert.mockResolvedValue({ error: { message: 'sensitive' } })
    if (failure === 'network') mocks.upsert.mockRejectedValue(new Error('sensitive'))
    if (failure === 'configuration') mocks.env.SUPABASE_URL = ''
    expect(await invoke()).toEqual({ ok: false, error: 'Heartbeat unavailable' })
    expect(mocks.status).toHaveBeenCalledWith(expect.anything(), 503)
    expect(console.error).toHaveBeenCalledWith('[cron/keepalive] failed')
  })
})
