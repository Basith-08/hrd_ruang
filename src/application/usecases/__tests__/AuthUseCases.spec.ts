import { describe, it, expect, vi } from 'vitest'
import type { AuthRepository } from '@/domain/repositories/AuthRepository'
import { changePasswordUser } from '../changePasswordUser'
import { loginUser } from '../loginUser'
import { logoutUser } from '../logoutUser'

describe('Auth Use Cases', () => {
  const mockRepo = {
    changePassword: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  } as unknown as AuthRepository

  it('loginUser calls repo.login', async () => {
    const payload = { identifier: 'admin@hrd.com', password: 'password' }
    mockRepo.login = vi.fn().mockResolvedValue({ id: 'u1', email: 'admin@hrd.com' })
    const result = await loginUser(mockRepo, payload)
    expect(mockRepo.login).toHaveBeenCalledWith(payload)
    expect(result.id).toBe('u1')
  })

  it('logoutUser calls repo.logout', async () => {
    mockRepo.logout = vi.fn().mockResolvedValue(undefined)
    await logoutUser(mockRepo)
    expect(mockRepo.logout).toHaveBeenCalled()
  })

  it('changePasswordUser calls repo.changePassword', async () => {
    const payload = { currentPassword: 'current123', newPassword: 'new12345' }
    mockRepo.changePassword = vi.fn().mockResolvedValue(undefined)
    await changePasswordUser(mockRepo, payload)
    expect(mockRepo.changePassword).toHaveBeenCalledWith(payload)
  })
})
