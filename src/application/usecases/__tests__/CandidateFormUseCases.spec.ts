import { describe, it, expect, vi } from 'vitest'
import type { CandidateFormRepository } from '@/domain/repositories/CandidateFormRepository'
import { getCandidateForms } from '../getCandidateForms'
import { updateCandidateForm } from '../updateCandidateForm'
import { deleteCandidateForm } from '../deleteCandidateForm'
import { createCandidateForm } from '../createCandidateForm'

describe('Candidate Form Use Cases', () => {
  const mockRepo = {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as CandidateFormRepository

  it('getCandidateForms calls repo.getAll', async () => {
    mockRepo.getAll = vi.fn().mockResolvedValue([{ id: '1' }])
    const result = await getCandidateForms(mockRepo)
    expect(mockRepo.getAll).toHaveBeenCalled()
    expect(result[0]?.id).toBe('1')
  })

  it('createCandidateForm calls repo.create', async () => {
    const data = { fullname: 'John Doe' } as any
    mockRepo.create = vi.fn().mockResolvedValue({ id: '1', ...data })
    const result = await createCandidateForm(mockRepo, data)
    expect(mockRepo.create).toHaveBeenCalledWith(data)
    expect(result.id).toBe('1')
  })

  it('updateCandidateForm calls repo.update', async () => {
    const data = { notes: 'Good' } as any
    mockRepo.update = vi.fn().mockResolvedValue({ id: '1', ...data })
    const result = await updateCandidateForm(mockRepo, '1', data)
    expect(mockRepo.update).toHaveBeenCalledWith('1', data)
    expect(result.id).toBe('1')
  })

  it('deleteCandidateForm calls repo.delete', async () => {
    mockRepo.delete = vi.fn().mockResolvedValue(undefined)
    await deleteCandidateForm(mockRepo, '1')
    expect(mockRepo.delete).toHaveBeenCalledWith('1')
  })
})
