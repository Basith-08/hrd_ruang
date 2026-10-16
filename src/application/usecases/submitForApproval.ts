import type { ApprovalChain } from "@/domain/entities/ApprovalChain"
import type { SubmitApprovalRequest } from "@/domain/requests/ApprovalRequest"
import type { ApprovalRepository } from "@/domain/repositories/ApprovalRepository"

export function submitForApproval(
  repo: ApprovalRepository,
  data: SubmitApprovalRequest,
): Promise<ApprovalChain> {
  return repo.submitForApproval(data)
}
