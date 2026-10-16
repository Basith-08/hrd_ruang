import type { UserRole } from '@/domain/entities/User'

export interface UserHistoryEntry {
  id: string
  account_source?: 'internal' | 'candidate_service'
  email: string | null
  username: string | null
  full_name: string | null
  role: UserRole | null
  main_position: string | null
  created_at: string | null
  activated_at?: string | null
  is_active: boolean | null
}
