import { supabase } from '@/infrastructure/supabase/client'
import { translateText } from '@/composables/useLocale'

type BackendRequestOptions = {
  auth?: boolean
}

let pendingAccessTokenPromise: Promise<string> | null = null

async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession()

  const accessToken = String(session?.access_token ?? '').trim()
  if (!accessToken) {
    throw new Error(translateText('auth.messages.sessionExpired'))
  }

  return accessToken
}

async function getSharedAccessToken() {
  if (!pendingAccessTokenPromise) {
    pendingAccessTokenPromise = getAccessToken().finally(() => {
      pendingAccessTokenPromise = null
    })
  }

  return pendingAccessTokenPromise
}

export async function fetchBackendApi(
  path: string,
  init: RequestInit = {},
  options: BackendRequestOptions = {},
): Promise<Response> {
  const { auth = true } = options
  const headers = new Headers(init.headers)
  const isFormDataBody = typeof FormData !== 'undefined' && init.body instanceof FormData

  if (init.body && !isFormDataBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (auth) {
    headers.set('Authorization', `Bearer ${await getSharedAccessToken()}`)
  }

  const response = await fetch(path, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string
    }

    throw new Error(payload.error || `Request failed with HTTP ${response.status}.`)
  }

  return response
}

export async function callBackendApi<T>(
  path: string,
  init: RequestInit = {},
  options: BackendRequestOptions = {},
): Promise<T> {
  const response = await fetchBackendApi(path, init, options)

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
  }

  return payload as T
}
