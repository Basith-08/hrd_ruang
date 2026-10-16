import type { UserManagementRepository } from '@/domain/repositories/UserManagementRepository'

export function setManagedUserActiveStatus(
  repo: UserManagementRepository,
  userId: string,
  isActive: boolean,
): Promise<void> {
  return repo.setUserActiveStatus(userId, isActive)
}
