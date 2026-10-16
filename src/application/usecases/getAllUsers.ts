import type { ManagedUser } from "@/domain/entities/ManagedUser"
import type {
  UserManagementRepository,
  UserManagementScope,
} from "@/domain/repositories/UserManagementRepository"

export function getAllUsers(
  repo: UserManagementRepository,
  scope?: UserManagementScope,
): Promise<ManagedUser[]> {
  return repo.getAllUsers(scope)
}
