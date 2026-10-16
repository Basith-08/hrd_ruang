export interface EmployeeRequestFormCloseState {
  category: 'canceled' | 'done' | ''
  reason: string
  candidate_id: string
}

export function createEmployeeRequestFormCloseState(): EmployeeRequestFormCloseState {
  return {
    category: 'canceled',
    reason: '',
    candidate_id: '',
  }
}
