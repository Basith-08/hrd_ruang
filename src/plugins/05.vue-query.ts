import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { defineNuxtPlugin } from '#imports'
import type { App } from 'vue'

import { QUERY_GC_TIME_MS, QUERY_STALE_TIME_MS } from '@/config/cache.config'

export default defineNuxtPlugin((nuxtApp: { vueApp: App<Element> }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        gcTime: QUERY_GC_TIME_MS,
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  })

  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient })
})
