
import type { UpdateRolePermissionsRequest } from "@/domain/requests/RoleRequest"
import type { RoleRepository } from "@/domain/repositories/RoleRepository"

export function updateRolePermissions(
  repo: RoleRepository,
  input: UpdateRolePermissionsRequest,
): Promise<void> {
  return repo.updateRolePermissions(input)
}
