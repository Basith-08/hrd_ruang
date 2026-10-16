import type { User } from "@/domain/entities/User"
import type { ChangePasswordRequest, LoginRequest } from "@/domain/requests/AuthRequest"

export interface AuthRepository {
  login(payload: LoginRequest): Promise<User>
  changePassword(payload: ChangePasswordRequest): Promise<void>
  logout(): Promise<void>
}
