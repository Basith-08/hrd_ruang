import { supabase } from '@/infrastructure/supabase/client'
import { getAuthAccessScope } from '@/infrastructure/auth/accessScope'
import type { RecruitmentTracking } from '@/domain/entities/RecruitmentTracking'
import type { RecruitmentTrackingRepository } from '@/domain/repositories/RecruitmentTrackingRepository'
import { buildApprovalSummary } from '@/domain/utils/approvalSummary'

export class RecruitmentTrackingRepositoryImpl implements RecruitmentTrackingRepository {
  async getAll(): Promise<RecruitmentTracking[]> {
    const accessScope = await this.getAccessScope()
    let query = supabase
      .from('recruitment_queue_view')
      .select('*')

    if (accessScope.isManager) {
      if (accessScope.employeeRequestFormIds.length === 0) {
        return []
      }

      query = query.in('employee_request_form_id', accessScope.employeeRequestFormIds)
    }

    const { data, error } = await query.order('updated_at', { ascending: false })

    if (error) throw new Error(error.message)

    const normalizedItems = (data ?? []).map(this.normalizeTracking)
    const itemsWithBusinessUnits = await this.attachBusinessUnits(normalizedItems)

    return this.attachApprovalSummaries(itemsWithBusinessUnits)
  }

  async getById(id: string): Promise<RecruitmentTracking | null> {
    const accessScope = await this.getAccessScope()
    let query = supabase
      .from('recruitment_queue_view')
      .select('*')
      .eq('id', id)

    if (accessScope.isManager) {
      if (accessScope.employeeRequestFormIds.length === 0) {
        return null
      }

      query = query.in('employee_request_form_id', accessScope.employeeRequestFormIds)
    }

    const { data, error } = await query.maybeSingle()

    if (error) throw new Error(error.message)

    if (!data) return null

    const [tracking] = await this.attachBusinessUnits([this.normalizeTracking(data)])
      .then((items) => this.attachApprovalSummaries(items))
    return tracking ?? null
  }

  private async getAccessScope() {
    const accessScope = await getAuthAccessScope()
    const isManager = accessScope.isManager

    if (!isManager) {
      return {
        isManager: false,
        employeeRequestFormIds: [] as string[],
      }
    }

    const { data: ownedEmployeeRequestForms, error: ownedEmployeeRequestFormsError } = await supabase
      .from('employee_request_form')
      .select('id')
      .eq('created_by', accessScope.userId)

    if (ownedEmployeeRequestFormsError) {
      throw new Error(ownedEmployeeRequestFormsError.message)
    }

    return {
      isManager: true,
      employeeRequestFormIds: (ownedEmployeeRequestForms ?? []).map(
        (employeeRequestForm: any) => String(employeeRequestForm.id),
      ),
    }
  }

  private normalizeTracking(data: Record<string, unknown>): RecruitmentTracking {
    return {
      id: String(data.id ?? ''),
      chain_id: (data.chain_id as string | null) ?? null,
      employee_request_form_id: String(data.employee_request_form_id ?? ''),
      created_at: (data.created_at as string | null) ?? null,
      updated_at: (data.updated_at as string | null) ?? null,
        employee_request_form: data.employee_request_form_id
        ? {
            id: String(data.employee_request_form_id),
            requested_date: (data.employee_request_form_requested_date as string | null) ?? null,
            pt_pembebanan: (data.employee_request_form_pt_pembebanan as string | null) ?? null,
            bu_id: (data.employee_request_form_bu_id as string | null) ?? null,
            business_unit: (data.employee_request_form_business_unit as string | null) ?? null,
            department: (data.employee_request_form_department as string | null) ?? null,
            designation: (data.employee_request_form_designation as string | null) ?? null,
            job_level: (data.employee_request_form_job_level as string | null) ?? null,
            direct_manager: (data.employee_request_form_direct_manager as string | null) ?? null,
            main_position: (data.employee_request_form_main_position as string | null) ?? null,
            site: (data.employee_request_form_site as string | null) ?? null,
            working_location:
              (data.employee_request_form_working_location as string | null) ?? null,
            employment_status:
              (data.employee_request_form_employment_status as string | null) ?? null,
            position_status:
              (data.employee_request_form_position_status as string | null) ?? null,
            required_date: (data.employee_request_form_required_date as string | null) ?? null,
            recruiter_user_id:
              (data.employee_request_form_recruiter_user_id as string | null) ?? null,
            recruiter_name:
              (data.employee_request_form_recruiter_name as string | null) ?? null,
            status:
              ((data.employee_request_form_status as 'open' | 'closed' | null) ?? null),
            closed_date: (data.employee_request_form_closed_date as string | null) ?? null,
            closed_category:
              ((data.employee_request_form_closed_category as 'employee hired' | 'canceled' | null) ?? null),
            reason: (data.employee_request_form_reason as string | null) ?? null,
            notes: (data.employee_request_form_notes as string | null) ?? null,
            custom_grup_1: (data.employee_request_form_custom_grup_1 as string | null) ?? null,
            custom_grup_2: (data.employee_request_form_custom_grup_2 as string | null) ?? null,
            custom_grup_3: (data.employee_request_form_custom_grup_3 as string | null) ?? null,
            custom_grup_4: (data.employee_request_form_custom_grup_4 as string | null) ?? null,
            custom_grup_5: (data.employee_request_form_custom_grup_5 as string | null) ?? null,
            custom_grup_6: (data.employee_request_form_custom_grup_6 as string | null) ?? null,
            approval_director_bu:
              (data.employee_request_form_approval_director_bu as string | null) ?? null,
            approval_director_bu_date:
              (data.employee_request_form_approval_director_bu_date as string | null) ?? null,
            approval_gm_hrd:
              (data.employee_request_form_approval_gm_hrd as string | null) ?? null,
            approval_gm_hrd_date:
              (data.employee_request_form_approval_gm_hrd_date as string | null) ?? null,
            approval_director_hrd:
              (data.employee_request_form_approval_director_hrd as string | null) ?? null,
            approval_director_hrd_date:
              (data.employee_request_form_approval_director_hrd_date as string | null) ?? null,
            candidate_name:
              (data.employee_request_form_candidate_name as string | null) ?? null,
            recruitment_flow_stage:
              (data.employee_request_form_recruitment_flow_stage as string | null) ?? null,
          }
        : null,
    }
  }

  private async attachBusinessUnits(items: RecruitmentTracking[]): Promise<RecruitmentTracking[]> {
    const buIds = Array.from(
      new Set(
        items
          .map((item) => String(item.employee_request_form?.bu_id ?? '').trim())
          .filter(Boolean),
      ),
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
      const employeeRequestForm = item.employee_request_form
      if (!employeeRequestForm) {
        return item
      }

      const buId = String(employeeRequestForm.bu_id ?? '').trim()

      return {
        ...item,
        employee_request_form: {
          ...employeeRequestForm,
          business_unit: buId
            ? businessUnitNameById.get(buId) ?? employeeRequestForm.business_unit ?? null
            : employeeRequestForm.business_unit ?? null,
        },
      }
    })
  }

  private async attachApprovalSummaries(items: RecruitmentTracking[]): Promise<RecruitmentTracking[]> {
    const chainIds = Array.from(new Set(items.map((item) => item.chain_id).filter(Boolean)))
    const employeeRequestFormIds = Array.from(
      new Set(items.map((item) => item.employee_request_form?.id).filter(Boolean)),
    )

    const [chainsResult, employeeRequestFormsResult] = await Promise.all([
      chainIds.length === 0
        ? Promise.resolve({
            data: [] as Array<Record<string, unknown>>,
            error: null as { message: string } | null,
          })
        : supabase
            .from('approval_chains')
            .select('id, steps:approval_steps(step_order, approver_name, approved_at, status)')
            .in('id', chainIds),
      employeeRequestFormIds.length === 0
        ? Promise.resolve({
            data: [] as Array<Record<string, unknown>>,
            error: null as { message: string } | null,
          })
        : supabase
            .from('employee_request_form')
            .select(`
              id,
              closed_category,
              reason,
              notes,
              recruiter_user_id,
              recruiter_profile:profiles!employee_request_form_recruiter_user_id_fkey(
                full_name,
                username,
                email
              )
            `)
            .in('id', employeeRequestFormIds),
    ])

    if (chainsResult.error) {
      throw new Error(chainsResult.error.message)
    }

    if (employeeRequestFormsResult.error) {
      throw new Error(employeeRequestFormsResult.error.message)
    }

    const chainMap = new Map<string, Record<string, unknown>>()
    for (const chain of chainsResult.data ?? []) {
      const chainId = String(chain.id ?? '')
      if (!chainId) continue
      chainMap.set(chainId, chain as Record<string, unknown>)
    }

    const employeeRequestFormMap = new Map<
      string,
      {
        closed_category: 'employee hired' | 'canceled' | null
        reason: string | null
        notes: string | null
        recruiter_user_id: string | null
        recruiter_name: string | null
      }
    >()

    for (const employeeRequestForm of employeeRequestFormsResult.data ?? []) {
      const employeeRequestFormId = String(employeeRequestForm.id ?? '')
      if (!employeeRequestFormId) continue

      const recruiterName = String(
        (employeeRequestForm.recruiter_profile as Record<string, unknown> | null | undefined)?.full_name
          ?? (employeeRequestForm.recruiter_profile as Record<string, unknown> | null | undefined)?.username
          ?? (employeeRequestForm.recruiter_profile as Record<string, unknown> | null | undefined)?.email
          ?? '',
      ).trim()

      employeeRequestFormMap.set(employeeRequestFormId, {
        closed_category:
          ((employeeRequestForm.closed_category as 'employee hired' | 'canceled' | null) ?? null),
        reason: (employeeRequestForm.reason as string | null) ?? null,
        notes: (employeeRequestForm.notes as string | null) ?? null,
        recruiter_user_id: (employeeRequestForm.recruiter_user_id as string | null) ?? null,
        recruiter_name: recruiterName || null,
      })
    }

    return items.map((item) => {
      if (!item.employee_request_form) {
        return item
      }

      const chain = item.chain_id ? chainMap.get(item.chain_id) : undefined
      const employeeRequestFormMetadata = employeeRequestFormMap.get(item.employee_request_form.id)
      const approvalSummary = buildApprovalSummary(
        Array.isArray(chain?.steps)
          ? chain.steps.map((step) => ({
              step_order: Number((step as Record<string, unknown>).step_order ?? 0),
              approver_name: ((step as Record<string, unknown>).approver_name as string | null) ?? null,
              approved_at: ((step as Record<string, unknown>).approved_at as string | null) ?? null,
              status: ((step as Record<string, unknown>).status as string | null) ?? null,
            }))
          : [],
        item.employee_request_form,
      )

      return {
        ...item,
        employee_request_form: {
          ...item.employee_request_form,
          closed_category: employeeRequestFormMetadata?.closed_category ?? item.employee_request_form.closed_category ?? null,
          reason: employeeRequestFormMetadata?.reason ?? item.employee_request_form.reason ?? null,
          notes: employeeRequestFormMetadata?.notes ?? item.employee_request_form.notes ?? null,
          recruiter_user_id:
            employeeRequestFormMetadata?.recruiter_user_id ?? item.employee_request_form.recruiter_user_id ?? null,
          recruiter_name:
            employeeRequestFormMetadata?.recruiter_name ?? item.employee_request_form.recruiter_name ?? null,
          ...approvalSummary,
        },
      }
    })
  }
}
