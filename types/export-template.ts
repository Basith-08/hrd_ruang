export type ExportTemplateRecord = {
  id: string
  name: string
  code: string | null
  description: string | null
  file_name: string
  file_path: string
  storage_bucket: string
  detected_fields: string[]
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type ExportTemplateFieldRecord = {
  id: string
  template_id: string
  field_key: string
  field_label: string | null
  source_type: string
  source_path: string | null
  field_type: string
  is_required: boolean
  is_editable: boolean
  default_value: string | null
  created_at: string
}

export type GeneratedExportRecord = {
  id: string
  template_id: string | null
  candidate_id: string | null
  file_name: string
  file_path: string | null
  payload: Record<string, unknown>
  generated_by: string | null
  created_at: string
}

export type ExportCandidateRecord = {
  id: string
  candidate_name: string
  candidate_address: string
  place_of_birth: string
  date_of_birth: string
  identity_card_number: string
  agreement_date: string
  main_position: string
  job_level: string
  department: string
  cost_center_pt: string
  cost_center_pt_address: string
}

export type PreparedExportField = {
  field_key: string
  field_label: string
  value: string
  status: "auto_filled" | "manual_required" | "manual"
  is_editable: boolean
  is_required: boolean
  field_type: string
  source_path: string | null
}

export type ExportTemplateUploadResponse = {
  template: ExportTemplateRecord
}

export type ExportPrepareResponse = {
  template: Pick<ExportTemplateRecord, "id" | "name">
  candidate: Pick<ExportCandidateRecord, "id" | "candidate_name">
  fields: PreparedExportField[]
}
