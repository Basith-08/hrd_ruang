import { defineJsonHandler } from '~~/server/utils/api'
import { requireRequestContext } from '~~/server/utils/requestContext'
import { requireAnyPermission } from '~~/server/lib/context.js'
import { isAdminRole } from '~~/server/lib/utils.js'
import { countCandidateFormsForDashboard } from '~~/server/services/candidateFormReadService.js'
import { loadManagedUsers } from '~~/server/services/userManagementService.js'

function hasAnyPermission(context: { permissions: string[] }, permissions: string[]) {
  return permissions.some((permission) => context.permissions.includes(permission))
}

function normalizeRoleName(roleName: string | null | undefined) {
  return String(roleName ?? '')
    .trim()
    .toLowerCase()
}

function normalizeEmail(email: string | null | undefined) {
  return String(email ?? '')
    .trim()
    .toLowerCase()
}

async function listOwnedEmployeeRequestFormIds(
  context: Awaited<ReturnType<typeof requireRequestContext>>,
) {
  const { data, error } = await context.supabase
    .from('employee_request_form')
    .select('id')
    .eq('created_by', context.userId)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((item: { id: string }) => String(item.id ?? '').trim()).filter(Boolean)
}

async function getEmployeeRequestFormSummary(
  context: Awaited<ReturnType<typeof requireRequestContext>>,
  isManager: boolean,
) {
  let query = context.supabase
    .from('employee_request_form')
    .select('id, main_position, site, position_status', { count: 'exact' })

  if (isManager) {
    query = query.eq('created_by', context.userId)
  }

  const { data, error, count } = await query.order('created_at', { ascending: false }).limit(6)

  if (error) {
    throw new Error(error.message)
  }

  return {
    total_count: Number(count ?? 0),
    recent_jobs: (data ?? []).map(
      (item: { id: string; main_position: string; site: string; position_status: string }) => ({
        id: String(item.id ?? ''),
        main_position: item.main_position ?? null,
        site: item.site ?? null,
        position_status: item.position_status ?? null,
      }),
    ),
  }
}

async function getApprovalSummary(
  context: Awaited<ReturnType<typeof requireRequestContext>>,
  options: {
    isAdmin: boolean
    isCandidate: boolean
    isManager: boolean
    ownedEmployeeRequestFormIds: string[]
  },
) {
  if (options.isCandidate) {
    return {
      visible_count: 0,
      pending_count: 0,
      approved_count: 0,
      rejected_count: 0,
    }
  }

  if (options.isManager && options.ownedEmployeeRequestFormIds.length === 0) {
    return {
      visible_count: 0,
      pending_count: 0,
      approved_count: 0,
      rejected_count: 0,
    }
  }

  let query = context.supabase
    .from('approval_chains')
    .select(
      options.isAdmin ? 'id, status' : 'id, status, steps:approval_steps(status, approver_email)',
    )

  if (options.isManager) {
    query = query.in('employee_request_form_id', options.ownedEmployeeRequestFormIds)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  const chains = data ?? []

  if (options.isAdmin) {
    return {
      visible_count: chains.length,
      pending_count: chains.filter((chain: { status: string }) => chain.status === 'pending')
        .length,
      approved_count: chains.filter((chain: { status: string }) => chain.status === 'approved')
        .length,
      rejected_count: chains.filter((chain: { status: string }) => chain.status === 'rejected')
        .length,
    }
  }

  const currentUserEmail = normalizeEmail(context.authUser.email)
  let pendingCount = 0
  let approvedCount = 0
  let rejectedCount = 0

  for (const chain of chains) {
    const assignedStep = Array.isArray(chain.steps)
      ? chain.steps.find(
          (step: { approver_email: string }) =>
            normalizeEmail(step?.approver_email) === currentUserEmail,
        )
      : null

    switch (assignedStep?.status) {
      case 'pending':
        pendingCount += 1
        break
      case 'approved':
        approvedCount += 1
        break
      case 'rejected':
        rejectedCount += 1
        break
      default:
        break
    }
  }

  return {
    visible_count: chains.length,
    pending_count: pendingCount,
    approved_count: approvedCount,
    rejected_count: rejectedCount,
  }
}

async function getRecruitmentSummary(
  context: Awaited<ReturnType<typeof requireRequestContext>>,
  options: {
    isManager: boolean
    ownedEmployeeRequestFormIds: string[]
  },
) {
  if (options.isManager && options.ownedEmployeeRequestFormIds.length === 0) {
    return {
      total_count: 0,
    }
  }

  let query = context.supabase
    .from('recruitment_queue_view')
    .select('id', { count: 'exact', head: true })

  if (options.isManager) {
    query = query.in('employee_request_form_id', options.ownedEmployeeRequestFormIds)
  }

  const { error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  return {
    total_count: Number(count ?? 0),
  }
}

async function getCandidateEmployeeSummary(
  context: Awaited<ReturnType<typeof requireRequestContext>>,
) {
  const users = await loadManagedUsers(context, 'candidateEmployee')
  const candidateCount = users.filter(
    (user: { role?: string | null }) => normalizeRoleName(user.role) === 'candidate',
  ).length
  const employeeCount = users.filter(
    (user: { role?: string | null }) => normalizeRoleName(user.role) === 'employee',
  ).length

  return {
    total_count: users.length,
    candidate_count: candidateCount,
    employee_count: employeeCount,
  }
}

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  requireAnyPermission(context, ['dashboard:read'])

  const roleName = normalizeRoleName(context.roleName)
  const isAdmin = isAdminRole(roleName)
  const isManager = roleName === 'manager'
  const isCandidate = roleName === 'candidate'

  const canReadEmployeeRequestForms = hasAnyPermission(context, ['employee_request_form:read'])
  const canReadApprovals = hasAnyPermission(context, ['approval:read'])
  const canReadRecruitment = hasAnyPermission(context, ['recruitment:read'])
  const canReadCandidates = hasAnyPermission(context, ['candidate_form:read', 'employee_form:read'])
  const canReadCandidateEmployees = hasAnyPermission(context, [
    'candidate_employee:read',
    'user:read',
  ])

  const ownedEmployeeRequestFormIds =
    isManager && (canReadApprovals || canReadRecruitment)
      ? await listOwnedEmployeeRequestFormIds(context)
      : []

  const [employeeRequestForms, approvals, recruitment, candidateEmployees, candidateFormsTotal] =
    await Promise.all([
      canReadEmployeeRequestForms
        ? getEmployeeRequestFormSummary(context, isManager)
        : Promise.resolve({ total_count: 0, recent_jobs: [] }),
      canReadApprovals
        ? getApprovalSummary(context, {
            isAdmin,
            isCandidate,
            isManager,
            ownedEmployeeRequestFormIds,
          })
        : Promise.resolve({
            visible_count: 0,
            pending_count: 0,
            approved_count: 0,
            rejected_count: 0,
          }),
      canReadRecruitment
        ? getRecruitmentSummary(context, {
            isManager,
            ownedEmployeeRequestFormIds,
          })
        : Promise.resolve({ total_count: 0 }),
      canReadCandidateEmployees
        ? getCandidateEmployeeSummary(context)
        : Promise.resolve({
            total_count: 0,
            candidate_count: 0,
            employee_count: 0,
          }),
      canReadCandidates ? countCandidateFormsForDashboard(context) : Promise.resolve(0),
    ])

  return {
    employee_request_forms: employeeRequestForms,
    approvals,
    recruitment,
    candidate_employees: candidateEmployees,
    candidate_forms: {
      total_count: candidateFormsTotal,
    },
  }
})
