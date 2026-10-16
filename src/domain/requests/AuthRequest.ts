export interface LoginRequest {
  identifier: string
  password: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ResolveLoginRequest {
  identifier: string
}
