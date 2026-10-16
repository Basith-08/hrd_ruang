import type { EmployeeRequestFormRepository } from "@/domain/repositories/EmployeeRequestFormRepository"

export async function closeEmployeeRequestForm(
  repo: EmployeeRequestFormRepository,
  id: string,
  category: 'canceled' | 'done' | 'employee hired',
  reason: string,
): Promise<void> {
  return repo.close(id, category, reason)
}
