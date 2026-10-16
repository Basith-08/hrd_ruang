export type MasterDataType = 'pt' | 'bu' | 'department' | 'job_level' | 'designation'

export interface MasterDataItem {
  id: string
  name: string
  address?: string | null
  description: string | null
  required_date_min_months?: number | null
  created_at: string | null
  updated_at: string | null
  parent_id?: string | null
  parent_name?: string | null
}

export function formatMasterDataOptionLabel(type: MasterDataType, item: MasterDataItem): string {
  if (type === 'designation') {
    return item.name.trim()
  }

  return item.name
}
