import type { ApproverMaster } from "@/domain/entities/ApprovalChain"
import type { ApproverMasterRequest } from "@/domain/requests/ApprovalRequest"
import type { ApprovalRepository } from "@/domain/repositories/ApprovalRepository"

export function createApproverMaster(
  repo: ApprovalRepository,
  data: ApproverMasterRequest,
): Promise<ApproverMaster> {
  return repo.createApproverMaster(data)
}
