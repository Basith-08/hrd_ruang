import type { MasterDataItem, MasterDataType } from '@/domain/entities/MasterData'

export type MasterDataOptionState = Record<MasterDataType, MasterDataItem[]>

export function createMasterDataOptionState(): MasterDataOptionState {
  return {
    pt: [],
    bu: [],
    department: [],
    job_level: [],
    designation: [],
  }
}
