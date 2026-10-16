import type { EmployeeRequestForm } from "@/domain/entities/EmployeeRequestForm"
import type { EmployeeRequestFormRequest } from "@/domain/requests/EmployeeRequestFormRequest"

export type EmployeeRequestFormGetByIdOptions = {
  includeSupplementaryData?: boolean
}

export type EmployeeRequestFormMutationOptions = {
  reloadRecord?: boolean
}

export interface EmployeeRequestFormRepository {
  getAll(): Promise<EmployeeRequestForm[]>
  getById(id: string, options?: EmployeeRequestFormGetByIdOptions): Promise<EmployeeRequestForm | null>
  create(data: EmployeeRequestFormRequest, options?: EmployeeRequestFormMutationOptions): Promise<EmployeeRequestForm>
  update(id: string, data: EmployeeRequestFormRequest, options?: EmployeeRequestFormMutationOptions): Promise<EmployeeRequestForm>
  assignRecruiter(id: string, recruiterUserId: string): Promise<void>
  delete(id: string): Promise<void>
  close(
    id: string,
    category: 'canceled' | 'done' | 'employee hired',
    reason: string,
  ): Promise<void>
}
