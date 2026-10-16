import type {
  ApprovalChain,
  ApproverMaster,
} from '@/domain/entities/ApprovalChain'
import type { ApproverMasterRequest, SubmitApprovalRequest } from '@/domain/requests/ApprovalRequest'

export interface ApprovalRepository {
  // Approval Chain
  getChainsByUser(): Promise<ApprovalChain[]>
  getChainByEmployeeRequestForm(employeeRequestFormId: string): Promise<ApprovalChain | null>
  submitForApproval(data: SubmitApprovalRequest): Promise<ApprovalChain>

  approveAssignedStep(stepId: string, notes?: string): Promise<void>
  rejectAssignedStep(stepId: string, notes?: string): Promise<void>

  // Approver Master Data
  getAllApproverMasters(): Promise<ApproverMaster[]>
  createApproverMaster(data: ApproverMasterRequest): Promise<ApproverMaster>
  updateApproverMaster(id: string, data: ApproverMasterRequest): Promise<ApproverMaster>
  deleteApproverMaster(id: string): Promise<void>
}
