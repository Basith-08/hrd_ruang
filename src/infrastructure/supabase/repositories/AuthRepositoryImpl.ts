import type { AuthRepository } from '@/domain/repositories/AuthRepository'
import type { User } from '@/domain/entities/User'
import type { ChangePasswordRequest, LoginRequest, ResolveLoginRequest } from '@/domain/requests/AuthRequest'
import { supabase } from '@/infrastructure/supabase/client'
import { callBackendApi } from '@/infrastructure/http/backendApi'
import type { ResolveLoginResponse } from '@/infrastructure/supabase/repositories/responses/AuthRepositoryResponse'

export class AuthRepositoryImpl implements AuthRepository {
  async login(payload: LoginRequest): Promise<User> {
    const email = await this.resolveEmail(payload.identifier)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: payload.password,
    })

    if (error) {
      throw new Error(error.message)
    }

    if (!data.user?.email) {
      throw new Error('User data is unavailable.')
    }

    return {
      id: data.user.id,
      email: data.user.email,
    }
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut()

    if (error && error.name !== 'AuthSessionMissingError') {
      throw new Error(error.message)
    }
  }

  async changePassword(payload: ChangePasswordRequest): Promise<void> {
    await callBackendApi(
      '/auth/change-password',
      {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: payload.currentPassword,
          newPassword: payload.newPassword,
        }),
      },
    )
  }

  private async resolveEmail(identifier: string) {
    const normalizedIdentifier = identifier.trim()

    if (this.isEmail(normalizedIdentifier)) {
      return normalizedIdentifier
    }

    const request: ResolveLoginRequest = {
      identifier: normalizedIdentifier.replace(/^@/, ''),
    }
    const payload = await callBackendApi<ResolveLoginResponse>(
      '/auth/resolve-login',
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      { auth: false },
    )

    return payload.email
  }

  private isEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }
}
