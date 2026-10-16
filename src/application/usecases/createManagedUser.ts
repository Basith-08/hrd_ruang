import type { ManagedUser } from "@/domain/entities/ManagedUser"
import type { CreateUserRequest } from "@/domain/requests/ManagedUserRequest"
import type { UserManagementRepository } from "@/domain/repositories/UserManagementRepository"

export function createManagedUser(
  repo: UserManagementRepository,
  data: CreateUserRequest,
): Promise<ManagedUser> {
  return repo.createUser(data)
}
