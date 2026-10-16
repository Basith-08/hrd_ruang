import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

import type { EmployeeRequestForm } from '@/domain/entities/EmployeeRequestForm'

const toastSuccessMock = vi.fn()
const toastErrorMock = vi.fn()
const refreshMock = vi.fn()
const assignRecruiterMock = vi.fn()
const hasAnyPermissionMock = vi.fn()
const profilesEqMock = vi.fn()
const profilesSelectMock = vi.fn()
const userRolesInMock = vi.fn()
const userRolesSelectMock = vi.fn()

const jobsRef = ref<EmployeeRequestForm[]>([])
const loadingRef = ref(false)
const errorRef = ref('')
const savingRef = ref(false)

vi.mock('@/presentation/components/forms/SearchableSelect.vue', () => ({
  default: defineComponent({
    props: ['modelValue', 'options', 'disabled', 'emptyValue'],
    emits: ['update:modelValue'],
    template: `
      <select
        :value="modelValue ?? ''"
        :disabled="disabled"
        @change="$emit('update:modelValue', $event.target.value === '' ? (emptyValue ?? '') : $event.target.value)"
      >
        <option value="">All</option>
        <option
          v-for="option in options"
          :key="String(option.value ?? option.label)"
          :value="option.value ?? ''"
        >
          {{ option.label }}
        </option>
      </select>
    `,
  }),
}))

vi.mock('@/presentation/components/tables/TablePagination.vue', () => ({
  default: defineComponent({
    template: '<div data-testid="pagination">Pagination</div>',
  }),
}))

vi.mock('@/presentation/components/feedback/useAppToast', () => ({
  useAppToast: () => ({
    success: toastSuccessMock,
    error: toastErrorMock,
  }),
}))

vi.mock('@/infrastructure/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'profiles') {
        return { select: profilesSelectMock }
      }

      if (table === 'user_roles') {
        return { select: userRolesSelectMock }
      }

      throw new Error(`Unexpected table: ${table}`)
    },
  },
}))

vi.mock('@/viewmodels/useAuthViewModel', () => ({
  useAuthViewModel: () => ({
    hasAnyPermission: hasAnyPermissionMock,
  }),
}))

vi.mock('@/viewmodels/useEmployeeRequestFormViewModel', () => ({
  useEmployeeRequestFormViewModel: () => ({
    jobs: jobsRef,
    loading: loadingRef,
    error: errorRef,
    saving: savingRef,
    refresh: refreshMock,
    assignRecruiter: assignRecruiterMock,
  }),
}))

function createJob(overrides: Partial<EmployeeRequestForm> = {}): EmployeeRequestForm {
  return {
    id: 'erf-1',
    recruiter_user_id: null,
    recruiter_name: null,
    pt_pembebanan: 'PT One',
    department: 'Engineering',
    business_unit: 'Technology',
    designation: 'Senior',
    employment_status: 'Probation',
    direct_manager: 'Jane Manager',
    approval_director_bu: 'Director BU',
    approval_director_bu_date: '2026-03-10T08:00:00',
    approval_gm_hrd: 'GM HRD',
    approval_gm_hrd_date: '2026-03-11T08:00:00',
    approval_director_hrd: 'Director HRD',
    approval_director_hrd_date: '2026-03-12T08:00:00',
    site: 'Jakarta',
    working_location: 'Jakarta',
    requested_date: '2026-03-01',
    custom_grup_1_id: null,
    custom_grup_2_id: null,
    custom_grup_3_id: null,
    custom_grup_4_id: null,
    custom_grup_5_id: null,
    custom_grup_6_id: null,
    required_date: '2026-04-01',
    position_status: 'Replacement',
    periode_probation: 3,
    main_position: 'Backend Engineer',
    passed_candidate_name: null,
    vacancy_status: 'request',
    recruitment_flow_stage: 'erf_approved',
    organizational_structure: [],
    job_description: [],
    created_by: 'user-1',
    status: 'open',
    closed_date: null,
    closed_category: null,
    reason: null,
    created_at: '2026-03-01T08:00:00',
    updated_at: '2026-03-01T08:00:00',
    ...overrides,
  }
}

describe('PicRecruitmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    hasAnyPermissionMock.mockImplementation((permissions: string[]) =>
      permissions.some((permission) => [
        'pic_recruitment:read',
        'pic_recruitment:update',
      ].includes(permission)),
    )

    jobsRef.value = [
      createJob(),
      createJob({
        id: 'erf-2',
        department: 'Finance',
        business_unit: 'Operations',
        main_position: 'Finance Analyst',
        recruiter_user_id: 'recruiter-2',
        recruiter_name: 'Recruiter Two',
        recruitment_flow_stage: 'assign_recruiter',
      }),
      createJob({
        id: 'erf-3',
        department: 'Marketing',
        main_position: 'Brand Specialist',
        recruitment_flow_stage: 'candidate_sourcing',
        vacancy_status: 'sourcing',
      }),
    ]
    loadingRef.value = false
    errorRef.value = ''
    savingRef.value = false
    refreshMock.mockResolvedValue(undefined)
    assignRecruiterMock.mockResolvedValue(undefined)

    profilesEqMock.mockResolvedValue({
      data: [
        {
          id: 'recruiter-1',
          full_name: 'Recruiter One',
          username: 'recruiter.one',
          email: 'recruiter.one@example.com',
          main_position: 'Senior Recruiter',
        },
      ],
      error: null,
    })
    profilesSelectMock.mockReturnValue({
      eq: profilesEqMock,
    })
    userRolesInMock.mockResolvedValue({
      data: [
        {
          user_id: 'recruiter-1',
          roles: { name: 'recruiter' },
        },
      ],
      error: null,
    })
    userRolesSelectMock.mockReturnValue({
      in: userRolesInMock,
    })
  })

  it('shows only approved ERFs before candidate sourcing and filters unassigned recruiters', async () => {
    const { default: PicRecruitmentPage } = await import('../PicRecruitmentPage.vue')
    const wrapper = mount(PicRecruitmentPage)

    await flushPromises()

    expect(wrapper.text()).toContain('Backend Engineer')
    expect(wrapper.text()).toContain('Finance Analyst')
    expect(wrapper.text()).not.toContain('Brand Specialist')
    expect(wrapper.text()).toContain('5. Assign Recruiter')

    const selects = wrapper.findAll('select')
    await selects[3]!.setValue('unassigned')
    await flushPromises()

    expect(wrapper.text()).toContain('Backend Engineer')
    expect(wrapper.text()).not.toContain('Finance Analyst')
  })

  it('assigns a recruiter from the PIC Recruitment dialog', async () => {
    const { default: PicRecruitmentPage } = await import('../PicRecruitmentPage.vue')
    const wrapper = mount(PicRecruitmentPage)

    await flushPromises()

    const assignButton = wrapper.findAll('button').find((button) => button.text() === 'Assign Recruiter')
    await assignButton!.trigger('click')
    await flushPromises()

    const selects = wrapper.findAll('select')
    await selects[selects.length - 2]!.setValue('erf-1')
    await selects[selects.length - 1]!.setValue('recruiter-1')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(assignRecruiterMock).toHaveBeenCalledWith('erf-1', 'recruiter-1')
    expect(toastSuccessMock).toHaveBeenCalledWith('Recruiter assigned successfully.')
  })

  it('hides assign recruiter button when user only has read permission', async () => {
    hasAnyPermissionMock.mockImplementation((permissions: string[]) =>
      permissions.some((permission) => [
        'pic_recruitment:read',
        'recruitment:pic_recruitment_read',
      ].includes(permission)),
    )

    const { default: PicRecruitmentPage } = await import('../PicRecruitmentPage.vue')
    const wrapper = mount(PicRecruitmentPage)

    await flushPromises()

    expect(wrapper.findAll('button').some((button) => button.text() === 'Assign Recruiter')).toBe(false)
  })
})
