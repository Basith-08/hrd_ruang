import type { UserManagementRepository } from "@/domain/repositories/UserManagementRepository"

export function deleteManagedUser(
  repo: UserManagementRepository,
  userId: string,
): Promise<void> {
  return repo.deleteUser(userId)
}
