import type { RecruitmentTracking } from "@/domain/entities/RecruitmentTracking"

export interface RecruitmentTrackingRepository {
  getAll(): Promise<RecruitmentTracking[]>
  getById(id: string): Promise<RecruitmentTracking | null>
}
