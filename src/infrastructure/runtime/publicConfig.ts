import { useRuntimeConfig } from '#imports'

type PublicAppConfig = {
  candidateDocumentBucket: string
  candidatePhotographBucket: string
  employeeDocumentBucket: string
  erfDocumentBucket: string
  supabaseAnonKey: string
  supabaseUrl: string
}

type NuxtPublicRuntimeConfig = Partial<PublicAppConfig>

function readNuxtPublicConfig(): NuxtPublicRuntimeConfig {
  if (typeof globalThis !== 'object' || !('__NUXT__' in globalThis)) {
    return {}
  }

  const nuxtPayload = (
    globalThis as typeof globalThis & {
      __NUXT__?: {
        config?: {
          public?: NuxtPublicRuntimeConfig
        }
      }
    }
  ).__NUXT__

  return nuxtPayload?.config?.public ?? {}
}

function readProcessEnvValue(key: string) {
  const processEnv = (
    globalThis as typeof globalThis & {
      process?: {
        env?: Record<string, string | undefined>
      }
    }
  ).process?.env

  return String(processEnv?.[key] ?? '').trim()
}

function readPublicEnvValue(key: keyof ImportMetaEnv): string {
  return readProcessEnvValue(String(key)) || String(import.meta.env?.[key] ?? '').trim()
}

function readRuntimeConfigValue(): NuxtPublicRuntimeConfig {
  try {
    const runtimeConfig = useRuntimeConfig()
    return (runtimeConfig.public ?? {}) as NuxtPublicRuntimeConfig
  } catch {
    return {}
  }
}

export function getPublicAppConfig(): PublicAppConfig {
  const runtimeConfig = {
    ...readRuntimeConfigValue(),
    ...readNuxtPublicConfig(),
  }

  return {
    supabaseUrl:
      String(runtimeConfig.supabaseUrl ?? '').trim() ||
      readPublicEnvValue('NUXT_PUBLIC_SUPABASE_URL'),
    supabaseAnonKey:
      String(runtimeConfig.supabaseAnonKey ?? '').trim() ||
      readPublicEnvValue('NUXT_PUBLIC_SUPABASE_ANON_KEY'),
    candidatePhotographBucket:
      String(runtimeConfig.candidatePhotographBucket ?? '').trim() ||
      readPublicEnvValue('NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET') ||
      'candidate-photographs',
    candidateDocumentBucket:
      String(runtimeConfig.candidateDocumentBucket ?? '').trim() ||
      readPublicEnvValue('NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET') ||
      'candidate-documents',
    employeeDocumentBucket:
      String(runtimeConfig.employeeDocumentBucket ?? '').trim() ||
      readPublicEnvValue('NUXT_PUBLIC_EMPLOYEE_DOCUMENT_BUCKET') ||
      String(runtimeConfig.candidateDocumentBucket ?? '').trim() ||
      readPublicEnvValue('NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET') ||
      'candidate-documents',
    erfDocumentBucket:
      String(runtimeConfig.erfDocumentBucket ?? '').trim() ||
      readPublicEnvValue('NUXT_PUBLIC_ERF_DOCUMENT_BUCKET') ||
      'erf',
  }
}
