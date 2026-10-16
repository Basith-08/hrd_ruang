export type TrackingStageState = 'completed' | 'current' | 'upcoming' | 'rejected'

export interface ApprovalTrackingSelectOption {
  value: string | null
  label: string
}

export interface TrackingStage {
  key: string
  order: number
  label: string
  actor: string | null
  note: string | null
  date: string | null
  state: TrackingStageState
  stepId: string | null
}

export type ErfAttachmentFieldKey = 'organizational_structure' | 'job_description'

export interface ErfAttachmentPreviewItem {
  path: string
  name: string
  url: string
}

export interface ApprovalTrackingDetailField {
  key?: string
  label: string
  value: string
}

export interface ApprovalTrackingAttachmentSection {
  key: ErfAttachmentFieldKey
  label: string
  items: ErfAttachmentPreviewItem[]
}

export interface ApprovalTrackingNotice {
  text: string
  className: string
}

export type ApprovalTrackingSortKey = 'position' | 'site' | 'submitted' | 'approvalStatus'

export interface ApprovalTrackingColumn {
  key: string
  label: string
  class: string
  sortable?: boolean
  sortableKey?: ApprovalTrackingSortKey
}
