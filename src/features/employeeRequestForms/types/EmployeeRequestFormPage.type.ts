export type ErfAttachmentFieldKey = 'organizational_structure' | 'job_description' | 'document_erf'

export interface AttachmentPreviewItem {
  path: string
  name: string
  url: string
}

export interface DirectManagerOption {
  id: string
  label: string
}

export interface EmployeeRequestFormSelectOption {
  value: string | number | null
  label: string
}

export type CustomGroupKey =
  | 'custom_grup_1_id'
  | 'custom_grup_2_id'
  | 'custom_grup_3_id'
  | 'custom_grup_4_id'
  | 'custom_grup_5_id'
  | 'custom_grup_6_id'
