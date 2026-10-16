import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

const userRef = ref({
  id: 'user-1',
  full_name: 'John Doe',
  username: 'johndoe',
  email: 'john@example.com',
  phone: '08123',
})
const userRoleRef = ref('super_admin')
const changePasswordMock = vi.fn()
const toastSuccessMock = vi.fn()
const toastErrorMock = vi.fn()

vi.mock('@/viewmodels/useAuthViewModel', () => ({
  useAuthViewModel: () => ({
    changePassword: changePasswordMock,
    user: userRef,
    userRole: userRoleRef,
  }),
}))

vi.mock('@/presentation/components/feedback/useAppToast', () => ({
  useAppToast: () => ({
    success: toastSuccessMock,
    error: toastErrorMock,
  }),
}))

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the current user details and role badge', async () => {
    const { default: ProfilePage } = await import('../ProfilePage.vue')
    const wrapper = mount(ProfilePage)

    expect(wrapper.text()).toContain('User Profile')
    expect(wrapper.text()).toContain('super_admin')
    expect(wrapper.text()).toContain('user-1')
    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('johndoe')
    expect(wrapper.text()).toContain('john@example.com')
    expect(wrapper.text()).toContain('08123')
    expect(wrapper.text()).toContain('Change Password')
  })

  it('validates the password form before submit', async () => {
    const { default: ProfilePage } = await import('../ProfilePage.vue')
    const wrapper = mount(ProfilePage)

    await wrapper.get('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Current password is required.')
    expect(wrapper.text()).toContain('New password is required.')
    expect(wrapper.text()).toContain('Password confirmation is required.')
    expect(changePasswordMock).not.toHaveBeenCalled()
  })

  it('submits a valid password change request', async () => {
    changePasswordMock.mockResolvedValue(undefined)
    const { default: ProfilePage } = await import('../ProfilePage.vue')
    const wrapper = mount(ProfilePage)

    const passwordInputs = wrapper.findAll('input[type="password"]')
    await passwordInputs[0]!.setValue('current123')
    await passwordInputs[1]!.setValue('newsecret')
    await passwordInputs[2]!.setValue('newsecret')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(changePasswordMock).toHaveBeenCalledWith({
      currentPassword: 'current123',
      newPassword: 'newsecret',
    })
    expect(toastSuccessMock).toHaveBeenCalledWith('Password updated successfully.')
  })
})
