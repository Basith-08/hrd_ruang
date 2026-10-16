import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

import type { EmployeeContractFormRecord } from '@/features/recruitment/types/EmployeeContractForm.type'

const routerPushMock = vi.fn()
const getEmployeeContractFormsMock = vi.fn()
const deleteEmployeeContractFormMock = vi.fn()
const confirmMock = vi.fn()
const toastSuccessMock = vi.fn()
const toastErrorMock = vi.fn()
const hasPermissionMock = vi.fn()

vi.mock('#imports', () => ({
  useRouter: () => ({
    push: routerPushMock,
  }),
}))

vi.mock('@/features/recruitment/employeeContractFormApi', () => ({
  getEmployeeContractForms: getEmployeeContractFormsMock,
  deleteEmployeeContractForm: deleteEmployeeContractFormMock,
}))

vi.mock('@/presentation/components/feedback/useAppConfirm', () => ({
  useAppConfirm: () => ({
    confirm: confirmMock,
  }),
}))

vi.mock('@/presentation/components/feedback/useAppToast', () => ({
  useAppToast: () => ({
    success: toastSuccessMock,
    error: toastErrorMock,
  }),
}))

vi.mock('@/viewmodels/useAuthViewModel', () => ({
  useAuthViewModel: () => ({
    hasPermission: hasPermissionMock,
  }),
}))

vi.mock('@/presentation/components/menus/RowActionsMenu.vue', () => ({
  default: defineComponent({
    props: {
      actions: {
        type: Array,
        default: () => [],
      },
    },
    setup(props) {
      return () =>
        h('div', {},
          (props.actions as Array<{ label: string; onClick: () => void }>).map((action) =>
            h('button', { type: 'button', onClick: action.onClick }, action.label)))
    },
  }),
}))

vi.mock('@/presentation/components/tables/TablePagination.vue', () => ({
  default: defineComponent({
    template: '<div data-testid="pagination">Pagination</div>',
  }),
}))

function createItem(overrides: Partial<EmployeeContractFormRecord> = {}): EmployeeContractFormRecord {
  return {
    id: 'contract-1',
    employee_request_form_id: 'erf-1',
    candidate_form_id: 'candidate-1',
    candidate_name: 'Zeta Candidate',
    candidate_email: 'zeta@example.com',
    contract_number: 'CTR-001',
    employee_code: 'EMP-001',
    contract_start_date: null,
    contract_end_date: null,
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z',
    employee_request_form: {
      id: 'erf-1',
      department: 'Zulu Dept',
      main_position: 'Zeta Position',
      position: 'Zeta Role',
      employment_status: 'Contract',
    },
    ...overrides,
  } as EmployeeContractFormRecord
}

describe('EmployeeContractFormListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hasPermissionMock.mockReturnValue(true)
    confirmMock.mockResolvedValue(true)
    deleteEmployeeContractFormMock.mockResolvedValue(undefined)
    getEmployeeContractFormsMock.mockResolvedValue([
      createItem(),
      createItem({
        id: 'contract-2',
        candidate_name: 'Alpha Candidate',
        candidate_email: 'alpha@example.com',
        employee_request_form: {
          id: 'erf-2',
          department: 'Alpha Dept',
          main_position: 'Alpha Position',
          position: 'Alpha Role',
          employment_status: 'Permanent',
        },
      }),
    ])
  })

  it('sorts candidate names ascending and descending from the table header', async () => {
    const { default: EmployeeContractFormListPage } = await import('../EmployeeContractFormListPage.vue')
    const wrapper = mount(EmployeeContractFormListPage)

    await flushPromises()

    const candidateHeader = wrapper.findAll('button').find((button) => button.text().includes('Candidate Name'))
    expect(candidateHeader).toBeDefined()

    const candidateCells = () => wrapper.findAll('tbody tr td:nth-child(6)').map((cell) => cell.text().trim())

    expect(candidateCells()).toEqual(['Zeta Candidate', 'Alpha Candidate'])

    await candidateHeader!.trigger('click')
    await flushPromises()
    expect(candidateCells()).toEqual(['Alpha Candidate', 'Zeta Candidate'])

    await candidateHeader!.trigger('click')
    await flushPromises()
    expect(candidateCells()).toEqual(['Zeta Candidate', 'Alpha Candidate'])
  })
})
