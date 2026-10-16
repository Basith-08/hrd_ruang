import type { EmployeeRequestFormRequest } from '@/domain/requests/EmployeeRequestFormRequest'

import type {
  AttachmentPreviewItem,
  ErfAttachmentFieldKey,
} from '@/features/employeeRequestForms/types/EmployeeRequestFormPage.type'

export type SelectedAttachmentFilesState = Record<ErfAttachmentFieldKey, File[]>
export type AttachmentPreviewLinksState = Record<ErfAttachmentFieldKey, AttachmentPreviewItem[]>

export function createEmployeeRequestFormState(): EmployeeRequestFormRequest {
  return {
    created_by: null,
    pt_pembebanan: '',
    bu_id: null,
    department: '',
    master_designation_id: null,
    designation: '',
    main_position: '',
    employment_status: '',
    approval_director_bu_id: null,
    position_status: '',
    direct_manager: '',
    site: '',
    working_location: '',
    requested_date: '',
    custom_grup_1_id: null,
    custom_grup_2_id: null,
    custom_grup_3_id: null,
    custom_grup_4_id: null,
    custom_grup_5_id: null,
    custom_grup_6_id: null,
    required_date: '',
    periode_probation: 0,
    organizational_structure: [],
    job_description: [],
    document_erf: [],
    status: 'open',
  }
}

export function createSelectedAttachmentFilesState(): SelectedAttachmentFilesState {
  return {
    organizational_structure: [],
    job_description: [],
    document_erf: [],
  }
}

export function createAttachmentPreviewLinksState(): AttachmentPreviewLinksState {
  return {
    organizational_structure: [],
    job_description: [],
    document_erf: [],
  }
}
