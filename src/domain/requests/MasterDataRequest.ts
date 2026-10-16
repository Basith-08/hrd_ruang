export interface MasterDataRequest {
  name: string
  address?: string | null
  description?: string | null
  parent_id?: string | null
  required_date_min_months?: number | null
}
