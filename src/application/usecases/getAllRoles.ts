import type { Role } from "@/domain/entities/Role"
import type { RoleRepository } from "@/domain/repositories/RoleRepository"

export function getAllRoles(repo: RoleRepository): Promise<Role[]> {
  return repo.getAllRoles()
}
