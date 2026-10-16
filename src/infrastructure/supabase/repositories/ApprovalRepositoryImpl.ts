import { supabase } from '@/infrastructure/supabase/client'
import { callBackendApi } from '@/infrastructure/http/backendApi'
import { getAuthAccessScope } from '@/infrastructure/auth/accessScope'
import { getJakartaTimestamp } from '@/infrastructure/utils/jakartaTime'
import type {
  ApprovalChain,
  ApprovalStep,
  ApproverMaster,
} from '@/domain/entities/ApprovalChain'
import type { ApprovalRepository } from '@/domain/repositories/ApprovalRepository'
import type { ApproverMasterRequest, SubmitApprovalRequest } from '@/domain/requests/ApprovalRequest'

const chainSelect = `
  *,
  steps:approval_steps(*)
`

const chainWithEmployeeRequestFormSelect = `
  *,
  steps:approval_steps(*),
  employee_request_form:employee_request_form(
    id,
    created_at,
    requested_date,
    status,
    closed_category,
    recruitment_flow_stage,
    main_position,
    pt:master_pt(name),
    department_ref:master_department(name),
    master_designation_ref:master_designation(name),
    site,
    employment_status,
    required_date,
    direct_manager, working_location, required_date,
    position_status, periode_probation,
    custom_grup_1:master_custom_grup_1(name),
    custom_grup_2:master_custom_grup_2(name),
    custom_grup_3:master_custom_grup_3(name),
    custom_grup_4:master_custom_grup_4(name),
    custom_grup_5:master_custom_grup_5(name),
    custom_grup_6:master_custom_grup_6(name),
    organizational_structure,
    job_description
  )
`

const approverEmployeeSelect =
  'profile:profiles!approver_master_profile_id_fkey(full_name, email, phone, username)'

export class ApprovalRepositoryImpl implements ApprovalRepository {
  // ========================
  // Approval Chain
  // ========================

  async getChainsByUser(): Promise<ApprovalChain[]> {
    const accessScope = await this.getApprovalChainAccessScope()
    if (accessScope.canReadAllTracking) {
      const { data, error } = await supabase
        .from('approval_chains')
        .select(chainWithEmployeeRequestFormSelect)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)

      return (data ?? []).map(this.normalizeChain)
    }

    if (accessScope.isManager && accessScope.userId) {
      const { data: ownedEmployeeRequestForms, error: ownedEmployeeRequestFormsError } = await supabase
        .from('employee_request_form')
        .select('id')
        .eq('created_by', accessScope.userId)

      if (ownedEmployeeRequestFormsError) throw new Error(ownedEmployeeRequestFormsError.message)

      const employeeRequestFormIds = (ownedEmployeeRequestForms ?? []).map((item: any) => String(item.id))

      if (employeeRequestFormIds.length === 0) return []

      const { data, error } = await supabase
        .from('approval_chains')
        .select(chainWithEmployeeRequestFormSelect)
        .in('employee_request_form_id', employeeRequestFormIds)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)

      return (data ?? []).map(this.normalizeChain)
    }

    const currentUserEmail = await this.getAuthenticatedUserEmail()
    if (!currentUserEmail) return []

    const { data: assignedSteps, error: assignedStepsError } = await supabase
      .from('approval_steps')
      .select('chain_id')
      .ilike('approver_email', currentUserEmail)

    if (assignedStepsError) throw new Error(assignedStepsError.message)

    const chainIds = [
      ...new Set(
        (assignedSteps ?? [])
          .map((step: { chain_id?: string | null }) => String(step.chain_id ?? '').trim())
          .filter(Boolean),
      ),
    ]

    if (chainIds.length === 0) return []

    const { data, error } = await supabase
      .from('approval_chains')
      .select(chainWithEmployeeRequestFormSelect)
      .in('id', chainIds)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    return (data ?? []).map(this.normalizeChain)
  }

  async getChainByEmployeeRequestForm(employeeRequestFormId: string): Promise<ApprovalChain | null> {
    const accessScope = await this.getApprovalChainAccessScope()

    if (accessScope.isManager && accessScope.userId) {
      const { data: ownedEmployeeRequestForm, error: ownedEmployeeRequestFormError } = await supabase
        .from('employee_request_form')
        .select('id')
        .eq('id', employeeRequestFormId)
        .eq('created_by', accessScope.userId)
        .maybeSingle()

      if (ownedEmployeeRequestFormError) throw new Error(ownedEmployeeRequestFormError.message)
      if (!ownedEmployeeRequestForm) return null
    }

    const { data, error } = await supabase
      .from('approval_chains')
      .select(chainWithEmployeeRequestFormSelect)
      .eq('employee_request_form_id', employeeRequestFormId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) throw new Error(error.message)

    const latestChain = data?.[0]
    const chain = latestChain ? this.normalizeChain(latestChain) : null
    if (!chain || accessScope.canReadAllTracking || accessScope.isManager) {
      return chain
    }

    const currentUserEmail = await this.getAuthenticatedUserEmail()
    if (!currentUserEmail) return null

    const canAccessChain = chain.steps.some(
      (step) => String(step.approver_email ?? '').trim().toLowerCase() === currentUserEmail,
    )

    return canAccessChain ? chain : null
  }

  async submitForApproval(input: SubmitApprovalRequest): Promise<ApprovalChain> {
    // Delegate chain + steps creation to the server-side route which uses the
    // admin Supabase client and therefore bypasses the RLS INSERT policy on
    // `approval_chains` that blocks direct client-side writes.
    await callBackendApi<{ ok: boolean; chain_id: string }>('/approval/start-chain', {
      method: 'POST',
      body: JSON.stringify({
        employee_request_form_id: input.employee_request_form_id,
        auto_approval: Boolean(input.auto_approval),
      }),
    })

    // Return the full chain with steps now that it has been created.
    const result = await this.getChainByEmployeeRequestForm(input.employee_request_form_id)
    if (!result) throw new Error('Failed to load newly created approval chain.')

    return result
  }

  async approveAssignedStep(stepId: string, notes?: string): Promise<void> {
    const step = await this.getStepByIdOrThrow(stepId)
    await this.ensureCurrentUserMatchesApprover(step.approver_email)
    await this.processApprovalStep(step, notes)
  }

  async rejectAssignedStep(stepId: string, notes?: string): Promise<void> {
    const step = await this.getStepByIdOrThrow(stepId)
    await this.ensureCurrentUserMatchesApprover(step.approver_email)
    await this.processRejectedStep(step, notes)
  }

  // ========================
  // Approver Master Data
  // ========================

  async getAllApproverMasters(): Promise<ApproverMaster[]> {
    const query = supabase
      .from('approver_master')
      .select(`*, ${approverEmployeeSelect}`)

    const { data, error } = await query
      .order('approval_flow_key', { ascending: true })
      .order('step_order', { ascending: true })

    if (error) throw new Error(error.message)

    return (data ?? []).map((item: any) =>
      this.normalizeApproverMaster(item as Record<string, unknown>),
    )
  }

  async createApproverMaster(input: ApproverMasterRequest): Promise<ApproverMaster> {
    const user = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('approver_master')
      .insert({
        profile_id: input.profile_id,
        step_order: input.step_order,
        approval_flow_key: input.approval_flow_key,
        approval_role_key: input.approval_role_key,
        approval_role_label: input.approval_role_label,
        created_by: user.data.user?.id ?? null,
      })
      .select(`*, ${approverEmployeeSelect}`)
      .single()

    if (error) throw new Error(error.message)

    return this.normalizeApproverMaster(data as Record<string, unknown>)
  }

  async updateApproverMaster(id: string, input: ApproverMasterRequest): Promise<ApproverMaster> {
    const query = supabase
      .from('approver_master')
      .update({
        profile_id: input.profile_id,
        step_order: input.step_order,
        approval_flow_key: input.approval_flow_key,
        approval_role_key: input.approval_role_key,
        approval_role_label: input.approval_role_label,
      })
      .eq('id', id)

    const { data, error } = await query
      .select(`*, ${approverEmployeeSelect}`)
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) {
      throw new Error('Approver data not found.')
    }

    return this.normalizeApproverMaster(data as Record<string, unknown>)
  }

  async deleteApproverMaster(id: string): Promise<void> {
    const query = supabase.from('approver_master').delete().eq('id', id)

    const { data, error } = await query.select('id')

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) {
      throw new Error('Approver data not found or could not be deleted.')
    }
  }

  // ========================
  // Helpers
  // ========================

  private normalizeApproverMaster(data: Record<string, unknown>): ApproverMaster {
    const profile = (data.profile as ApproverMaster['employee'] | undefined) ?? undefined

    return {
      ...(data as unknown as ApproverMaster),
      employee: profile,
    }
  }

  private async getStepByIdOrThrow(stepId: string) {
    const { data: step, error } = await supabase
      .from('approval_steps')
      .select('*')
      .eq('id', stepId)
      .single()

    if (error) throw new Error(error.message)
    return step as ApprovalStep
  }

  private async getAuthenticatedUserEmail() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) throw new Error(error.message)

    return String(session?.user?.email ?? '').trim().toLowerCase() || null
  }

  private async ensureCurrentUserMatchesApprover(approverEmail: string) {
    const currentUserEmail = await this.getAuthenticatedUserEmail()
    const normalizedApproverEmail = String(approverEmail ?? '').trim().toLowerCase()

    if (!currentUserEmail || !normalizedApproverEmail || currentUserEmail !== normalizedApproverEmail) {
      throw new Error(
        'Approval can only be processed by the designated approver email registered for this stage.',
      )
    }
  }

  private async ensurePreviousStepsApproved(step: ApprovalStep) {
    if (step.status !== 'pending') {
      throw new Error('This step has been processed already.')
    }

    const { data: previousSteps, error } = await supabase
      .from('approval_steps')
      .select('*')
      .eq('chain_id', step.chain_id)
      .lt('step_order', step.step_order)
      .neq('status', 'approved')

    if (error) throw new Error(error.message)
    if (previousSteps && previousSteps.length > 0) {
      throw new Error('Waiting for approval from the previous stage.')
    }
  }

  private async processApprovalStep(step: ApprovalStep, notes?: string) {
    await this.ensurePreviousStepsApproved(step)

    const approvedAt = getJakartaTimestamp()
    const { error: updateError } = await supabase
      .from('approval_steps')
      .update({
        status: 'approved',
        approved_at: approvedAt,
        notes: notes || null,
      })
      .eq('id', step.id)

    if (updateError) throw new Error(updateError.message)

    const { data: remainingPending, error: remainError } = await supabase
      .from('approval_steps')
      .select('id')
      .eq('chain_id', step.chain_id)
      .eq('status', 'pending')

    if (remainError) throw new Error(remainError.message)

    if (!remainingPending || remainingPending.length === 0) {
      await supabase
        .from('approval_chains')
        .update({
          status: 'approved',
          updated_at: getJakartaTimestamp(),
        })
        .eq('id', step.chain_id)

      await this.syncEmployeeRequestFormStage(step.chain_id)
      return
    }

    const { data: nextStep } = await supabase
      .from('approval_steps')
      .select('*')
      .eq('chain_id', step.chain_id)
      .eq('step_order', step.step_order + 1)
      .maybeSingle()

    if (!nextStep) return

    await this.syncEmployeeRequestFormStage(step.chain_id)
    this.runApprovalSideEffect(
      () => this.sendApprovalEmail(step.chain_id, nextStep.step_order),
      'Failed to notify next approval step.',
    )
  }

  private async processRejectedStep(step: ApprovalStep, notes?: string) {
    await this.ensurePreviousStepsApproved(step)
    const approvedAt = getJakartaTimestamp()

    const { error: updateError } = await supabase
      .from('approval_steps')
      .update({
        status: 'rejected',
        approved_at: approvedAt,
        notes: notes || null,
      })
      .eq('id', step.id)

    if (updateError) throw new Error(updateError.message)

    await supabase
      .from('approval_chains')
      .update({
        status: 'rejected',
        updated_at: approvedAt,
      })
      .eq('id', step.chain_id)

    await this.syncEmployeeRequestFormStage(step.chain_id)
  }

  private runApprovalSideEffect(task: () => Promise<unknown>, message: string) {
    void task().catch((error) => {
      console.error(message, error)
    })
  }

  private async syncEmployeeRequestFormStage(chainId: string) {
    await callBackendApi<{ ok: boolean; stage: string }>('/approval/sync-stage', {
      method: 'POST',
      body: JSON.stringify({
        chain_id: chainId,
      }),
    })
  }

  private normalizeChain(data: Record<string, unknown>): ApprovalChain {
    const steps = Array.isArray(data.steps)
      ? (data.steps as ApprovalStep[]).sort((a, b) => a.step_order - b.step_order)
      : []

    const chain = data as unknown as any
    const employeeRequestForm = chain.employee_request_form

    if (employeeRequestForm) {
      chain.employee_request_form = {
        ...employeeRequestForm,
        pt_pembebanan: employeeRequestForm.pt?.name ?? null,
        department: employeeRequestForm.department_ref?.name ?? null,
        designation: employeeRequestForm.master_designation_ref?.name ?? null,
        custom_grup_1: employeeRequestForm.custom_grup_1?.name ?? null,
        custom_grup_2: employeeRequestForm.custom_grup_2?.name ?? null,
        custom_grup_3: employeeRequestForm.custom_grup_3?.name ?? null,
        custom_grup_4: employeeRequestForm.custom_grup_4?.name ?? null,
        custom_grup_5: employeeRequestForm.custom_grup_5?.name ?? null,
        custom_grup_6: employeeRequestForm.custom_grup_6?.name ?? null,
      }
    }

    return {
      ...chain,
      steps,
    }
  }

  private buildEmployeeFullName(
    employee:
      | {
          full_name?: string | null
          username?: string | null
        }
      | null
      | undefined,
  ) {
    return String(employee?.full_name ?? employee?.username ?? '')
      .trim()
  }

  private async getLatestActiveChainByEmployeeRequestForm(employeeRequestFormId: string) {
    const { data, error } = await supabase
      .from('approval_chains')
      .select(chainWithEmployeeRequestFormSelect)
      .eq('employee_request_form_id', employeeRequestFormId)
      .in('status', ['draft', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) throw new Error(error.message)

    return data?.[0] ? this.normalizeChain(data[0]) : null
  }

  private async resolveBuDirectorApproverById(employeeId: string) {
    const { data: employee, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, username')
      .eq('id', employeeId)
      .maybeSingle()

    if (error) throw new Error(error.message)

    if (!employee?.email) {
      throw new Error('BU Director approver email could not be resolved from the selected employee.')
    }

    return {
      email: employee.email,
      name: this.buildEmployeeFullName(employee) || 'BU Director',
    }
  }

  private async getApproverMasterAccessScope() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) throw new Error(userError.message)

    if (!user) {
      return {
        isManager: false,
        userId: null as string | null,
      }
    }

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id)
      .maybeSingle()

    if (roleError) throw new Error(roleError.message)

    const roleName = (roleData as { roles?: { name?: string } | null } | null)?.roles?.name

    return {
      isManager: roleName?.toLowerCase() === 'manager',
      userId: user.id,
    }
  }

  private async getApprovalChainAccessScope() {
    const accessScope = await getAuthAccessScope()

    return {
      canReadAllTracking: accessScope.permissions.includes('approval:tracking_all'),
      isManager: accessScope.isManager,
      roleName: accessScope.roleName,
      userId: accessScope.userId,
    }
  }

  private async sendApprovalEmail(chainId: string, stepOrder: number) {
    await callBackendApi('/approval/notify-step', {
      method: 'POST',
      body: JSON.stringify({
        chain_id: chainId,
        step_order: stepOrder,
      }),
    })
  }
}
