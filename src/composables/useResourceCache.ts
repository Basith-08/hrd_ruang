import { ref, type Ref } from 'vue'

import { RESOURCE_CACHE_TTL_MS } from '@/config/cache.config'

export interface ResourceCache<T> {
  data: Ref<T>
  loading: Ref<boolean>
  error: Ref<string>
  lastFetchedAt: number
  inFlight: Promise<void> | null
}

// Module-level cache instances are singletons by construction (one `ref` created here is shared
// by every caller that holds the same `ResourceCache` object), which is what lets a page reuse
// fetched data across mount/unmount instead of refetching on every visit.
export function createResourceCache<T>(initialValue: T): ResourceCache<T> {
  return {
    data: ref(initialValue) as Ref<T>,
    loading: ref(false),
    error: ref(''),
    lastFetchedAt: 0,
    inFlight: null,
  }
}

export function isResourceCacheFresh(cache: ResourceCache<unknown>, ttlMs: number = RESOURCE_CACHE_TTL_MS) {
  return Boolean(cache.lastFetchedAt) && Date.now() - cache.lastFetchedAt < ttlMs
}

export function invalidateResourceCache(cache: ResourceCache<unknown>) {
  cache.lastFetchedAt = 0
}

export async function refreshResourceCache<T>(
  cache: ResourceCache<T>,
  fetcher: () => Promise<T>,
  fallbackErrorMessage: string,
): Promise<void> {
  if (cache.inFlight) {
    return cache.inFlight
  }

  cache.loading.value = true
  cache.error.value = ''

  const task = (async () => {
    try {
      cache.data.value = await fetcher()
      cache.lastFetchedAt = Date.now()
    } catch (err) {
      cache.error.value = err instanceof Error ? err.message : fallbackErrorMessage
    } finally {
      cache.loading.value = false
      cache.inFlight = null
    }
  })()

  cache.inFlight = task
  return task
}
