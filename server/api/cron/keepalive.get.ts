import { timingSafeEqual } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { defineEventHandler, getRequestHeader, setResponseHeader, setResponseStatus } from 'h3'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '~~/server/config/env.js'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const secret = process.env.CRON_SECRET
  const authorization = getRequestHeader(event, 'authorization') ?? ''
  const expected = Buffer.from(`Bearer ${secret ?? ''}`)
  const actual = Buffer.from(authorization)

  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    setResponseStatus(event, 401)
    return { ok: false, error: 'Unauthorized' }
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing server configuration')
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
    const timestamp = new Date().toISOString()
    const { error } = await supabase
      .from('app_heartbeat')
      .upsert({ id: 1, last_ping_at: timestamp }, { onConflict: 'id' })

    if (error) throw new Error('Heartbeat write failed')

    console.info('[cron/keepalive] success', timestamp)
    return { ok: true, timestamp }
  } catch {
    // Do not log Supabase errors: they may include sensitive request details.
    console.error('[cron/keepalive] failed')
    setResponseStatus(event, 503)
    return { ok: false, error: 'Heartbeat unavailable' }
  }
})
