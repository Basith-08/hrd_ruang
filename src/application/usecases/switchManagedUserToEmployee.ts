import type { ManagedUser } from "@/domain/entities/ManagedUser"
import type { UserManagementRepository } from "@/domain/repositories/UserManagementRepository"

export function switchManagedUserToEmployee(
  repo: UserManagementRepository,
  userId: string,
): Promise<ManagedUser> {
  return repo.switchToEmployee(userId)
}
