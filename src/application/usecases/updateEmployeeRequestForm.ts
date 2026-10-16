import type { EmployeeRequestForm } from '@/domain/entities/EmployeeRequestForm'
import type { EmployeeRequestFormRequest } from '@/domain/requests/EmployeeRequestFormRequest'
import type {
  EmployeeRequestFormMutationOptions,
  EmployeeRequestFormRepository,
} from '@/domain/repositories/EmployeeRequestFormRepository'

export function updateEmployeeRequestForm(
  repo: EmployeeRequestFormRepository,
  id: string,
  payload: EmployeeRequestFormRequest,
  options?: EmployeeRequestFormMutationOptions,
): Promise<EmployeeRequestForm> {
  return options === undefined ? repo.update(id, payload) : repo.update(id, payload, options)
}
