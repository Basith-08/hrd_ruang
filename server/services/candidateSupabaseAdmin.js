import { createClient } from "@supabase/supabase-js"

import {
  HRD_PINTU_SUPABASE_SERVICE_ROLE_KEY,
  HRD_PINTU_SUPABASE_URL,
} from "~~/server/config/env.js"

let candidateSupabaseAdmin = null

export function isCandidateDatabaseConfigured() {
  return Boolean(
    String(HRD_PINTU_SUPABASE_URL ?? "").trim() &&
      String(HRD_PINTU_SUPABASE_SERVICE_ROLE_KEY ?? "").trim(),
  )
}

export function getCandidateSupabaseAdmin() {
  if (!isCandidateDatabaseConfigured()) {
    throw new Error(
      "HRD_PINTU_SUPABASE_URL and HRD_PINTU_SUPABASE_SERVICE_ROLE_KEY must be set",
    )
  }

  if (!candidateSupabaseAdmin) {
    candidateSupabaseAdmin = createClient(
      String(HRD_PINTU_SUPABASE_URL).trim(),
      String(HRD_PINTU_SUPABASE_SERVICE_ROLE_KEY).trim(),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
  }

  return candidateSupabaseAdmin
}
