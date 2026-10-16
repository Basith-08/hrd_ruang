import { fileURLToPath } from 'node:url'
import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-03-31',
  app: {
    head: {
      title: 'HRD Ruang',
      titleTemplate: '%s | HRD Ruang',
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/hrd-mark.svg',
        },
        {
          rel: 'shortcut icon',
          type: 'image/svg+xml',
          href: '/hrd-mark.svg',
        },
        {
          rel: 'apple-touch-icon',
          type: 'image/svg+xml',
          href: '/hrd-mark.svg',
        },
      ],
    },
  },
  devtools: {
    enabled: process.env.NODE_ENV === 'development',
  },
  ssr: false,
  srcDir: 'src',
  modules: ['@pinia/nuxt'],
  components: [
    {
      path: '~/presentation/components/navigation',
      pathPrefix: false,
      global: true,
    },
  ],
  css: ['~/styles.css'],
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        '@jledentu/vue-finder',
        '@supabase/supabase-js',
        'vue-sonner',
        '@vueuse/core',
        'lucide-vue-next',
      ],
    },
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      candidatePhotographBucket:
        process.env.NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET ?? 'candidate-photographs',
      employeeDocumentBucket:
        process.env.NUXT_PUBLIC_EMPLOYEE_DOCUMENT_BUCKET ??
        process.env.NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET ??
        'candidate-documents',
      candidateDocumentBucket:
        process.env.NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET ?? 'candidate-documents',
      pintuPortalUrl: process.env.NUXT_PUBLIC_HRD_PINTU_URL ?? '',
      erfDocumentBucket: process.env.NUXT_PUBLIC_ERF_DOCUMENT_BUCKET ?? 'erf',
    },
  },
})
