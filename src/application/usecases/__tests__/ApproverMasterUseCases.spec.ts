import { describe, it, expect, vi } from 'vitest'
import type { ApprovalRepository } from '@/domain/repositories/ApprovalRepository'
import { getApproverMasters } from '../getApproverMasters'
import { createApproverMaster } from '../createApproverMaster'
import { updateApproverMaster } from '../updateApproverMaster'
import { deleteApproverMaster } from '../deleteApproverMaster'

describe('ApproverMaster Use Cases', () => {
  const mockRepo = {
    getAllApproverMasters: vi.fn(),
    createApproverMaster: vi.fn(),
    updateApproverMaster: vi.fn(),
    deleteApproverMaster: vi.fn(),
  } as unknown as ApprovalRepository

  it('getApproverMasters calls repo.getAllApproverMasters', async () => {
    mockRepo.getAllApproverMasters = vi.fn().mockResolvedValue([{ id: '1' }])
    const result = await getApproverMasters(mockRepo)
    expect(mockRepo.getAllApproverMasters).toHaveBeenCalled()
    expect(result[0]?.id).toBe('1')
  })

  it('createApproverMaster calls repo.createApproverMaster', async () => {
    const data = { email: 'approver@hrd.com' } as any
    mockRepo.createApproverMaster = vi.fn().mockResolvedValue({ id: '1', ...data })
    const result = await createApproverMaster(mockRepo, data)
    expect(mockRepo.createApproverMaster).toHaveBeenCalledWith(data)
    expect(result.id).toBe('1')
  })

  it('updateApproverMaster calls repo.updateApproverMaster', async () => {
    const data = { email: 'approver2@hrd.com' } as any
    mockRepo.updateApproverMaster = vi.fn().mockResolvedValue({ id: '1', ...data })
    const result = await updateApproverMaster(mockRepo, '1', data)
    expect(mockRepo.updateApproverMaster).toHaveBeenCalledWith('1', data)
    expect(result.id).toBe('1')
  })

  it('deleteApproverMaster calls repo.deleteApproverMaster', async () => {
    mockRepo.deleteApproverMaster = vi.fn().mockResolvedValue(undefined)
    await deleteApproverMaster(mockRepo, '1')
    expect(mockRepo.deleteApproverMaster).toHaveBeenCalledWith('1')
  })
})
