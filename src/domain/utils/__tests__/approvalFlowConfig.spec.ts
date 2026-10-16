import { describe, expect, it } from 'vitest'

import {
  buildDesignationApprovalFlowKey,
  formatApprovalFlowTitle,
  normalizeApprovalDesignation,
  parseDesignationApprovalFlowKey,
  resolveConfiguredApprovalFlowKeyFromDesignation,
} from '../approvalFlowConfig'

describe('approvalFlowConfig', () => {
  it('normalizes designation labels for display and generated keys', () => {
    expect(normalizeApprovalDesignation('05. Dir')).toBe('dir')
    expect(normalizeApprovalDesignation(' 04 - Mgr ')).toBe('mgr')
  })

  it('builds and parses designation approval flow keys', () => {
    const flowKey = buildDesignationApprovalFlowKey(['des-2', 'des-1', 'des-2'])

    expect(flowKey).toBe('designations:des-1|des-2')
    expect(parseDesignationApprovalFlowKey(flowKey)).toEqual(['des-1', 'des-2'])
    expect(formatApprovalFlowTitle(flowKey)).toBe('Designation')
  })

  it('resolves a configured flow only from master designation id', () => {
    const flowKey = buildDesignationApprovalFlowKey(['des-1'])

    expect(
      resolveConfiguredApprovalFlowKeyFromDesignation('des-1', ['designations:des-2', flowKey]),
    ).toBe(flowKey)
    expect(resolveConfiguredApprovalFlowKeyFromDesignation('job-level-1', [flowKey])).toBe('')
    expect(resolveConfiguredApprovalFlowKeyFromDesignation('', [flowKey])).toBe('')
  })
})
