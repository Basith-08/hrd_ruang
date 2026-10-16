export const customDesignationApprovalFlowPrefix = 'designations:'

export type ApprovalFlowKey = string

export type ApprovalFlowStepTemplate = {
  stepOrder: number
  roleKey: string
  label: string
}

export type ApprovalFlowTemplate = {
  key: ApprovalFlowKey
  title: string
  steps: ApprovalFlowStepTemplate[]
}

export function sanitizeApprovalFlowKey(value: string | null | undefined) {
  return normalizeApprovalDesignation(value)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function buildDesignationApprovalFlowKey(designationIds: string[]) {
  const normalizedDesignationIds = Array.from(
    new Set(designationIds.map((value) => String(value ?? '').trim()).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right))

  return normalizedDesignationIds.length > 0
    ? `${customDesignationApprovalFlowPrefix}${normalizedDesignationIds.join('|')}`
    : ''
}

export function parseDesignationApprovalFlowKey(flowKey: string | null | undefined) {
  const normalizedFlowKey = String(flowKey ?? '').trim()
  if (!normalizedFlowKey.startsWith(customDesignationApprovalFlowPrefix)) {
    return []
  }

  return normalizedFlowKey
    .slice(customDesignationApprovalFlowPrefix.length)
    .split('|')
    .map((value) => value.trim())
    .filter(Boolean)
}

export function formatApprovalFlowTitle(flowKey: string | null | undefined) {
  if (parseDesignationApprovalFlowKey(flowKey).length > 0) {
    return 'Designation'
  }

  const normalized = sanitizeApprovalFlowKey(flowKey)
  if (!normalized) {
    return 'Custom Flow'
  }

  return normalized
    .split('_')
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ')
}

export function getApprovalFlowTemplate(flowKey: ApprovalFlowKey): ApprovalFlowTemplate {
  return {
    key: flowKey,
    title: formatApprovalFlowTitle(flowKey),
    steps: [],
  }
}

export function normalizeApprovalDesignation(value: string | null | undefined) {
  return String(value ?? '')
    .replace(/^\s*\d+\s*[.\-]?\s*/u, '')
    .trim()
    .toLowerCase()
}

export function resolveConfiguredApprovalFlowKeyFromDesignation(
  masterDesignationId: string | null | undefined,
  availableFlowKeys: Iterable<string>,
): ApprovalFlowKey {
  const normalizedMasterDesignationId = String(masterDesignationId ?? '').trim()
  if (!normalizedMasterDesignationId) {
    return ''
  }

  return (
    Array.from(availableFlowKeys)
      .map((item) => String(item ?? '').trim())
      .filter(Boolean)
      .find((flowKey) =>
        parseDesignationApprovalFlowKey(flowKey).includes(normalizedMasterDesignationId),
      ) ?? ''
  )
}
