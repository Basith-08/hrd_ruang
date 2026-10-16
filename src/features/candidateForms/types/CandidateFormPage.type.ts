import type { EmployeeDocumentFieldKey } from '@/domain/entities/CandidateForm'
import type {
  CandidateFormRequest,
  EducationHistoryRequest,
  FamilyEmergencyRequest,
  PersonalStatementRequest,
} from '@/domain/requests/CandidateFormRequest'

export type EditableFormSectionKey =
  | 'family_and_emergency'
  | 'education'
  | 'work_history'
  | 'candidate_languages'
  | 'candidate_skills'
  | 'candidate_references'

export type CandidateFormSelectOption<T = string | number | null> = {
  value: T
  label: string
}

export type CandidateFormSimpleFieldType = 'text' | 'email' | 'date' | 'textarea' | 'select'

export type CandidateFormObjectFieldType = CandidateFormSimpleFieldType | 'number'

export interface CandidateFormSimpleFieldConfig<TForm extends object = CandidateFormRequest> {
  key: string
  model: keyof TForm & string
  label: string
  type?: CandidateFormSimpleFieldType
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  helperText?: string
  colSpan?: 1 | 2
  options?: CandidateFormSelectOption[]
  emptyLabel?: string
  emptyValue?: string | number | null
  textareaClassName?: string
}

export interface CandidateFormObjectFieldConfig {
  key: string
  model?: string
  label: string
  type?: CandidateFormObjectFieldType
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  colSpan?: number
  options?: CandidateFormSelectOption[]
  emptyLabel?: string
  emptyValue?: string | number | null
  textareaClassName?: string
  inputClassName?: string
  value?: string | number | null
  min?: number
  step?: number | 'any'
}

export interface CandidateFormRepeatableFieldRow<TItem extends object = object> {
  key: string
  item: TItem
  fields: CandidateFormObjectFieldConfig[]
  rowClass?: string
  fieldsGridClass?: string
  fieldsWrapperClass?: string
  remove?: () => void
}

export interface CandidateFormGroupedFamilySection {
  key: string
  category: FamilyEmergencyRequest['category']
  label: string
  shortLabel: string
  items: Array<{
    item: FamilyEmergencyRequest
    formIndex: number
  }>
}

export interface CandidateFormFormalEducationRow {
  level: string
  label: string
  item: EducationHistoryRequest
}

export interface CandidateFormIndexedEducationRow {
  item: EducationHistoryRequest
  formIndex: number
}

export interface CandidateFormEmployeeDocumentEntry {
  documentType: EmployeeDocumentFieldKey
  label: string
  files: string[]
  editable?: boolean
  selectedFiles?: File[]
}

export interface CandidateFormPersonalStatementFieldConfig {
  key: string
  booleanKey: keyof PersonalStatementRequest & string
  booleanLabel: string
  detailKey?: keyof PersonalStatementRequest & string
  detailLabel?: string
  detailType?: 'text' | 'textarea'
  detailColSpan?: 1 | 2
}
