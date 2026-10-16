import type { UserManagementRepository } from "@/domain/repositories/UserManagementRepository"

export function updateManagedUserRole(
  repo: UserManagementRepository,
  userId: string,
  roleId: string,
): Promise<void> {
  return repo.updateUserRole(userId, roleId)
}
