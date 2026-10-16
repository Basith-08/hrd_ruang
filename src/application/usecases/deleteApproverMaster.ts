import type { ApprovalRepository } from "@/domain/repositories/ApprovalRepository"

export function deleteApproverMaster(repo: ApprovalRepository, id: string): Promise<void> {
  return repo.deleteApproverMaster(id)
}
