import type { AuthRepository } from "@/domain/repositories/AuthRepository"
import type { LoginRequest } from "@/domain/requests/AuthRequest"

export function loginUser(authRepository: AuthRepository, payload: LoginRequest) {
  return authRepository.login(payload)
}
