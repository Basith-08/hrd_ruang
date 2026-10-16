export interface ApprovalTrackingPageFilterState {
  searchQuery: string
  statusFilter: string
  selectedChainId: string
  selectedStepId: string
  page: number
}

export type ApprovalTrackingNotesState = Record<string, string>
export type ApprovalTrackingExpandedState = Record<string, boolean>

export function createApprovalTrackingPageFilterState(): ApprovalTrackingPageFilterState {
  return {
    searchQuery: '',
    statusFilter: '',
    selectedChainId: '',
    selectedStepId: '',
    page: 1,
  }
}
