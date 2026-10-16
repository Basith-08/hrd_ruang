import type { ApprovalChain } from "@/domain/entities/ApprovalChain"
import type { ApprovalRepository } from "@/domain/repositories/ApprovalRepository"

export function getApprovalChains(repo: ApprovalRepository): Promise<ApprovalChain[]> {
  return repo.getChainsByUser()
}
