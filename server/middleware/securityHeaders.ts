import { defineEventHandler, setResponseHeader } from 'h3'

function normalizeOrigin(value: unknown) {
  try {
    const url = new URL(String(value ?? '').trim())
    url.pathname = ''
    url.search = ''
    url.hash = ''
    return url.toString().replace(/\/$/, '')
  } catch {
    return ''
  }
}

function uniqueOrigins(values: Array<unknown>) {
  return [...new Set(values.map(normalizeOrigin).filter(Boolean))]
}

function buildCspReportOnlyValue() {
  const supabaseOrigins = uniqueOrigins([
    process.env.NUXT_PUBLIC_SUPABASE_URL,
    process.env.HRD_PINTU_SUPABASE_URL,
  ])

  const connectSrc = ["'self'", ...supabaseOrigins]
  const imgSrc = ["'self'", 'data:', 'blob:', ...supabaseOrigins]

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    `connect-src ${connectSrc.join(' ')}`,
    `img-src ${imgSrc.join(' ')}`,
    "font-src 'self' data:",
    "worker-src 'self' blob:",
    'report-uri /csp-report',
    'report-to csp-endpoint',
  ].join('; ')
}

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin')
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')
  setResponseHeader(event, 'X-Frame-Options', 'DENY')
  setResponseHeader(event, 'Reporting-Endpoints', 'csp-endpoint="/csp-report"')
  setResponseHeader(event, 'Content-Security-Policy-Report-Only', buildCspReportOnlyValue())
  setResponseHeader(
    event,
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()',
  )
})
