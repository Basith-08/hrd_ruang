import type { RecruitmentTracking } from "@/domain/entities/RecruitmentTracking"
import type { RecruitmentTrackingRepository } from "@/domain/repositories/RecruitmentTrackingRepository"

export function getRecruitmentTrackings(repo: RecruitmentTrackingRepository): Promise<RecruitmentTracking[]> {
  return repo.getAll()
}
