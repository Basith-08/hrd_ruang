import type { UserHistoryEntry } from '@/domain/entities/UserHistory'
import type { UserManagementRepository } from '@/domain/repositories/UserManagementRepository'

export function getUserHistory(repo: UserManagementRepository): Promise<UserHistoryEntry[]> {
  return repo.getUserHistory()
}
