/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NUXT_PUBLIC_SUPABASE_URL?: string
  readonly NUXT_PUBLIC_SUPABASE_ANON_KEY?: string
  readonly NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET?: string
  readonly NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET?: string
  readonly NUXT_PUBLIC_ERF_DOCUMENT_BUCKET?: string
  readonly SUPABASE_SERVICE_ROLE_KEY?: string
  readonly SMTP_USER?: string
  readonly SMTP_PASS?: string
  readonly APP_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  const defineNuxtPlugin: (typeof import('#imports'))['defineNuxtPlugin']
  const defineNuxtRouteMiddleware: (typeof import('#imports'))['defineNuxtRouteMiddleware']
  const definePageMeta: (typeof import('#imports'))['definePageMeta']
  const navigateTo: (typeof import('#imports'))['navigateTo']
  const useRoute: (typeof import('#imports'))['useRoute']
  const useNuxtApp: (typeof import('#imports'))['useNuxtApp']

  interface Window {
    __NUXT__?: {
      config?: {
        public?: Record<string, unknown>
      }
    }
  }
}

declare module '#app' {
  interface NuxtApp {
    $repositories: import('@/infrastructure/repositories').AppRepositories
  }
}

declare module '@jledentu/vue-finder' {
  import type { DefineComponent } from 'vue'

  export const Finder: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
}
