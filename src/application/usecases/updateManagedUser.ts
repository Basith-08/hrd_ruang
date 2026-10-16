import type { ManagedUser } from '@/domain/entities/ManagedUser'
import type { UpdateUserRequest } from '@/domain/requests/ManagedUserRequest'
import type { UserManagementRepository } from '@/domain/repositories/UserManagementRepository'

export function updateManagedUser(
  repo: UserManagementRepository,
  userId: string,
  data: UpdateUserRequest,
): Promise<ManagedUser> {
  return repo.updateUser(userId, data)
}
