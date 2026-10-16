import { readBody } from "h3"

import { enforceRateLimit, getClientIpAddress } from "~~/server/lib/rateLimit.js"
import { defineJsonHandler } from "~~/server/utils/api"
import { getSupabaseAdmin } from "~~/server/services/supabaseAdmin.js"
import {
  requireCandidateProjectionSyncToken,
  syncCandidateProjectionEvent,
} from "~~/server/services/candidateProjectionEventService.js"

export default defineJsonHandler(async (event) => {
  enforceRateLimit(
    "internal.candidate-events",
    getClientIpAddress(event),
    120,
    60 * 1000,
    "Too many candidate sync events. Please retry shortly.",
  )

  requireCandidateProjectionSyncToken(event.node.req.headers)
  const body = await readBody(event)

  return syncCandidateProjectionEvent(
    {
      supabase: getSupabaseAdmin(),
    },
    body ?? {},
  )
})
