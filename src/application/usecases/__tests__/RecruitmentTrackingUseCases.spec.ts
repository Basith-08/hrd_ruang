import { describe, it, expect, vi } from 'vitest'
import type { RecruitmentTrackingRepository } from '@/domain/repositories/RecruitmentTrackingRepository'
import { getRecruitmentTrackings } from '../getRecruitmentTrackings'

describe('RecruitmentTracking Use Cases', () => {
  const mockRepo = {
    getAll: vi.fn(),
  } as unknown as RecruitmentTrackingRepository

  it('getRecruitmentTrackings calls repo.getAll', async () => {
    mockRepo.getAll = vi.fn().mockResolvedValue([{ id: '1' }])
    const result = await getRecruitmentTrackings(mockRepo)
    expect(mockRepo.getAll).toHaveBeenCalled()
    expect(result[0]?.id).toBe('1')
  })
})
