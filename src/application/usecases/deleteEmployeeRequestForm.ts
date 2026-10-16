import type { EmployeeRequestFormRepository } from "@/domain/repositories/EmployeeRequestFormRepository"

export function deleteEmployeeRequestForm(repo: EmployeeRequestFormRepository, id: string): Promise<void> {
  return repo.delete(id)
}
