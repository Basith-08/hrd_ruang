import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import {
  resetNuxtNavigationMocks,
  setNuxtRouteMock,
  setNuxtRouterMock,
} from '../../../../test-utils/nuxt-imports-stub'

const routeState = {
  query: {} as Record<string, string>,
}

const routerPushMock = vi.fn()
const toastSuccessMock = vi.fn()
const toastErrorMock = vi.fn()
const loginMock = vi.fn()

const errorRef = ref('')
const isLoadingRef = ref(false)
const loginResult = {
  id: 'user-1',
  role: 'super_admin',
}

vi.mock('@/presentation/components/feedback/useAppToast', () => ({
  useAppToast: () => ({
    success: toastSuccessMock,
    error: toastErrorMock,
  }),
}))

vi.mock('@/viewmodels/useAuthViewModel', () => ({
  useAuthViewModel: () => ({
    error: errorRef,
    isLoading: isLoadingRef,
    login: loginMock,
  }),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetNuxtNavigationMocks()
    routeState.query = {}
    setNuxtRouteMock({ query: routeState.query })
    setNuxtRouterMock({ push: routerPushMock })
    errorRef.value = ''
    isLoadingRef.value = false
    loginResult.role = 'super_admin'
    loginMock.mockResolvedValue(loginResult)
  })

  it('shows validation messages and blocks submit for invalid credentials', async () => {
    const { default: LoginPage } = await import('../LoginPage.vue')
    const wrapper = mount(LoginPage)

    await wrapper.get('input#identifier').setValue('ab')
    await wrapper.get('input#password').setValue('short')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(loginMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Email or username is required.')
    expect(wrapper.text()).toContain('Password must be at least 8 characters.')
  })

  it('toggles the password field visibility', async () => {
    const { default: LoginPage } = await import('../LoginPage.vue')
    const wrapper = mount(LoginPage)
    const passwordInput = wrapper.get('input#password')
    const toggleButton = wrapper
      .findAll('button')
      .find((button) => button.attributes('aria-label') === 'Show password')

    expect((passwordInput.element as HTMLInputElement).type).toBe('password')

    await toggleButton!.trigger('click')
    await flushPromises()
    expect((passwordInput.element as HTMLInputElement).type).toBe('text')

    const hideButton = wrapper
      .findAll('button')
      .find((button) => button.attributes('aria-label') === 'Hide password')

    await hideButton!.trigger('click')
    await flushPromises()
    expect((passwordInput.element as HTMLInputElement).type).toBe('password')
  })

  it('submits trimmed credentials, shows success toast, and redirects to the requested path', async () => {
    routeState.query = {
      redirect: '/approvals',
    }
    setNuxtRouteMock({ query: routeState.query })

    const { default: LoginPage } = await import('../LoginPage.vue')
    const wrapper = mount(LoginPage)

    await wrapper.get('input#identifier').setValue('  john@example.com  ')
    await wrapper.get('input#password').setValue('password123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(loginMock).toHaveBeenCalledWith({
      identifier: 'john@example.com',
      password: 'password123',
    })
    expect(toastSuccessMock).toHaveBeenCalledWith('Signed in successfully.')
    expect(routerPushMock).toHaveBeenCalledWith('/approvals')
  })

  it('falls back to the dashboard route after a successful login without redirect', async () => {
    const { default: LoginPage } = await import('../LoginPage.vue')
    const wrapper = mount(LoginPage)

    await wrapper.get('input#identifier').setValue('john@example.com')
    await wrapper.get('input#password').setValue('password123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(routerPushMock).toHaveBeenCalledWith('/dashboard')
  })

  it('redirects candidate users to candidate forms after a successful login without redirect', async () => {
    loginResult.role = 'candidate'

    const { default: LoginPage } = await import('../LoginPage.vue')
    const wrapper = mount(LoginPage)

    await wrapper.get('input#identifier').setValue('candidate@example.com')
    await wrapper.get('input#password').setValue('password123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(routerPushMock).toHaveBeenCalledWith('/candidate-forms')
  })

  it('ignores external redirect targets and falls back to role-based home', async () => {
    routeState.query = {
      redirect: 'https://evil.example',
    }
    setNuxtRouteMock({ query: routeState.query })

    const { default: LoginPage } = await import('../LoginPage.vue')
    const wrapper = mount(LoginPage)

    await wrapper.get('input#identifier').setValue('john@example.com')
    await wrapper.get('input#password').setValue('password123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(routerPushMock).toHaveBeenCalledWith('/dashboard')
  })

  it('shows the thrown login error and does not navigate', async () => {
    loginMock.mockRejectedValue(new Error('Invalid username or password'))

    const { default: LoginPage } = await import('../LoginPage.vue')
    const wrapper = mount(LoginPage)

    await wrapper.get('input#identifier').setValue('john@example.com')
    await wrapper.get('input#password').setValue('password123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(toastErrorMock).toHaveBeenCalledWith('Invalid username or password')
    expect(routerPushMock).not.toHaveBeenCalled()
  })
})
