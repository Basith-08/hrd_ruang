import type { RoleRepository } from "@/domain/repositories/RoleRepository"

export function deleteRole(repo: RoleRepository, id: string): Promise<void> {
  return repo.deleteRole(id)
}
