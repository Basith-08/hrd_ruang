import { describe, it, expect, vi } from 'vitest'

import type { RoleRepository } from '@/domain/repositories/RoleRepository'
import { getAllRoles } from '../getAllRoles'
import { getAllPermissions } from '../getAllPermissions'
import { createRole } from '../createRole'
import { updateRolePermissions } from '../updateRolePermissions'
import { deleteRole } from '../deleteRole'

describe('Role Use Cases', () => {
  const mockRepo = {
    getAllRoles: vi.fn(),
    getAllPermissions: vi.fn(),
    createRole: vi.fn(),
    updateRolePermissions: vi.fn(),
    deleteRole: vi.fn(),
  } as unknown as RoleRepository

  it('getAllRoles calls repo.getAllRoles', async () => {
    mockRepo.getAllRoles = vi.fn().mockResolvedValue([{ id: 'r1' }])
    const result = await getAllRoles(mockRepo)
    expect(mockRepo.getAllRoles).toHaveBeenCalled()
    expect(result[0]?.id).toBe('r1')
  })

  it('getAllPermissions calls repo.getAllPermissions', async () => {
    mockRepo.getAllPermissions = vi.fn().mockResolvedValue([{ id: 'p1' }])
    const result = await getAllPermissions(mockRepo)
    expect(mockRepo.getAllPermissions).toHaveBeenCalled()
    expect(result[0]?.id).toBe('p1')
  })

  it('createRole calls repo.createRole', async () => {
    mockRepo.createRole = vi.fn().mockResolvedValue({ id: 'r1', name: 'Admin' })
    const result = await createRole(mockRepo, 'Admin', 'Admin role')
    expect(mockRepo.createRole).toHaveBeenCalledWith('Admin', 'Admin role')
    expect(result.id).toBe('r1')
  })

  it('updateRolePermissions calls repo.updateRolePermissions', async () => {
    const input = { role_id: 'r1', permission_ids: ['p1', 'p2'] }
    mockRepo.updateRolePermissions = vi.fn().mockResolvedValue(undefined)
    await updateRolePermissions(mockRepo, input)
    expect(mockRepo.updateRolePermissions).toHaveBeenCalledWith(input)
  })

  it('deleteRole calls repo.deleteRole', async () => {
    mockRepo.deleteRole = vi.fn().mockResolvedValue(undefined)
    await deleteRole(mockRepo, 'r1')
    expect(mockRepo.deleteRole).toHaveBeenCalledWith('r1')
  })
})
