// Global defaults for in-memory list/resource caching used by viewmodels across the app.
// Override per call site only when a specific page genuinely needs a different freshness window.
export const RESOURCE_CACHE_TTL_MS = 5 * 60 * 1000

// Global defaults for @tanstack/vue-query, used by pages that need richer fetching behavior
// (request dedupe, refetch-on-focus, retry) on top of simple TTL caching. Kept here alongside
// RESOURCE_CACHE_TTL_MS so every cache-timing knob in the app lives in one place.
export const QUERY_STALE_TIME_MS = 30 * 1000
export const QUERY_GC_TIME_MS = 5 * 60 * 1000
