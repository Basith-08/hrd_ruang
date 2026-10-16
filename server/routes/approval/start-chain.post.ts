import { readBody } from 'h3'

import { createHttpError } from '~~/server/lib/errors.js'
import { runInBackground } from '~~/server/lib/backgroundTask.js'
import { getJakartaTimestamp } from '~~/server/lib/time.js'
import { isAdminRole } from '~~/server/lib/utils.js'
import { defineJsonHandler } from '~~/server/utils/api'
import { requireRequestContext } from '~~/server/utils/requestContext'
import { resolveTrustedAppOrigin } from '~~/server/utils/origin.js'
import { sendApprovalStepEmail } from '~~/server/services/approvalService.js'
import { syncRecruitmentFlowStage } from '~~/server/services/recruitmentFlowStageService.js'
import {
  getApprovalFlowTemplate,
  resolveConfiguredApprovalFlowKeyFromDesignation,
} from '~~/src/domain/utils/approvalFlowConfig'

/**
 * POST /approval/start-chain
 *
 * Creates an approval chain + steps for an ERF using the admin (service-role)
 * Supabase client so that RLS on `approval_chains` is not a barrier.
 *
 * The route validates that the calling user actually owns the ERF (manager) or
 * holds a permission that allows ERF write access (non-manager HRD staff).
 */
export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)

  const body = await readBody<{ employee_request_form_id?: string; auto_approval?: boolean }>(event)
  const erfId = String(body?.employee_request_form_id ?? '').trim()
  const isAutoApproval = Boolean(body?.auto_approval)

  if (!erfId) {
    throw createHttpError(400, 'employee_request_form_id is required.')
  }

  const supabase = context.supabase // admin client — bypasses RLS

  // ── 1. Load the ERF ─────────────────────────────────────────────────────────
  const { data: erf, error: erfError } = await supabase
    .from('employee_request_form')
    .select(
      `
      id,
      created_by,
      master_designation_id,
      approval_director_bu_id,
      master_designation_ref:master_designation(name),
      approval_director_bu_profile:profiles!employee_request_form_approval_director_bu_id_fkey(
        id,
        full_name,
        email,
        username
      )
    `,
    )
    .eq('id', erfId)
    .maybeSingle()

  if (erfError) throw new Error(erfError.message)
  if (!erf) throw createHttpError(404, 'Employee request form not found.')

  // ── 2. Authorise the caller ─────────────────────────────────────────────────
  const isManager = String(context.roleName ?? '').toLowerCase() === 'manager'
  const isAdmin = isAdminRole(context.roleName)

  const hasErfWritePermission = [
    'employee_request_form:create',
    'employee_request_form:update',
    'employee_request_form:delete',
    'employee_request_form:close',
  ].some((p) => context.permissions.includes(p))

  const isOwner = erf.created_by === context.userId

  const isAuthorised = isAdmin || (isManager && isOwner) || (!isManager && hasErfWritePermission)

  if (!isAuthorised) {
    throw createHttpError(
      403,
      'You do not have permission to start an approval chain for this ERF.',
    )
  }

  // ── 3. Guard: no duplicate active chain ─────────────────────────────────────
  const { data: existingChains, error: existingError } = await supabase
    .from('approval_chains')
    .select('id, status')
    .eq('employee_request_form_id', erfId)
    .in('status', ['draft', 'pending'])
    .order('created_at', { ascending: false })
    .limit(1)

  if (existingError) throw new Error(existingError.message)
  if (existingChains && existingChains.length > 0) {
    throw createHttpError(409, 'This ERF already has an active approval chain.')
  }

  // ── 3b. Auto Approval short-circuit ─────────────────────────────────────────
  // When the requester chose "Auto Approval" on the ERF form, skip the
  // designation-based approver flow entirely and record the ERF as already
  // approved via a single closed-out chain + step, attributed to the requester.
  if (isAutoApproval) {
    const { data: requesterProfile, error: requesterProfileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, username')
      .eq('id', erf.created_by)
      .maybeSingle()

    if (requesterProfileError) throw new Error(requesterProfileError.message)
    if (!requesterProfile?.email) {
      throw createHttpError(422, 'The ERF requester does not have a valid email for Auto Approval.')
    }

    const autoApprovalNow = getJakartaTimestamp()
    const requesterName =
      String(requesterProfile.full_name ?? requesterProfile.username ?? '').trim() ||
      'Auto Approval'

    const { data: autoChain, error: autoChainError } = await supabase
      .from('approval_chains')
      .insert({
        employee_request_form_id: erfId,
        created_by: context.userId,
        status: 'approved',
        created_at: autoApprovalNow,
        updated_at: autoApprovalNow,
      })
      .select('id')
      .single()

    if (autoChainError) throw new Error(autoChainError.message)

    const { error: autoStepError } = await supabase.from('approval_steps').insert({
      chain_id: autoChain.id,
      step_order: 1,
      approval_role_key: 'auto_approval',
      approval_role_label: 'Auto Approval',
      approver_email: requesterProfile.email as string,
      approver_name: requesterName,
      status: 'approved',
      approved_at: autoApprovalNow,
      notes: 'Automatically approved via Auto Approval option.',
      created_at: autoApprovalNow,
    })

    if (autoStepError) throw new Error(autoStepError.message)

    await syncRecruitmentFlowStage(supabase, erfId)

    return { ok: true, chain_id: autoChain.id }
  }

  // ── 4. Resolve approval flow from ERF designation ──────────────────────────
  // ── 5. Resolve approver masters for the matched flow ───────────────────────
  const { data: approverMasters, error: approverError } = await supabase
    .from('approver_master')
    .select('*, profile:profiles!approver_master_profile_id_fkey(full_name, email, username)')
    .order('approval_flow_key', { ascending: true })
    .order('step_order', { ascending: true })

  if (approverError) throw new Error(approverError.message)
  const availableFlowKeys = new Set(
    (approverMasters ?? [])
      .map((item) => String(item.approval_flow_key ?? '').trim())
      .filter(Boolean),
  )
  const approvalFlowKey = resolveConfiguredApprovalFlowKeyFromDesignation(
    erf.master_designation_id,
    availableFlowKeys,
  )

  if (!approvalFlowKey) {
    throw createHttpError(
      422,
      'No designation approval flow configured. Please configure Approval Master first.',
    )
  }

  const approvalFlowTemplate = getApprovalFlowTemplate(approvalFlowKey)
  const matchedApproverMasters = (approverMasters ?? []).filter(
    (item) => String(item.approval_flow_key ?? '').trim() === approvalFlowTemplate.key,
  )

  if (matchedApproverMasters.length === 0) {
    throw createHttpError(
      422,
      `No approvers registered for ${approvalFlowTemplate.title}. Please configure Approval Master first.`,
    )
  }

  function buildFullName(
    profile: { full_name?: string | null; username?: string | null } | null | undefined,
  ) {
    return String(profile?.full_name ?? profile?.username ?? '').trim()
  }

  const selectedDirectorBuApproverId = String(erf.approval_director_bu_id ?? '').trim()

  if (selectedDirectorBuApproverId && !erf.approval_director_bu_profile?.email) {
    throw createHttpError(422, 'Selected Director BU is not configured correctly.')
  }

  // ── 6. Insert the chain ──────────────────────────────────────────────────────
  const now = getJakartaTimestamp()

  const { data: chain, error: chainError } = await supabase
    .from('approval_chains')
    .insert({
      employee_request_form_id: erfId,
      created_by: context.userId,
      status: 'pending',
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single()

  if (chainError) throw new Error(chainError.message)

  // ── 7. Insert the steps ──────────────────────────────────────────────────────
  const steps = matchedApproverMasters.map((approverMaster, index) => {
    const approvalRoleLabel =
      String(approverMaster?.approval_role_label ?? '').trim() || `Approval Step ${index + 1}`
    const approvalRoleKey =
      String(approverMaster?.approval_role_key ?? '').trim() || `approval_step_${index + 1}`
    const useSelectedDirectorBu =
      approvalRoleKey === 'director_approval' && Boolean(erf.approval_director_bu_profile?.email)
    const effectiveProfile = useSelectedDirectorBu
      ? erf.approval_director_bu_profile
      : approverMaster.profile

    if (!effectiveProfile?.email) {
      throw createHttpError(
        422,
        `${approvalRoleLabel} is not configured correctly for ${approvalFlowTemplate.title}.`,
      )
    }

    return {
      chain_id: chain.id,
      step_order: index + 1,
      approval_role_key: approvalRoleKey,
      approval_role_label: approvalRoleLabel,
      approver_email: effectiveProfile.email as string,
      approver_name: buildFullName(effectiveProfile) || approvalRoleLabel,
      status: 'pending',
      created_at: now,
    }
  })

  const { error: stepsError } = await supabase.from('approval_steps').insert(steps)
  if (stepsError) throw new Error(stepsError.message)

  await syncRecruitmentFlowStage(supabase, erfId)

  // ── 8. Send notification email to the first approver ────────────────────────
  const appOrigin = resolveTrustedAppOrigin(event)
  runInBackground(
    () => sendApprovalStepEmail(context, chain.id, 1, appOrigin),
    'initial approval notification email',
  )

  return { ok: true, chain_id: chain.id }
})
