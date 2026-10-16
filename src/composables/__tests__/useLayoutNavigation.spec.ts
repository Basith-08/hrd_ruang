import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resetNuxtNavigationMocks, setNuxtRouteMock } from '../../../test-utils/nuxt-imports-stub'
import { useLayoutNavigation } from '../useLayoutNavigation'

const hasAnyPermissionMock = vi.fn(() => true)
const hasPermissionMock = vi.fn((_permission: string) => true)

vi.mock('@/composables/useLocale', () => ({
  useLocale: () => ({
    text: (key: string) => key,
  }),
}))

vi.mock('@/viewmodels/useAuthViewModel', () => ({
  useAuthViewModel: () => ({
    userRole: { value: 'super_admin' },
    hasAnyPermission: hasAnyPermissionMock,
    hasPermission: hasPermissionMock,
  }),
}))

describe('useLayoutNavigation', () => {
  beforeEach(() => {
    resetNuxtNavigationMocks()
    hasAnyPermissionMock.mockReturnValue(true)
    hasPermissionMock.mockReturnValue(true)
  })

  it('maps candidate account create route to candidate employees navigation context', () => {
    setNuxtRouteMock({
      path: '/user-management/create',
      fullPath: '/user-management/create?type=candidate&scope=candidateEmployee',
      query: {
        type: 'candidate',
        scope: 'candidateEmployee',
      },
    })

    const { isActiveRoute, pageTitle } = useLayoutNavigation()

    expect(isActiveRoute('/candidate-employees')).toBe(true)
    expect(isActiveRoute('/user-management')).toBe(false)
    expect(pageTitle.value).toBe('page.candidateEmployees')
  })

  it('maps scoped edit route to candidate employees navigation context', () => {
    setNuxtRouteMock({
      path: '/user-management/managed-2/edit',
      fullPath: '/user-management/managed-2/edit?scope=candidateEmployee',
      params: {
        id: 'managed-2',
      },
      query: {
        scope: 'candidateEmployee',
      },
    })

    const { isActiveRoute } = useLayoutNavigation()

    expect(isActiveRoute('/candidate-employees')).toBe(true)
    expect(isActiveRoute('/user-management')).toBe(false)
  })

  it('keeps generic user management create route under user management', () => {
    setNuxtRouteMock({
      path: '/user-management/create',
      fullPath: '/user-management/create',
    })

    const { isActiveRoute, pageTitle } = useLayoutNavigation()

    expect(isActiveRoute('/user-management')).toBe(true)
    expect(isActiveRoute('/candidate-employees')).toBe(false)
    expect(pageTitle.value).toBe('page.userManagement')
  })

  it('places document export directly below new employee contract forms', () => {
    setNuxtRouteMock({
      path: '/dashboard',
      fullPath: '/dashboard',
    })

    const { filteredNavigationSections } = useLayoutNavigation()
    const recruitmentSection = filteredNavigationSections.value.find(
      (section) => section.id === 'recruitmentProcess',
    )

    expect(recruitmentSection?.items.map((item) => item.to)).toContain('/configuration-export')

    const itemPaths = recruitmentSection?.items.map((item) => item.to) ?? []
    const necfIndex = itemPaths.indexOf('/recruitment/new-employee-contract-forms')
    const documentExportIndex = itemPaths.indexOf('/configuration-export')

    expect(necfIndex).toBeGreaterThanOrEqual(0)
    expect(documentExportIndex).toBe(necfIndex + 1)
  })

  it('shows user history in navigation', () => {
    setNuxtRouteMock({
      path: '/dashboard',
      fullPath: '/dashboard',
    })

    const { filteredNavigationSections } = useLayoutNavigation()
    const allItems = filteredNavigationSections.value.flatMap((section) =>
      section.items.map((item) => item.to),
    )

    expect(allItems).toContain('/user-history')
  })

  it('uses a single interview evaluations entry point for readers', () => {
    setNuxtRouteMock({
      path: '/interview-evaluations',
      fullPath: '/interview-evaluations',
    })

    hasPermissionMock.mockImplementation(
      (permission: string) => permission === 'interview_evaluation:read',
    )

    const { filteredNavigationSections, pageTitle } = useLayoutNavigation()
    const recruitmentSection = filteredNavigationSections.value.find(
      (section) => section.id === 'recruitmentProcess',
    )
    const interviewItems =
      recruitmentSection?.items.filter((item) => item.to === '/interview-evaluations') ?? []

    expect(interviewItems).toHaveLength(1)
    expect(interviewItems[0]?.labelKey).toBe('layout.nav.items.assessmentList')
    expect(pageTitle.value).toBe('page.interviewEvaluation')
  })

  it('keeps interviewer label for interviewer-only access', () => {
    setNuxtRouteMock({
      path: '/interview-evaluations',
      fullPath: '/interview-evaluations',
    })

    hasPermissionMock.mockReturnValue(false)

    const { filteredNavigationSections, pageTitle } = useLayoutNavigation()
    const recruitmentSection = filteredNavigationSections.value.find(
      (section) => section.id === 'recruitmentProcess',
    )
    const interviewItems =
      recruitmentSection?.items.filter((item) => item.to === '/interview-evaluations') ?? []

    expect(interviewItems).toHaveLength(1)
    expect(interviewItems[0]?.labelKey).toBe('layout.nav.items.interviewerForm')
    expect(pageTitle.value).toBe('page.interviewerForm')
  })
})
