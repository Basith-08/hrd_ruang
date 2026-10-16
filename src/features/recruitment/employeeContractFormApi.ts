import { callBackendApi } from '@/infrastructure/http/backendApi'
import type {
  EmployeeContractFormPayload,
  EmployeeContractFormRecord,
} from '@/features/recruitment/types/EmployeeContractForm.type'

type EmployeeContractFormListResponse = {
  employee_contract_forms?: EmployeeContractFormRecord[]
}

type EmployeeContractFormDetailResponse = {
  employee_contract_form?: EmployeeContractFormRecord | null
}

type EmployeeContractFormApprovalUsersResponse = {
  approval_users?: Array<{
    id: string
    full_name: string | null
    main_position?: string | null
  }>
}

const employeeContractFormBasePath = '/recruitment/employee-contract-forms'
let employeeContractFormApprovalUsersCache: EmployeeContractFormApprovalUsersResponse['approval_users'] | null = null

export async function getEmployeeContractForms() {
  const payload = await callBackendApi<EmployeeContractFormListResponse>(employeeContractFormBasePath)
  return Array.isArray(payload.employee_contract_forms) ? payload.employee_contract_forms : []
}

export async function getEmployeeContractFormById(id: string) {
  const payload = await callBackendApi<EmployeeContractFormDetailResponse>(
    `${employeeContractFormBasePath}/${encodeURIComponent(id)}`,
  )
  return payload.employee_contract_form ?? null
}

export async function createEmployeeContractForm(payload: EmployeeContractFormPayload) {
  const response = await callBackendApi<EmployeeContractFormDetailResponse>(employeeContractFormBasePath, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.employee_contract_form ?? null
}

export async function updateEmployeeContractForm(id: string, payload: EmployeeContractFormPayload) {
  const response = await callBackendApi<EmployeeContractFormDetailResponse>(
    `${employeeContractFormBasePath}/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  )
  return response.employee_contract_form ?? null
}

export async function deleteEmployeeContractForm(id: string) {
  await callBackendApi(`${employeeContractFormBasePath}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function getEmployeeContractFormApprovalUsers(employeeRequestFormId: string) {
  if (employeeContractFormApprovalUsersCache) {
    return employeeContractFormApprovalUsersCache
  }

  const payload = await callBackendApi<EmployeeContractFormApprovalUsersResponse>(
    `${employeeContractFormBasePath}/approval-users/${encodeURIComponent(employeeRequestFormId)}`,
  )
  employeeContractFormApprovalUsersCache = Array.isArray(payload.approval_users) ? payload.approval_users : []
  return employeeContractFormApprovalUsersCache
}
