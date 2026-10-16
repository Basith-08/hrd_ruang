import type { ApprovalChain } from "@/domain/entities/ApprovalChain"
import type { ApprovalRepository } from "@/domain/repositories/ApprovalRepository"

export function getChainByEmployeeRequestForm(
  repo: ApprovalRepository,
  employeeRequestFormId: string,
): Promise<ApprovalChain | null> {
  return repo.getChainByEmployeeRequestForm(employeeRequestFormId)
}
