import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

const approvalRepoMock = {
  approveAssignedStep: vi.fn(),
  rejectAssignedStep: vi.fn(),
}
const candidateFormRepoMock = {}
const candidateDocumentExplorerRepoMock = {}
const employeeRequestFormRepoMock = {}
const recruitmentTrackingRepoMock = {}

const getApprovalChainsMock = vi.fn()
const submitForApprovalMock = vi.fn()
const getChainByEmployeeRequestFormMock = vi.fn()
const getApproverMastersMock = vi.fn()
const createApproverMasterMock = vi.fn()
const updateApproverMasterMock = vi.fn()
const deleteApproverMasterMock = vi.fn()
const getCandidateDocumentExplorerItemsMock = vi.fn()
const getCandidateFormsMock = vi.fn()
const createCandidateFormMock = vi.fn()
const updateCandidateFormMock = vi.fn()
const updateCandidateFormStatusMock = vi.fn()
const deleteCandidateFormMock = vi.fn()
const createEmployeeRequestFormMock = vi.fn()
const updateEmployeeRequestFormMock = vi.fn()
const assignEmployeeRequestFormRecruiterMock = vi.fn()
const deleteEmployeeRequestFormMock = vi.fn()
const closeEmployeeRequestFormMock = vi.fn()
const getRecruitmentTrackingsMock = vi.fn()
const employeeRequestExecuteMock = vi.fn()

vi.mock('@/composables/useAppRepositories', () => ({
  useAppRepositories: () => ({
    approvalRepo: approvalRepoMock,
    candidateFormRepo: candidateFormRepoMock,
    candidateDocumentExplorerRepo: candidateDocumentExplorerRepoMock,
    employeeRequestFormRepo: employeeRequestFormRepoMock,
    recruitmentTrackingRepo: recruitmentTrackingRepoMock,
  }),
}))

vi.mock('@/application/usecases/getApprovalChains', () => ({
  getApprovalChains: getApprovalChainsMock,
}))

vi.mock('@/application/usecases/submitForApproval', () => ({
  submitForApproval: submitForApprovalMock,
}))

vi.mock('@/application/usecases/getChainByEmployeeRequestForm', () => ({
  getChainByEmployeeRequestForm: getChainByEmployeeRequestFormMock,
}))

vi.mock('@/application/usecases/getApproverMasters', () => ({
  getApproverMasters: getApproverMastersMock,
}))

vi.mock('@/application/usecases/createApproverMaster', () => ({
  createApproverMaster: createApproverMasterMock,
}))

vi.mock('@/application/usecases/updateApproverMaster', () => ({
  updateApproverMaster: updateApproverMasterMock,
}))

vi.mock('@/application/usecases/deleteApproverMaster', () => ({
  deleteApproverMaster: deleteApproverMasterMock,
}))

vi.mock('@/application/usecases/getCandidateDocumentExplorerItems', () => ({
  getCandidateDocumentExplorerItems: getCandidateDocumentExplorerItemsMock,
}))

vi.mock('@/application/usecases/getCandidateForms', () => ({
  getCandidateForms: getCandidateFormsMock,
}))

vi.mock('@/application/usecases/createCandidateForm', () => ({
  createCandidateForm: createCandidateFormMock,
}))

vi.mock('@/application/usecases/updateCandidateForm', () => ({
  updateCandidateForm: updateCandidateFormMock,
}))

vi.mock('@/application/usecases/updateCandidateFormStatus', () => ({
  updateCandidateFormStatus: updateCandidateFormStatusMock,
}))

vi.mock('@/application/usecases/deleteCandidateForm', () => ({
  deleteCandidateForm: deleteCandidateFormMock,
}))

vi.mock('@/application/usecases/getEmployeeRequestForms', () => ({
  GetEmployeeRequestForms: class {
    execute = employeeRequestExecuteMock
  },
}))

vi.mock('@/application/usecases/createEmployeeRequestForm', () => ({
  createEmployeeRequestForm: createEmployeeRequestFormMock,
}))

vi.mock('@/application/usecases/updateEmployeeRequestForm', () => ({
  updateEmployeeRequestForm: updateEmployeeRequestFormMock,
}))

vi.mock('@/application/usecases/assignEmployeeRequestFormRecruiter', () => ({
  assignEmployeeRequestFormRecruiter: assignEmployeeRequestFormRecruiterMock,
}))

vi.mock('@/application/usecases/deleteEmployeeRequestForm', () => ({
  deleteEmployeeRequestForm: deleteEmployeeRequestFormMock,
}))

vi.mock('@/application/usecases/closeEmployeeRequestForm', () => ({
  closeEmployeeRequestForm: closeEmployeeRequestFormMock,
}))

vi.mock('@/application/usecases/getRecruitmentTrackings', () => ({
  getRecruitmentTrackings: getRecruitmentTrackingsMock,
}))

function mountComposable<T extends Record<string, unknown>>(useComposable: () => T) {
  const Harness = defineComponent({
    setup() {
      return useComposable()
    },
    template: '<div />',
  })

  return mount(Harness)
}

describe('core viewmodels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getApprovalChainsMock.mockResolvedValue([{ id: 'chain-1' }])
    submitForApprovalMock.mockResolvedValue(undefined)
    getChainByEmployeeRequestFormMock.mockResolvedValue({ id: 'chain-1' })
    approvalRepoMock.approveAssignedStep.mockResolvedValue(undefined)
    approvalRepoMock.rejectAssignedStep.mockResolvedValue(undefined)
    getApproverMastersMock.mockResolvedValue([{ id: 'ap-1' }])
    createApproverMasterMock.mockResolvedValue(undefined)
    updateApproverMasterMock.mockResolvedValue(undefined)
    deleteApproverMasterMock.mockResolvedValue(undefined)
    getCandidateDocumentExplorerItemsMock.mockResolvedValue([{ id: 'doc-1' }])
    getCandidateFormsMock.mockResolvedValue([{ id: 'candidate-1' }])
    createCandidateFormMock.mockResolvedValue(undefined)
    updateCandidateFormMock.mockResolvedValue(undefined)
    updateCandidateFormStatusMock.mockResolvedValue(undefined)
    deleteCandidateFormMock.mockResolvedValue(undefined)
    employeeRequestExecuteMock.mockResolvedValue([{ id: 'job-1' }])
    createEmployeeRequestFormMock.mockResolvedValue(undefined)
    updateEmployeeRequestFormMock.mockResolvedValue(undefined)
    deleteEmployeeRequestFormMock.mockResolvedValue(undefined)
    closeEmployeeRequestFormMock.mockResolvedValue(undefined)
    getRecruitmentTrackingsMock.mockResolvedValue([{ id: 'tracking-1' }])
  })

  it('useApprovalViewModel loads, submits, and processes assigned steps', async () => {
    const { useApprovalViewModel } = await import('../useApprovalViewModel')
    const wrapper = mountComposable(useApprovalViewModel)

    await flushPromises()

    expect((wrapper.vm as any).chains).toEqual([{ id: 'chain-1' }])
    expect(getApprovalChainsMock).toHaveBeenCalledWith(approvalRepoMock)

    await (wrapper.vm as any).submitForApproval({ employee_request_form_id: 'erf-1' })
    expect(submitForApprovalMock).toHaveBeenCalledWith(approvalRepoMock, {
      employee_request_form_id: 'erf-1',
    })

    await (wrapper.vm as any).approveAssignedStep('step-1', 'ok')
    expect(approvalRepoMock.approveAssignedStep).toHaveBeenCalledWith('step-1', 'ok')

    await (wrapper.vm as any).rejectAssignedStep('step-2')
    expect(approvalRepoMock.rejectAssignedStep).toHaveBeenCalledWith('step-2', undefined)

    await expect((wrapper.vm as any).fetchChainByEmployeeRequestForm('erf-1')).resolves.toEqual({
      id: 'chain-1',
    })
  })

  it('useApprovalViewModel skips auto loading when disabled', async () => {
    const { useApprovalViewModel } = await import('../useApprovalViewModel')
    mountComposable(() => useApprovalViewModel({ autoLoad: false }))

    await flushPromises()

    expect(getApprovalChainsMock).not.toHaveBeenCalled()
  })

  it('useApproverMasterViewModel refreshes and mutates data through the use cases', async () => {
    const { useApproverMasterViewModel } = await import('../useApproverMasterViewModel')
    const wrapper = mountComposable(useApproverMasterViewModel)

    await flushPromises()

    expect((wrapper.vm as any).approvers).toEqual([{ id: 'ap-1' }])

    await (wrapper.vm as any).create({
      profile_id: 'user-1',
      step_order: 1,
      approval_flow_key: 'designations:des-1',
      approval_role_key: 'gm_approval',
      approval_role_label: 'GM',
    })
    await (wrapper.vm as any).update('ap-1', {
      profile_id: 'user-2',
      step_order: 2,
      approval_flow_key: 'designations:des-1',
      approval_role_key: 'director_approval',
      approval_role_label: 'Director BU',
    })
    await (wrapper.vm as any).remove('ap-1')

    expect(createApproverMasterMock).toHaveBeenCalled()
    expect(updateApproverMasterMock).toHaveBeenCalledWith(approvalRepoMock, 'ap-1', {
      profile_id: 'user-2',
      step_order: 2,
      approval_flow_key: 'designations:des-1',
      approval_role_key: 'director_approval',
      approval_role_label: 'Director BU',
    })
    expect(deleteApproverMasterMock).toHaveBeenCalledWith(approvalRepoMock, 'ap-1')
  })

  it('useCandidateDocumentExplorerViewModel loads explorer items and exposes errors', async () => {
    const { useCandidateDocumentExplorerViewModel } =
      await import('../useCandidateDocumentExplorerViewModel')
    const wrapper = mountComposable(useCandidateDocumentExplorerViewModel)

    await flushPromises()
    expect((wrapper.vm as any).items).toEqual([{ id: 'doc-1' }])

    getCandidateDocumentExplorerItemsMock.mockRejectedValueOnce(new Error('docs failed'))
    await (wrapper.vm as any).refreshItems()

    expect((wrapper.vm as any).error).toBe('docs failed')
  })

  it('useCandidateFormViewModel refreshes and handles create/update/status/remove actions', async () => {
    const { useCandidateFormViewModel } = await import('../useCandidateFormViewModel')
    const wrapper = mountComposable(useCandidateFormViewModel)

    await flushPromises()
    expect((wrapper.vm as any).candidates).toEqual([{ id: 'candidate-1' }])

    await (wrapper.vm as any).create({ first_name: 'John' })
    await (wrapper.vm as any).update('candidate-1', { first_name: 'Jane' })
    await (wrapper.vm as any).updateStatus('candidate-1', 'completed')
    await (wrapper.vm as any).remove('candidate-1')

    expect(createCandidateFormMock).toHaveBeenCalled()
    expect(updateCandidateFormMock).toHaveBeenCalledWith(candidateFormRepoMock, 'candidate-1', {
      first_name: 'Jane',
    })
    expect(updateCandidateFormStatusMock).toHaveBeenCalledWith(
      candidateFormRepoMock,
      'candidate-1',
      'completed',
    )
    expect(deleteCandidateFormMock).toHaveBeenCalledWith(candidateFormRepoMock, 'candidate-1')
  })

  it('useCandidateFormViewModel skips auto loading when disabled', async () => {
    const { useCandidateFormViewModel } = await import('../useCandidateFormViewModel')
    mountComposable(() => useCandidateFormViewModel({ autoLoad: false }))

    await flushPromises()

    expect(getCandidateFormsMock).not.toHaveBeenCalled()
  })

  it('useEmployeeRequestFormViewModel refreshes and handles create/update/delete/close', async () => {
    const { useEmployeeRequestFormViewModel } = await import('../useEmployeeRequestFormViewModel')
    const wrapper = mountComposable(useEmployeeRequestFormViewModel)

    await flushPromises()
    expect((wrapper.vm as any).jobs).toEqual([{ id: 'job-1' }])

    await (wrapper.vm as any).create({ main_position: 'Engineer' })
    await (wrapper.vm as any).update('job-1', { main_position: 'Lead Engineer' })
    await (wrapper.vm as any).assignRecruiter('job-1', 'recruiter-1')
    await (wrapper.vm as any).remove('job-1')
    await (wrapper.vm as any).close('job-1', 'employee hired', 'filled')

    expect(createEmployeeRequestFormMock).toHaveBeenCalledWith(
      employeeRequestFormRepoMock,
      { main_position: 'Engineer' },
      { reloadRecord: false },
    )
    expect(updateEmployeeRequestFormMock).toHaveBeenCalledWith(
      employeeRequestFormRepoMock,
      'job-1',
      {
        main_position: 'Lead Engineer',
      },
      { reloadRecord: false },
    )
    expect(assignEmployeeRequestFormRecruiterMock).toHaveBeenCalledWith(
      employeeRequestFormRepoMock,
      'job-1',
      'recruiter-1',
    )
    expect(deleteEmployeeRequestFormMock).toHaveBeenCalledWith(employeeRequestFormRepoMock, 'job-1')
    expect(closeEmployeeRequestFormMock).toHaveBeenCalledWith(
      employeeRequestFormRepoMock,
      'job-1',
      'employee hired',
      'filled',
    )
  })

  it('useRecruitmentTrackingViewModel loads tracking data and exposes refresh errors', async () => {
    const { useRecruitmentTrackingViewModel } = await import('../useRecruitmentTrackingViewModel')
    const wrapper = mountComposable(useRecruitmentTrackingViewModel)

    await flushPromises()
    expect((wrapper.vm as any).trackings).toEqual([{ id: 'tracking-1' }])

    getRecruitmentTrackingsMock.mockRejectedValueOnce(new Error('tracking failed'))
    await (wrapper.vm as any).refreshTrackings()

    expect((wrapper.vm as any).error).toBe('tracking failed')
  })

  it('useRecruitmentTrackingViewModel skips auto loading when disabled', async () => {
    const { useRecruitmentTrackingViewModel } = await import('../useRecruitmentTrackingViewModel')
    mountComposable(() => useRecruitmentTrackingViewModel({ autoLoad: false }))

    await flushPromises()

    expect(getRecruitmentTrackingsMock).not.toHaveBeenCalled()
  })
})
