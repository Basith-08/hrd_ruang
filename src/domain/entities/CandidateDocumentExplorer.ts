export interface CandidateDocumentExplorerDocument {
  key: string
  label: string
  bucket: string
  files: string[]
  storage_source?: 'dashboard' | 'candidate_service' | null
}

export interface CandidateDocumentExplorerItem {
  id: string
  storage_source?: 'dashboard' | 'candidate_service' | null
  role?: 'candidate' | 'employee' | null
  candidate_id: string | null
  candidate_name: string
  candidate_email: string | null
  personal_email: string | null
  phone_number: string | null
  photograph: string | null
  pt_name: string | null
  department_name: string | null
  designation_name: string | null
  main_position: string | null
  created_at: string | null
  updated_at: string | null
  documents: CandidateDocumentExplorerDocument[]
}
