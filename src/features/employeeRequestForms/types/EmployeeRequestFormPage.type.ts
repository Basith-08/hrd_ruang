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
