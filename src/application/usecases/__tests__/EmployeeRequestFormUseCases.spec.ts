import { describe, it, expect, vi } from 'vitest'
import type { EmployeeRequestFormRepository } from '@/domain/repositories/EmployeeRequestFormRepository'
import { createEmployeeRequestForm } from '../createEmployeeRequestForm'
import { updateEmployeeRequestForm } from '../updateEmployeeRequestForm'
import { deleteEmployeeRequestForm } from '../deleteEmployeeRequestForm'
import { GetEmployeeRequestForms } from '../getEmployeeRequestForms'

describe('EmployeeRequestForm Use Cases', () => {
  const mockRepo = {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as EmployeeRequestFormRepository

  it('createEmployeeRequestForm calls repo.create', async () => {
    const data = { main_position: 'Developer', request_type: 'New' } as any
    mockRepo.create = vi.fn().mockResolvedValue({ id: '1', ...data })
    const result = await createEmployeeRequestForm(mockRepo, data)
    expect(mockRepo.create).toHaveBeenCalledWith(data)
    expect(result.id).toBe('1')
  })

  it('getEmployeeRequestForms calls repo.getAll', async () => {
    mockRepo.getAll = vi.fn().mockResolvedValue([{ id: '1' }])
    const usecase = new GetEmployeeRequestForms(mockRepo)
    const result = await usecase.execute()
    expect(mockRepo.getAll).toHaveBeenCalled()
    expect(result).toHaveLength(1)
  })

  it('updateEmployeeRequestForm calls repo.update', async () => {
    const data = { main_position: 'Senior Developer' } as any
    mockRepo.update = vi.fn().mockResolvedValue({ id: '1', ...data })
    const result = await updateEmployeeRequestForm(mockRepo, '1', data)
    expect(mockRepo.update).toHaveBeenCalledWith('1', data)
    expect(result.main_position).toBe('Senior Developer')
  })

  it('deleteEmployeeRequestForm calls repo.delete', async () => {
    mockRepo.delete = vi.fn().mockResolvedValue(undefined)
    await deleteEmployeeRequestForm(mockRepo, '1')
    expect(mockRepo.delete).toHaveBeenCalledWith('1')
  })
})
