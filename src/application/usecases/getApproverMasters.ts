import type { ApproverMaster } from "@/domain/entities/ApprovalChain"
import type { ApprovalRepository } from "@/domain/repositories/ApprovalRepository"

export function getApproverMasters(repo: ApprovalRepository): Promise<ApproverMaster[]> {
  return repo.getAllApproverMasters()
}
