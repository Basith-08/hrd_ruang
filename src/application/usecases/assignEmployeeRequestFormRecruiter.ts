import type { EmployeeRequestFormRepository } from '@/domain/repositories/EmployeeRequestFormRepository'

export function assignEmployeeRequestFormRecruiter(
  repo: EmployeeRequestFormRepository,
  id: string,
  recruiterUserId: string,
): Promise<void> {
  return repo.assignRecruiter(id, recruiterUserId)
}
