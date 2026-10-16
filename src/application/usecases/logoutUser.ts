import type { AuthRepository } from "@/domain/repositories/AuthRepository"

export function logoutUser(authRepository: AuthRepository) {
  return authRepository.logout()
}
