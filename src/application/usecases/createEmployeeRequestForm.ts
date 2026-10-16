import type { EmployeeRequestFormRequest } from '@/domain/requests/EmployeeRequestFormRequest'
import type {
  EmployeeRequestFormMutationOptions,
  EmployeeRequestFormRepository,
} from '@/domain/repositories/EmployeeRequestFormRepository'

export function createEmployeeRequestForm(
  repo: EmployeeRequestFormRepository,
  payload: EmployeeRequestFormRequest,
  options?: EmployeeRequestFormMutationOptions,
) {
  return options === undefined ? repo.create(payload) : repo.create(payload, options)
}
