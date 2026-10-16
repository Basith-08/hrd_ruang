export interface CandidateFormListFilterState {
  searchQuery: string
  completionStatusFilter: string
  employeeRequestFormFilter: string
  page: number
}

export function createCandidateFormListFilterState(): CandidateFormListFilterState {
  return {
    searchQuery: '',
    completionStatusFilter: '',
    employeeRequestFormFilter: '',
    page: 1,
  }
}
