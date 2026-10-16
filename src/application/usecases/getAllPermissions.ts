import type { Permission } from "@/domain/entities/Role"
import type { RoleRepository } from "@/domain/repositories/RoleRepository"

export function getAllPermissions(repo: RoleRepository): Promise<Permission[]> {
  return repo.getAllPermissions()
}
