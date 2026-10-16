import { supabase } from '@/infrastructure/supabase/client'
import { callBackendApi } from '@/infrastructure/http/backendApi'
import { getAuthAccessScope } from '@/infrastructure/auth/accessScope'
import { getJakartaTimestamp } from '@/infrastructure/utils/jakartaTime'
import type { EmployeeRequestForm, VacancyStatus } from '@/domain/entities/EmployeeRequestForm'
import type {
  EmployeeRequestFormGetByIdOptions,
  EmployeeRequestFormMutationOptions,
  EmployeeRequestFormRepository,
} from '@/domain/repositories/EmployeeRequestFormRepository'
import type { EmployeeRequestFormRequest } from '@/domain/requests/EmployeeRequestFormRequest'
import { buildApprovalSummary } from '@/domain/utils/approvalSummary'
import {
  getApprovalFlowTemplate,
  resolveConfiguredApprovalFlowKeyFromDesignation,
} from '@/domain/utils/approvalFlowConfig'
import { resolveRecruitmentFlowStage } from '@/domain/utils/recruitmentFlowStage'
import { getInfrastructureRepositories } from '@/infrastructure/repositories'

export class EmployeeRequestFormRepositoryImpl implements EmployeeRequestFormRepository {
  private async fetchBaseItems() {
    const accessScope = await this.getAccessScope()
    let query = supabase.from('employee_request_form').select(`
      *,
      recruiter_profile:profiles!employee_request_form_recruiter_user_id_fkey(
        full_name,
        username,
        email
      ),
      approval_director_bu_profile:profiles!employee_request_form_approval_director_bu_id_fkey(
        full_name,
        username,
        main_position
      ),
      pt:master_pt(id, name),
      department_ref:master_department(id, name),
      master_designation_ref:master_designation(id, name),
      custom_grup_1:master_custom_grup_1(name),
      custom_grup_2:master_custom_grup_2(name),
      custom_grup_3:master_custom_grup_3(name),
      custom_grup_4:master_custom_grup_4(name),
      custom_grup_5:master_custom_grup_5(name),
      custom_grup_6:master_custom_grup_6(name)
    `)

    if (accessScope.isManager && accessScope.userId) {
      query = query.eq('created_by', accessScope.userId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(this.flattenCustomGroups)
  }

  private async fetchClosedMetadata(employeeRequestFormIds: string[]) {
    const normalizedIds = Array.from(
      new Set(employeeRequestFormIds.map((id) => String(id).trim()).filter(Boolean)),
    )

    if (normalizedIds.length === 0) {
      return new Map<
        string,
        { closed_category: EmployeeRequestForm['closed_category']; reason: string | null }
      >()
    }

    const { data, error } = await supabase
      .from('employee_request_form')
      .select('id, closed_category, reason')
      .in('id', normalizedIds)

    if (error) {
      throw new Error(error.message)
    }

    const metadata = new Map<
      string,
      { closed_category: EmployeeRequestForm['closed_category']; reason: string | null }
    >()

    for (const item of data ?? []) {
      const employeeRequestFormId = String(item.id ?? '').trim()
      if (!employeeRequestFormId) continue

      metadata.set(employeeRequestFormId, {
        closed_category: (item.closed_category as EmployeeRequestForm['closed_category']) ?? null,
        reason: (item.reason as string | null) ?? null,
      })
    }

    return metadata
  }

  async getAllForList(): Promise<EmployeeRequestForm[]> {
    const baseItems = await this.fetchBaseItems()
    const [itemsWithBusinessUnits, itemsWithCreators] = await Promise.all([
      this.attachBusinessUnits(baseItems),
      this.attachCreatorNames(baseItems),
    ])
    const itemsWithApprovals = await this.attachApprovalSummaries(
      itemsWithBusinessUnits.map((item, index) => ({
        ...item,
        created_by_name: itemsWithCreators[index]?.created_by_name ?? null,
      })),
    )
    return this.attachListRecruitmentStatuses(itemsWithApprovals)
  }

  async getAllForVacancyPipeline(): Promise<EmployeeRequestForm[]> {
    const accessScope = await this.getAccessScope()
    let query = supabase.from('recruitment_queue_view').select('*')

    if (accessScope.isManager && accessScope.userId) {
      const { data: ownedEmployeeRequestForms, error: ownedEmployeeRequestFormsError } =
        await supabase
          .from('employee_request_form')
          .select('id')
          .eq('created_by', accessScope.userId)

      if (ownedEmployeeRequestFormsError) {
        throw new Error(ownedEmployeeRequestFormsError.message)
      }

      const employeeRequestFormIds = (ownedEmployeeRequestForms ?? []).map((item: any) =>
        String(item.id),
      )

      if (employeeRequestFormIds.length === 0) {
        return []
      }

      query = query.in('employee_request_form_id', employeeRequestFormIds)
    }

    const { data, error } = await query.order('updated_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    const employeeRequestFormIds = (data ?? [])
      .map((item: Record<string, unknown>) => String(item.employee_request_form_id ?? '').trim())
      .filter(Boolean)
    const closedMetadata = await this.fetchClosedMetadata(employeeRequestFormIds)

    const pipelinePayload =
      employeeRequestFormIds.length === 0
        ? {
            passed_candidates: [] as Array<{
              employee_request_form_id: string
              full_name: string | null
              email: string | null
              interview_date?: string | null
            }>,
            recruitment_flow_stages: [] as Array<{
              employee_request_form_id: string
              stage: EmployeeRequestForm['recruitment_flow_stage']
            }>,
            vacancy_statuses: [] as Array<{
              employee_request_form_id: string
              status: EmployeeRequestForm['vacancy_status']
            }>,
            vacancy_pipeline: [] as Array<{
              employee_request_form_id: string
              candidate_count: number
              interview_scheduled_count: number
            }>,
          }
        : await callBackendApi<{
            passed_candidates: Array<{
              employee_request_form_id: string
              full_name: string | null
              email: string | null
              interview_date?: string | null
            }>
            recruitment_flow_stages: Array<{
              employee_request_form_id: string
              stage: EmployeeRequestForm['recruitment_flow_stage']
            }>
            vacancy_statuses: Array<{
              employee_request_form_id: string
              status: EmployeeRequestForm['vacancy_status']
            }>
            vacancy_pipeline: Array<{
              employee_request_form_id: string
              candidate_count: number
              interview_scheduled_count: number
            }>
          }>('/api/employee-request-forms/vacancy-pipeline', {
            method: 'POST',
            body: JSON.stringify({
              employee_request_form_ids: employeeRequestFormIds,
            }),
          })

    const passedCandidateNames = new Map<string, string[]>()
    const passedCandidateInterviewDates = new Map<string, string[]>()
    const recruitmentFlowStages = new Map<string, EmployeeRequestForm['recruitment_flow_stage']>()
    const vacancyStatuses = new Map<string, EmployeeRequestForm['vacancy_status']>()
    const vacancyPipeline = new Map<
      string,
      { candidate_count: number; interview_scheduled_count: number }
    >()

    for (const candidate of pipelinePayload.passed_candidates ?? []) {
      const employeeRequestFormId = String(candidate.employee_request_form_id ?? '').trim()
      const name = String(candidate.full_name ?? candidate.email ?? '').trim()
      const interviewDate = String(candidate.interview_date ?? '').trim()

      if (!employeeRequestFormId || !name) continue

      const current = passedCandidateNames.get(employeeRequestFormId) ?? []
      if (!current.includes(name)) {
        current.push(name)
      }
      passedCandidateNames.set(employeeRequestFormId, current)

      if (interviewDate) {
        const currentInterviewDates = passedCandidateInterviewDates.get(employeeRequestFormId) ?? []
        if (!currentInterviewDates.includes(interviewDate)) {
          currentInterviewDates.push(interviewDate)
        }
        passedCandidateInterviewDates.set(employeeRequestFormId, currentInterviewDates)
      }
    }

    for (const item of pipelinePayload.vacancy_statuses ?? []) {
      const employeeRequestFormId = String(item.employee_request_form_id ?? '').trim()
      if (!employeeRequestFormId) continue
      vacancyStatuses.set(employeeRequestFormId, item.status ?? 'request')
    }

    for (const item of pipelinePayload.recruitment_flow_stages ?? []) {
      const employeeRequestFormId = String(item.employee_request_form_id ?? '').trim()
      if (!employeeRequestFormId) continue
      recruitmentFlowStages.set(employeeRequestFormId, item.stage ?? null)
    }

    for (const item of pipelinePayload.vacancy_pipeline ?? []) {
      const employeeRequestFormId = String(item.employee_request_form_id ?? '').trim()
      if (!employeeRequestFormId) continue
      vacancyPipeline.set(employeeRequestFormId, {
        candidate_count: Number(item.candidate_count ?? 0),
        interview_scheduled_count: Number(item.interview_scheduled_count ?? 0),
      })
    }

    return (data ?? []).map((item: Record<string, unknown>) => {
      const employeeRequestFormId = String(item.employee_request_form_id ?? item.id ?? '')
      const candidateNames = passedCandidateNames.get(employeeRequestFormId) ?? []
      const candidateInterviewDates = passedCandidateInterviewDates.get(employeeRequestFormId) ?? []
      const pipeline = vacancyPipeline.get(employeeRequestFormId)
      const metadata = closedMetadata.get(employeeRequestFormId)

      return {
        id: employeeRequestFormId,
        recruiter_user_id: (item.employee_request_form_recruiter_user_id as string | null) ?? null,
        recruiter_name: (item.employee_request_form_recruiter_name as string | null) ?? null,
        pt_id: null,
        pt_pembebanan: (item.employee_request_form_pt_pembebanan as string | null) ?? null,
        bu_id: (item.employee_request_form_bu_id as string | null) ?? null,
        department_id: null,
        department: (item.employee_request_form_department as string | null) ?? null,
        business_unit: (item.employee_request_form_business_unit as string | null) ?? null,
        master_designation_id:
          (item.employee_request_form_master_designation_id as string | null) ?? null,
        designation: (item.employee_request_form_designation as string | null) ?? null,
        employment_status:
          (item.employee_request_form_employment_status as EmployeeRequestForm['employment_status']) ??
          null,
        direct_manager: null,
        approval_director_bu:
          (item.employee_request_form_approval_director_bu as string | null) ?? null,
        approval_director_bu_date:
          (item.employee_request_form_approval_director_bu_date as string | null) ?? null,
        approval_gm_hrd: (item.employee_request_form_approval_gm_hrd as string | null) ?? null,
        approval_gm_hrd_date:
          (item.employee_request_form_approval_gm_hrd_date as string | null) ?? null,
        approval_director_hrd:
          (item.employee_request_form_approval_director_hrd as string | null) ?? null,
        approval_director_hrd_date:
          (item.employee_request_form_approval_director_hrd_date as string | null) ?? null,
        site: (item.employee_request_form_site as string | null) ?? null,
        working_location: (item.employee_request_form_working_location as string | null) ?? null,
        requested_date: (item.employee_request_form_requested_date as string | null) ?? null,
        custom_grup_1_id: null,
        custom_grup_2_id: null,
        custom_grup_3_id: null,
        custom_grup_4_id: null,
        custom_grup_5_id: null,
        custom_grup_6_id: null,
        custom_grup_1: (item.employee_request_form_custom_grup_1 as string | null) ?? null,
        custom_grup_2: (item.employee_request_form_custom_grup_2 as string | null) ?? null,
        custom_grup_3: (item.employee_request_form_custom_grup_3 as string | null) ?? null,
        custom_grup_4: (item.employee_request_form_custom_grup_4 as string | null) ?? null,
        custom_grup_5: (item.employee_request_form_custom_grup_5 as string | null) ?? null,
        custom_grup_6: (item.employee_request_form_custom_grup_6 as string | null) ?? null,
        required_date: (item.employee_request_form_required_date as string | null) ?? null,
        position_status:
          (item.employee_request_form_position_status as EmployeeRequestForm['position_status']) ??
          null,
        periode_probation: null,
        main_position: (item.employee_request_form_main_position as string | null) ?? null,
        passed_candidate_name: candidateNames.join(', ') || null,
        passed_candidate_interview_date: candidateInterviewDates.join(', ') || null,
        vacancy_status: vacancyStatuses.get(employeeRequestFormId) ?? 'request',
        vacancy_candidate_count: pipeline?.candidate_count ?? 0,
        vacancy_interview_scheduled_count: pipeline?.interview_scheduled_count ?? 0,
        recruitment_flow_stage: recruitmentFlowStages.get(employeeRequestFormId) ?? null,
        organizational_structure: [],
        job_description: [],
        document_erf: [],
        created_by: null,
        created_by_name: null,
        status: (item.employee_request_form_status as 'open' | 'closed' | null) ?? 'open',
        closed_date: (item.employee_request_form_closed_date as string | null) ?? null,
        closed_category: metadata?.closed_category ?? null,
        reason: metadata?.reason ?? null,
        created_at: (item.created_at as string | null) ?? null,
        updated_at: (item.updated_at as string | null) ?? null,
      }
    })
  }

  async getAll(): Promise<EmployeeRequestForm[]> {
    const baseItems = await this.fetchBaseItems()
    const [itemsWithBusinessUnits, itemsWithCreators, itemsWithApprovals] = await Promise.all([
      this.attachBusinessUnits(baseItems),
      this.attachCreatorNames(baseItems),
      this.attachApprovalSummaries(baseItems),
    ])

    return this.attachPassedCandidateNames(
      itemsWithApprovals.map((item, index) => ({
        ...item,
        business_unit: itemsWithBusinessUnits[index]?.business_unit ?? null,
        created_by_name: itemsWithCreators[index]?.created_by_name ?? null,
      })),
    )
  }

  async getById(
    id: string,
    options: EmployeeRequestFormGetByIdOptions = {},
  ): Promise<EmployeeRequestForm | null> {
    const { includeSupplementaryData = true } = options
    const accessScope = await this.getAccessScope()
    let query = supabase
      .from('employee_request_form')
      .select(
        `
      *,
      recruiter_profile:profiles!employee_request_form_recruiter_user_id_fkey(
        full_name,
        username,
        email
      ),
      approval_director_bu_profile:profiles!employee_request_form_approval_director_bu_id_fkey(
        full_name,
        username,
        main_position
      ),
      pt:master_pt(id, name),
      department_ref:master_department(id, name),
      master_designation_ref:master_designation(id, name),
      custom_grup_1:master_custom_grup_1(name),
      custom_grup_2:master_custom_grup_2(name),
      custom_grup_3:master_custom_grup_3(name),
      custom_grup_4:master_custom_grup_4(name),
      custom_grup_5:master_custom_grup_5(name),
      custom_grup_6:master_custom_grup_6(name)
    `,
      )
      .eq('id', id)

    if (accessScope.isManager && accessScope.userId) {
      query = query.eq('created_by', accessScope.userId)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    const detailPayload = data ?? (await this.fetchEmployeeRequestFormDetailByApi(id))

    if (!detailPayload) return null

    const [baseItem] = await this.attachBusinessUnits([this.flattenCustomGroups(detailPayload)])
    if (!baseItem) return null

    const [itemWithCreatorName] = await this.attachCreatorNames([baseItem])
    if (!itemWithCreatorName) return null

    if (!includeSupplementaryData) {
      return itemWithCreatorName
    }

    const [itemsWithApprovals] = await Promise.all([this.attachApprovalSummaries([baseItem])])
    const [job] = await this.attachPassedCandidateNames([
      {
        ...itemsWithApprovals[0],
        created_by_name: itemWithCreatorName.created_by_name ?? null,
      } as EmployeeRequestForm,
    ])
    return job ?? null
  }

  private async fetchEmployeeRequestFormDetailByApi(id: string) {
    try {
      const payload = await callBackendApi<{
        employee_request_form?: Record<string, unknown> | null
      }>(`/api/employee-request-forms/${encodeURIComponent(id)}`)

      return payload.employee_request_form ?? null
    } catch (error) {
      const message = error instanceof Error ? error.message.trim().toLowerCase() : ''

      if (message.includes('job request data not found') || message.includes('http 404')) {
        return null
      }

      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  private flattenCustomGroups(item: any): EmployeeRequestForm {
    const recruiterName = String(
      item.recruiter_profile?.full_name ??
        item.recruiter_profile?.username ??
        item.recruiter_profile?.email ??
        '',
    ).trim()

    return {
      ...item,
      recruiter_user_id: item.recruiter_user_id ?? null,
      recruiter_name: recruiterName || item.recruiter_name || null,
      pt_id: item.pt_id ?? item.pt?.id ?? null,
      pt_pembebanan: item.pt?.name ?? item.pt_pembebanan ?? null,
      bu_id: item.bu_id ?? null,
      department_id: item.department_id ?? item.department_ref?.id ?? null,
      department: item.department_ref?.name ?? item.department ?? null,
      business_unit: item.business_unit ?? null,
      master_designation_id: item.master_designation_id ?? item.master_designation_ref?.id ?? null,
      designation:
        item.master_designation_ref?.name ?? item.designation ?? null,
      approval_director_bu_id: item.approval_director_bu_id ?? null,
      approval_director_bu_label: buildProfileDisplayLabel(item.approval_director_bu_profile),
      approval_director_bu: item.approval_director_bu ?? null,
      custom_grup_1: item.custom_grup_1?.name ?? null,
      custom_grup_2: item.custom_grup_2?.name ?? null,
      custom_grup_3: item.custom_grup_3?.name ?? null,
      custom_grup_4: item.custom_grup_4?.name ?? null,
      custom_grup_5: item.custom_grup_5?.name ?? null,
      custom_grup_6: item.custom_grup_6?.name ?? null,
      organizational_structure: Array.isArray(item.organizational_structure)
        ? item.organizational_structure.filter(
            (value: unknown) => typeof value === 'string' && value.trim(),
          )
        : [],
      job_description: Array.isArray(item.job_description)
        ? item.job_description.filter((value: unknown) => typeof value === 'string' && value.trim())
        : [],
      document_erf: Array.isArray(item.document_erf)
        ? item.document_erf.filter((value: unknown) => typeof value === 'string' && value.trim())
        : [],
    }
  }

  private async attachBusinessUnits(items: EmployeeRequestForm[]): Promise<EmployeeRequestForm[]> {
    const buIds = Array.from(
      new Set(items.map((item) => String(item.bu_id ?? '').trim()).filter(Boolean)),
    )

    if (buIds.length === 0) {
      return items
    }

    const { data: businessUnits, error: businessUnitError } = await supabase
      .from('master_bu')
      .select('id, name')
      .in('id', buIds)

    if (businessUnitError) {
      throw new Error(businessUnitError.message)
    }

    const businessUnitNameById = new Map<string, string>()
    for (const businessUnit of businessUnits ?? []) {
      const buId = String(businessUnit.id ?? '').trim()
      const name = String(businessUnit.name ?? '').trim()
      if (buId && name) {
        businessUnitNameById.set(buId, name)
      }
    }

    return items.map((item) => {
      const buId = String(item.bu_id ?? '').trim()
      return {
        ...item,
        business_unit: buId
          ? (businessUnitNameById.get(buId) ?? item.business_unit ?? null)
          : (item.business_unit ?? null),
      }
    })
  }

  private async attachCreatorNames(items: EmployeeRequestForm[]): Promise<EmployeeRequestForm[]> {
    const creatorIds = Array.from(new Set(items.map((item) => item.created_by).filter(Boolean)))

    if (creatorIds.length === 0) {
      return items
    }

    const { data: creators, error } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .in('id', creatorIds)

    if (error) {
      throw new Error(error.message)
    }

    const creatorNameMap = new Map<string, string>()
    for (const creator of creators ?? []) {
      const fullName = String(creator.full_name ?? creator.username ?? '').trim()

      if (fullName) {
        creatorNameMap.set(creator.id, fullName)
      }
    }

    return items.map((item) => ({
      ...item,
      created_by_name: item.created_by ? (creatorNameMap.get(item.created_by) ?? null) : null,
    }))
  }

  private async attachApprovalSummaries(
    items: EmployeeRequestForm[],
  ): Promise<EmployeeRequestForm[]> {
    const employeeRequestFormIds = Array.from(new Set(items.map((item) => item.id).filter(Boolean)))

    if (employeeRequestFormIds.length === 0) {
      return items
    }

    const [chainsResult, approverMasterResult] = await Promise.all([
      supabase
        .from('approval_chains')
        .select(
          'id, employee_request_form_id, created_at, updated_at, steps:approval_steps(step_order, approval_role_label, approver_name, approved_at, status)',
        )
        .in('employee_request_form_id', employeeRequestFormIds)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('approver_master').select('approval_flow_key, step_order, approval_role_label'),
    ])

    if (chainsResult.error) {
      throw new Error(chainsResult.error.message)
    }

    if (approverMasterResult.error) {
      throw new Error(approverMasterResult.error.message)
    }

    const chains = chainsResult.data ?? []
    const approverMasterLabelByFlowAndStep = new Map<string, string>()
    const availableApproverFlowKeys = new Set<string>()
    for (const approverMaster of approverMasterResult.data ?? []) {
      const flowKey = String(approverMaster.approval_flow_key ?? '').trim()
      const stepOrder = Number(approverMaster.step_order ?? 0)
      const label = String(approverMaster.approval_role_label ?? '').trim()

      if (!flowKey) {
        continue
      }

      availableApproverFlowKeys.add(flowKey)

      if (stepOrder < 1 || !label) {
        continue
      }
      approverMasterLabelByFlowAndStep.set(`${flowKey}:${stepOrder}`, label)
    }

    const latestChainByEmployeeRequestFormId = new Map<string, Record<string, unknown>>()

    for (const chain of chains) {
      const employeeRequestFormId = String(chain.employee_request_form_id ?? '')
      if (!employeeRequestFormId || latestChainByEmployeeRequestFormId.has(employeeRequestFormId)) {
        continue
      }

      latestChainByEmployeeRequestFormId.set(
        employeeRequestFormId,
        chain as Record<string, unknown>,
      )
    }

    return items.map((item) => {
      const latestChain = latestChainByEmployeeRequestFormId.get(item.id)
      const flowKey = resolveConfiguredApprovalFlowKeyFromDesignation(
        item.master_designation_id,
        availableApproverFlowKeys,
      )
      const dynamicApprovalSteps = Array.isArray(latestChain?.steps)
        ? latestChain.steps
            .map((step) => {
              const record = step as Record<string, unknown>
              const stepOrder = Number(record.step_order ?? 0)
              const storedLabel = String(record.approval_role_label ?? '').trim()
              const fallbackLabel =
                approverMasterLabelByFlowAndStep.get(`${flowKey}:${stepOrder}`) ??
                getApprovalFlowTemplate(flowKey).steps.find(
                  (templateStep) => templateStep.stepOrder === stepOrder,
                )?.label ??
                null

              return {
                step_order: stepOrder,
                approval_role_label: storedLabel || fallbackLabel,
                approver_name: (record.approver_name as string | null) ?? null,
                approved_at: (record.approved_at as string | null) ?? null,
                status: (record.status as string | null) ?? null,
              }
            })
            .filter((step) => step.step_order > 0)
            .sort((left, right) => left.step_order - right.step_order)
        : []
      const approvalSummary = buildApprovalSummary(dynamicApprovalSteps, {
        approval_director_bu: item.approval_director_bu,
        approval_director_bu_date: item.approval_director_bu_date,
        approval_gm_hrd: item.approval_gm_hrd,
        approval_gm_hrd_date: item.approval_gm_hrd_date,
        approval_director_hrd: item.approval_director_hrd,
        approval_director_hrd_date: item.approval_director_hrd_date,
      })

      return {
        ...item,
        approval_steps: dynamicApprovalSteps,
        ...approvalSummary,
      }
    })
  }

  private async attachPassedCandidateNames(
    items: EmployeeRequestForm[],
  ): Promise<EmployeeRequestForm[]> {
    const employeeRequestFormIds = Array.from(new Set(items.map((item) => item.id).filter(Boolean)))

    if (employeeRequestFormIds.length === 0) {
      return items
    }

    try {
      const payload = await callBackendApi<{
        passed_candidates: Array<{
          employee_request_form_id: string
          full_name: string | null
          email: string | null
          interview_date: string | null
        }>
        recruitment_flow_stages?: Array<{
          employee_request_form_id: string
          stage: EmployeeRequestForm['recruitment_flow_stage']
        }>
        vacancy_statuses?: Array<{
          employee_request_form_id: string
          status: VacancyStatus
        }>
        vacancy_pipeline?: Array<{
          employee_request_form_id: string
          candidate_count: number
          interview_scheduled_count: number
        }>
      }>('/api/employee-request-forms/passed-candidates', {
        method: 'POST',
        body: JSON.stringify({
          employee_request_form_ids: employeeRequestFormIds,
        }),
      })

      const namesByEmployeeRequestFormId = new Map<string, string[]>()
      const recruitmentFlowStageByEmployeeRequestFormId = new Map<
        string,
        EmployeeRequestForm['recruitment_flow_stage']
      >()
      const vacancyStatusByEmployeeRequestFormId = new Map<string, VacancyStatus>()
      const vacancyPipelineByEmployeeRequestFormId = new Map<
        string,
        { candidate_count: number; interview_scheduled_count: number }
      >()

      for (const candidate of payload.passed_candidates ?? []) {
        const employeeRequestFormId = String(candidate.employee_request_form_id ?? '').trim()
        const candidateName = String(candidate.full_name ?? candidate.email ?? '').trim()

        if (!employeeRequestFormId || !candidateName) {
          continue
        }

        const current = namesByEmployeeRequestFormId.get(employeeRequestFormId) ?? []
        current.push(candidateName)
        namesByEmployeeRequestFormId.set(employeeRequestFormId, current)
      }

      for (const vacancyStatus of payload.vacancy_statuses ?? []) {
        const employeeRequestFormId = String(vacancyStatus.employee_request_form_id ?? '').trim()
        if (employeeRequestFormId) {
          vacancyStatusByEmployeeRequestFormId.set(employeeRequestFormId, vacancyStatus.status)
        }
      }

      for (const recruitmentFlowStage of payload.recruitment_flow_stages ?? []) {
        const employeeRequestFormId = String(
          recruitmentFlowStage.employee_request_form_id ?? '',
        ).trim()
        if (employeeRequestFormId) {
          recruitmentFlowStageByEmployeeRequestFormId.set(
            employeeRequestFormId,
            recruitmentFlowStage.stage ?? null,
          )
        }
      }

      for (const pipeline of payload.vacancy_pipeline ?? []) {
        const employeeRequestFormId = String(pipeline.employee_request_form_id ?? '').trim()
        if (employeeRequestFormId) {
          vacancyPipelineByEmployeeRequestFormId.set(employeeRequestFormId, {
            candidate_count: Number(pipeline.candidate_count ?? 0),
            interview_scheduled_count: Number(pipeline.interview_scheduled_count ?? 0),
          })
        }
      }

      return items.map((item) => ({
        ...item,
        passed_candidate_name: namesByEmployeeRequestFormId.get(item.id)?.join(', ') ?? null,
        recruitment_flow_stage: recruitmentFlowStageByEmployeeRequestFormId.has(item.id)
          ? (recruitmentFlowStageByEmployeeRequestFormId.get(item.id) ?? null)
          : (item.recruitment_flow_stage ?? null),
        vacancy_status: vacancyStatusByEmployeeRequestFormId.get(item.id) ?? 'request',
        vacancy_candidate_count:
          vacancyPipelineByEmployeeRequestFormId.get(item.id)?.candidate_count ?? 0,
        vacancy_interview_scheduled_count:
          vacancyPipelineByEmployeeRequestFormId.get(item.id)?.interview_scheduled_count ?? 0,
      }))
    } catch (err) {
      console.error('Failed to load ERF candidate vacancy data:', err)
      return items.map((item) => ({
        ...item,
        passed_candidate_name: null,
        recruitment_flow_stage: item.recruitment_flow_stage ?? null,
        vacancy_status: 'request',
        vacancy_candidate_count: 0,
        vacancy_interview_scheduled_count: 0,
      }))
    }
  }

  private async attachListRecruitmentStatuses(
    items: EmployeeRequestForm[],
  ): Promise<EmployeeRequestForm[]> {
    const employeeRequestFormIds = Array.from(new Set(items.map((item) => item.id).filter(Boolean)))

    if (employeeRequestFormIds.length === 0) {
      return items
    }

    try {
      const payload = await callBackendApi<{
        recruitment_flow_stages?: Array<{
          employee_request_form_id: string
          stage: EmployeeRequestForm['recruitment_flow_stage']
        }>
        vacancy_statuses?: Array<{
          employee_request_form_id: string
          status: VacancyStatus
        }>
      }>('/api/employee-request-forms/list-statuses', {
        method: 'POST',
        body: JSON.stringify({
          employee_request_form_ids: employeeRequestFormIds,
        }),
      })

      const recruitmentFlowStageByEmployeeRequestFormId = new Map<
        string,
        EmployeeRequestForm['recruitment_flow_stage']
      >()
      const vacancyStatusByEmployeeRequestFormId = new Map<string, VacancyStatus>()

      for (const vacancyStatus of payload.vacancy_statuses ?? []) {
        const employeeRequestFormId = String(vacancyStatus.employee_request_form_id ?? '').trim()
        if (employeeRequestFormId) {
          vacancyStatusByEmployeeRequestFormId.set(employeeRequestFormId, vacancyStatus.status)
        }
      }

      for (const recruitmentFlowStage of payload.recruitment_flow_stages ?? []) {
        const employeeRequestFormId = String(
          recruitmentFlowStage.employee_request_form_id ?? '',
        ).trim()
        if (employeeRequestFormId) {
          recruitmentFlowStageByEmployeeRequestFormId.set(
            employeeRequestFormId,
            recruitmentFlowStage.stage ?? null,
          )
        }
      }

      return items.map((item) => ({
        ...item,
        passed_candidate_name: item.passed_candidate_name ?? null,
        recruitment_flow_stage: recruitmentFlowStageByEmployeeRequestFormId.has(item.id)
          ? (recruitmentFlowStageByEmployeeRequestFormId.get(item.id) ?? null)
          : (item.recruitment_flow_stage ?? null),
        vacancy_status: vacancyStatusByEmployeeRequestFormId.get(item.id) ?? 'request',
        vacancy_candidate_count: item.vacancy_candidate_count ?? 0,
        vacancy_interview_scheduled_count: item.vacancy_interview_scheduled_count ?? 0,
      }))
    } catch (err) {
      console.error('Failed to load ERF list recruitment statuses:', err)
      return items.map((item) => ({
        ...item,
        passed_candidate_name: item.passed_candidate_name ?? null,
        recruitment_flow_stage: item.recruitment_flow_stage ?? null,
        vacancy_status: item.vacancy_status ?? 'request',
        vacancy_candidate_count: item.vacancy_candidate_count ?? 0,
        vacancy_interview_scheduled_count: item.vacancy_interview_scheduled_count ?? 0,
      }))
    }
  }

  async create(
    data: EmployeeRequestFormRequest,
    options: EmployeeRequestFormMutationOptions = {},
  ): Promise<EmployeeRequestForm> {
    const accessScope = await this.getAccessScope()
    const actorUserId = accessScope.userId ?? null
    const masterDataIds = await this.resolveMasterDataIds(data)
    const requesterUserId = this.resolveRequesterUserId(data, accessScope, {
      actorUserId,
      isCreate: true,
    })

    const payload = {
      ...this.mapInput(data, masterDataIds),
      created_by: requesterUserId,
      updated_by: actorUserId,
      created_at: getJakartaTimestamp(),
      updated_at: getJakartaTimestamp(),
    }

    const { data: created, error } = await supabase
      .from('employee_request_form')
      .insert(payload)
      .select('id')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Automatically trigger approval chain.
    // If approval or email delivery fails, surface the error so the user knows
    // the ERF did not enter the approval flow correctly.
    if (created) {
      try {
        const { approvalRepo } = getInfrastructureRepositories()
        await approvalRepo.submitForApproval({
          employee_request_form_id: created.id,
          auto_approval: Boolean(data.auto_approval),
        })
      } catch (err) {
        console.error('Failed to start approval chain:', err)

        const message = err instanceof Error ? err.message : 'Failed to start ERF approval flow.'

        throw new Error(`ERF was saved, but approval flow could not start: ${message}`)
      }
    }

    if (options.reloadRecord === false) {
      return { id: created.id } as EmployeeRequestForm
    }

    const createdEmployeeRequestForm = await this.getById(created.id)

    if (!createdEmployeeRequestForm) {
      throw new Error('Failed to load the newly created Employee Request Form.')
    }

    return createdEmployeeRequestForm
  }

  async update(
    id: string,
    data: EmployeeRequestFormRequest,
    options: EmployeeRequestFormMutationOptions = {},
  ): Promise<EmployeeRequestForm> {
    const accessScope = await this.getAccessScope()
    const masterDataIds = await this.resolveMasterDataIds(data)
    const requesterUserId = this.resolveRequesterUserId(data, accessScope, {
      actorUserId: accessScope.userId ?? null,
      isCreate: false,
    })
    const payload = {
      ...this.mapInput(data, masterDataIds),
      updated_by: accessScope.userId ?? null,
      updated_at: getJakartaTimestamp(),
      ...(typeof requesterUserId === 'string' ? { created_by: requesterUserId } : {}),
    }

    let query = supabase.from('employee_request_form').update(payload).eq('id', id)

    if (accessScope.isManager && accessScope.userId) {
      query = query.eq('created_by', accessScope.userId)
    }

    const { data: updated, error } = await query.select('id').maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    if (!updated) {
      throw new Error('Job request data not found or inaccessible.')
    }

    if (options.reloadRecord === false) {
      return { id: updated.id } as EmployeeRequestForm
    }

    const updatedEmployeeRequestForm = await this.getById(id)

    if (!updatedEmployeeRequestForm) {
      throw new Error('Failed to load the updated Employee Request Form.')
    }

    return updatedEmployeeRequestForm
  }

  async assignRecruiter(id: string, recruiterUserId: string): Promise<void> {
    const accessScope = await this.getAccessScope()
    const normalizedRecruiterUserId = String(recruiterUserId ?? '').trim()

    if (!normalizedRecruiterUserId) {
      throw new Error('Recruiter is required.')
    }

    const employeeRequestForm = await this.getById(id)
    if (!employeeRequestForm) {
      throw new Error('Job request data not found or inaccessible.')
    }

    const recruitmentFlowStage = resolveRecruitmentFlowStage({
      employeeRequestForm,
    })

    if (
      employeeRequestForm.status !== 'open' ||
      !['erf_approved', 'assign_recruiter'].includes(recruitmentFlowStage)
    ) {
      throw new Error('Only approved ERFs can be assigned to recruiters.')
    }

    let query = supabase
      .from('employee_request_form')
      .update({
        recruiter_user_id: normalizedRecruiterUserId,
        recruitment_flow_stage: 'assign_recruiter',
        updated_by: accessScope.userId ?? null,
        updated_at: getJakartaTimestamp(),
      })
      .eq('id', id)
      .eq('status', 'open')

    if (accessScope.isManager && accessScope.userId) {
      query = query.eq('created_by', accessScope.userId)
    }

    const { data, error } = await query.select('id').maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error('Job request data not found or inaccessible.')
    }
  }

  async delete(id: string): Promise<void> {
    await callBackendApi(`/api/employee-request-forms/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  }

  async close(
    id: string,
    category: 'canceled' | 'done' | 'employee hired',
    reason: string,
  ): Promise<void> {
    await callBackendApi(`/api/employee-request-forms/${encodeURIComponent(id)}/close`, {
      method: 'POST',
      body: JSON.stringify({
        category,
        reason,
      }),
    })
  }

  private async getAccessScope() {
    const accessScope = await getAuthAccessScope()

    return {
      isManager: accessScope.isManager,
      permissions: accessScope.permissions ?? [],
      userId: accessScope.userId,
    }
  }

  private resolveRequesterUserId(
    data: EmployeeRequestFormRequest,
    accessScope: { isManager: boolean; permissions: string[]; userId: string | null },
    options: { actorUserId: string | null; isCreate: boolean },
  ) {
    const { actorUserId, isCreate } = options
    const requestedUserId = String(data.created_by ?? '').trim() || null
    const canUpdateRequester = accessScope.permissions.includes(
      'employee_request_form:requester_update',
    )

    if (isCreate) {
      return canUpdateRequester ? (requestedUserId ?? actorUserId) : actorUserId
    }

    if (!canUpdateRequester) {
      return undefined
    }

    return requestedUserId ?? undefined
  }

  private async resolveMasterDataIds(data: EmployeeRequestFormRequest) {
    const ptName = String(data.pt_pembebanan ?? '').trim()
    const departmentName = String(data.department ?? '').trim()
    const masterDesignationId = String(data.master_designation_id ?? '').trim()

    const [ptResult, departmentResult, masterDesignationResult] =
      await Promise.all([
        ptName
          ? supabase.from('master_pt').select('id').eq('name', ptName).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        departmentName
          ? supabase.from('master_department').select('id').eq('name', departmentName).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        // Designation is resolved only from master_designation_id.
        masterDesignationId
          ? supabase
              .from('master_designation')
              .select('id')
              .eq('id', masterDesignationId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ])

    if (ptResult.error) throw new Error(ptResult.error.message)
    if (departmentResult.error) throw new Error(departmentResult.error.message)
    if (masterDesignationResult.error) throw new Error(masterDesignationResult.error.message)

    return {
      pt_id: data.pt_id || ptResult.data?.id || null,
      bu_id: data.bu_id || null,
      department_id: data.department_id || departmentResult.data?.id || null,
      master_designation_id: masterDesignationId || null,
    }
  }

  private mapInput(
    data: EmployeeRequestFormRequest,
    masterDataIds: {
      pt_id: string | null
      bu_id: string | null
      department_id: string | null
      master_designation_id: string | null
    },
  ) {
    const organizationalStructure = (data.organizational_structure ?? []).filter((value) =>
      String(value ?? '').trim(),
    )
    const jobDescription = (data.job_description ?? []).filter((value) =>
      String(value ?? '').trim(),
    )
    const documentErf = (data.document_erf ?? []).filter((value) => String(value ?? '').trim())

    return {
      pt_id: masterDataIds.pt_id,
      bu_id: masterDataIds.bu_id,
      department_id: masterDataIds.department_id,
      master_designation_id: masterDataIds.master_designation_id,
      employment_status: data.employment_status || null,
      approval_director_bu_id: data.approval_director_bu_id || null,
      direct_manager: data.direct_manager || null,
      site: data.site || null,
      working_location: data.working_location || null,
      requested_date: data.requested_date || null,
      custom_grup_1_id: data.custom_grup_1_id || null,
      custom_grup_2_id: data.custom_grup_2_id || null,
      custom_grup_3_id: data.custom_grup_3_id || null,
      custom_grup_4_id: data.custom_grup_4_id || null,
      custom_grup_5_id: data.custom_grup_5_id || null,
      custom_grup_6_id: data.custom_grup_6_id || null,
      status: data.status ?? 'open',
      closed_date: data.closed_date || null,
      closed_category: data.closed_category || null,
      reason: data.reason || null,
      required_date: data.required_date || null,
      position_status: data.position_status || null,
      periode_probation: data.periode_probation ?? null,
      main_position: data.main_position || null,
      organizational_structure: organizationalStructure.length > 0 ? organizationalStructure : null,
      job_description: jobDescription.length > 0 ? jobDescription : null,
      document_erf: documentErf.length > 0 ? documentErf : null,
    }
  }
}

function buildProfileDisplayLabel(
  profile:
    | { full_name?: string | null; username?: string | null; main_position?: string | null }
    | null
    | undefined,
) {
  const fullName = String(profile?.full_name ?? profile?.username ?? '').trim()
  const mainPosition = String(profile?.main_position ?? '').trim()

  if (!fullName) {
    return null
  }

  return mainPosition ? `${fullName} - ${mainPosition}` : fullName
}
