import type { LoginRequest } from '@/domain/requests/AuthRequest'

export type LoginFormValues = LoginRequest

export type LoginFormErrors = Record<keyof LoginFormValues, string>

export interface LoginSubmitActions {
  setErrors(errors: LoginFormErrors): void
}
