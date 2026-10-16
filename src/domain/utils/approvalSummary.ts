type ApprovalSummaryFields = {
  approval_director_bu: string | null
  approval_director_bu_date: string | null
  approval_gm_hrd: string | null
  approval_gm_hrd_date: string | null
  approval_director_hrd: string | null
  approval_director_hrd_date: string | null
}

type ApprovalSummaryStep = {
  step_order: number
  approver_name: string | null
  approved_at: string | null
  status?: string | null
}

export type ApprovalProgressSummary = {
  approvedCount: number
  totalCount: number
  currentApprovalLabel: string
  lastApprovalDate: string | null
}

export type ApprovalSummary = ApprovalSummaryFields

export function buildApprovalSummary(
  steps: ApprovalSummaryStep[],
  fallback?: Partial<ApprovalSummaryFields>,
): ApprovalSummaryFields {
  const summaryByStepOrder = new Map<number, ApprovalSummaryStep>()

  for (const step of [...steps].sort((left, right) => left.step_order - right.step_order)) {
    if (!summaryByStepOrder.has(step.step_order)) {
      summaryByStepOrder.set(step.step_order, step)
    }
  }

  const buDirectorStep = summaryByStepOrder.get(1)
  const gmHrdStep = summaryByStepOrder.get(2)
  const hrDirectorStep = summaryByStepOrder.get(3)

  return {
    approval_director_bu:
      buDirectorStep?.approver_name
      ?? fallback?.approval_director_bu
      ?? null,
    approval_director_bu_date:
      buDirectorStep?.status === 'approved'
        ? buDirectorStep.approved_at
        : (fallback?.approval_director_bu_date ?? null),
    approval_gm_hrd:
      gmHrdStep?.approver_name
      ?? fallback?.approval_gm_hrd
      ?? null,
    approval_gm_hrd_date:
      gmHrdStep?.status === 'approved'
        ? gmHrdStep.approved_at
        : (fallback?.approval_gm_hrd_date ?? null),
    approval_director_hrd:
      hrDirectorStep?.approver_name
      ?? fallback?.approval_director_hrd
      ?? null,
    approval_director_hrd_date:
      hrDirectorStep?.status === 'approved'
        ? hrDirectorStep.approved_at
        : (fallback?.approval_director_hrd_date ?? null),
  }
}

function normalizeText(value: unknown) {
  return String(value ?? '').trim()
}

function displayName(value: string | null | undefined) {
  const normalizedValue = normalizeText(value)
  if (!normalizedValue) return '-'

  return normalizedValue.split(' - ')[0]?.trim() || normalizedValue
}

export function buildApprovalProgressSummary(
  steps: ApprovalSummaryStep[] | null | undefined,
  fallback?: Partial<ApprovalSummaryFields>,
): ApprovalProgressSummary {
  const dynamicSteps = Array.isArray(steps)
    ? [...steps].filter((step) => Number(step.step_order ?? 0) > 0).sort((left, right) => left.step_order - right.step_order)
    : []

  if (dynamicSteps.length > 0) {
    const approvedSteps = dynamicSteps.filter((step) => normalizeText(step.status).toLowerCase() === 'approved')
    const currentStep = dynamicSteps.find((step) => normalizeText(step.status).toLowerCase() !== 'approved') ?? null
    const lastApprovedStep = approvedSteps[approvedSteps.length - 1] ?? null

    return {
      approvedCount: approvedSteps.length,
      totalCount: dynamicSteps.length,
      currentApprovalLabel: displayName(currentStep?.approver_name),
      lastApprovalDate: lastApprovedStep?.approved_at ?? null,
    }
  }

  const legacyApprovalDates = [
    fallback?.approval_director_bu_date,
    fallback?.approval_gm_hrd_date,
    fallback?.approval_director_hrd_date,
  ].filter((value) => Boolean(normalizeText(value)))

  const approvedCount = legacyApprovalDates.length

  if (approvedCount === 0) {
    return {
      approvedCount: 0,
      totalCount: 3,
      currentApprovalLabel: displayName(fallback?.approval_director_bu),
      lastApprovalDate: null,
    }
  }

  if (!normalizeText(fallback?.approval_director_bu_date)) {
    return {
      approvedCount,
      totalCount: 3,
      currentApprovalLabel: displayName(fallback?.approval_director_bu),
      lastApprovalDate: legacyApprovalDates[legacyApprovalDates.length - 1] ?? null,
    }
  }

  if (!normalizeText(fallback?.approval_gm_hrd_date)) {
    return {
      approvedCount,
      totalCount: 3,
      currentApprovalLabel: displayName(fallback?.approval_gm_hrd),
      lastApprovalDate: legacyApprovalDates[legacyApprovalDates.length - 1] ?? null,
    }
  }

  if (!normalizeText(fallback?.approval_director_hrd_date)) {
    return {
      approvedCount,
      totalCount: 3,
      currentApprovalLabel: displayName(fallback?.approval_director_hrd),
      lastApprovalDate: legacyApprovalDates[legacyApprovalDates.length - 1] ?? null,
    }
  }

  return {
    approvedCount,
    totalCount: 3,
    currentApprovalLabel: '-',
    lastApprovalDate: legacyApprovalDates[legacyApprovalDates.length - 1] ?? null,
  }
}
