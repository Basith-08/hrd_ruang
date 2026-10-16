import { describe, it, expect, vi } from 'vitest'
import type { UserManagementRepository } from '@/domain/repositories/UserManagementRepository'
import { getAllUsers } from '../getAllUsers'
import { createManagedUser } from '../createManagedUser'
import { deleteManagedUser } from '../deleteManagedUser'
import { updateManagedUserRole } from '../updateManagedUserRole'
import { updateManagedUser } from '../updateManagedUser'

describe('UserManagement Use Cases', () => {
  const mockRepo = {
    getAllUsers: vi.fn(),
    getRoles: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    updateUserRole: vi.fn(),
  } as unknown as UserManagementRepository

  it('getAllUsers calls repo.getAllUsers', async () => {
    mockRepo.getAllUsers = vi.fn().mockResolvedValue([{ id: '1' }])
    const result = await getAllUsers(mockRepo)
    expect(mockRepo.getAllUsers).toHaveBeenCalled()
    expect(result[0]?.id).toBe('1')
  })

  it('createManagedUser calls repo.createUser', async () => {
    const data = { email: 'test@hrd.com', password: 'pass', role_id: 'r1' }
    mockRepo.createUser = vi.fn().mockResolvedValue({ id: 'u1', email: 'test@hrd.com' })
    const result = await createManagedUser(mockRepo, data as any)
    expect(mockRepo.createUser).toHaveBeenCalledWith(data)
    expect(result.id).toBe('u1')
  })

  it('updateManagedUserRole calls repo.updateUserRole', async () => {
    mockRepo.updateUserRole = vi.fn().mockResolvedValue(undefined)
    await updateManagedUserRole(mockRepo, 'u1', 'r2')
    expect(mockRepo.updateUserRole).toHaveBeenCalledWith('u1', 'r2')
  })

  it('updateManagedUser calls repo.updateUser', async () => {
    const data = {
      email: 'edit@hrd.com',
      username: 'editor',
      first_name: 'Edit',
      middle_name: '',
      last_name: 'User',
      main_position: 'Engineer',
      hire_location: 'Jakarta',
      date_of_birth: '1998-01-01',
      place_of_birth: 'Jakarta',
      nationality: 'Indonesian',
      marital_status: 'Single',
      religion: 'Islam',
      gender: 'Male',
      ethnic: 'Javanese',
      blood_type: 'O',
      no_id: '1234567890',
      role_id: 'r2',
    }
    mockRepo.updateUser = vi.fn().mockResolvedValue({ id: 'u1', email: 'edit@hrd.com' })
    const result = await updateManagedUser(mockRepo, 'u1', data as any)
    expect(mockRepo.updateUser).toHaveBeenCalledWith('u1', data)
    expect(result.id).toBe('u1')
  })

  it('deleteManagedUser calls repo.deleteUser', async () => {
    mockRepo.deleteUser = vi.fn().mockResolvedValue(undefined)
    await deleteManagedUser(mockRepo, 'u1')
    expect(mockRepo.deleteUser).toHaveBeenCalledWith('u1')
  })
})
