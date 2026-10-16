import type { AuthRepository } from "@/domain/repositories/AuthRepository"
import type { ChangePasswordRequest } from "@/domain/requests/AuthRequest"

export function changePasswordUser(authRepository: AuthRepository, payload: ChangePasswordRequest) {
  return authRepository.changePassword(payload)
}
