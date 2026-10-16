import type { RecruitmentTracking } from '@/domain/entities/RecruitmentTracking'

export interface SummaryColumn {
  key: string
  label: string
}

export type DashboardStatusMode = 'all' | 'open' | 'closed'

export type EnrichedTracking = RecruitmentTracking & {
  departmentLabel: string
  levelKey: string
  levelLabel: string
}

export type DetailSortKey =
  | 'position'
  | 'businessUnit'
  | 'positionStatus'
  | 'department'
  | 'recruiter'
  | 'candidateName'
  | 'employment'
  | 'designation'
  | 'lastApprovalDate'
  | 'statusAgeDays'

export interface DetailRow {
  id: string
  employeeRequestFormId: string
  position: string
  businessUnit: string
  recruiter: string
  candidateName: string
  employment: string
  positionStatus: string
  department: string
  designation: string
  directHead: string
  site: string
  workingLocation: string
  costCenterPt: string
  lastApprovalDate: string
  statusAgeDays: number | null
  closedCategory: string
  closeReason: string
  notes: string
}
