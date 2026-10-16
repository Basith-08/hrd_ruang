import { describe, expect, it } from 'vitest'

import {
  recruitmentFlowStageLabel,
  resolveRecruitmentFlowStage,
} from '../recruitmentFlowStage'

describe('recruitment flow stage', () => {
  it('resolves the current pending approval stage from ERF approval dates', () => {
    expect(resolveRecruitmentFlowStage({
      employeeRequestForm: {
        status: 'open',
        approval_director_bu_date: null,
        approval_gm_hrd_date: null,
        approval_director_hrd_date: null,
      },
    })).toBe('approval_in_progress')

    expect(resolveRecruitmentFlowStage({
      employeeRequestForm: {
        status: 'open',
        approval_director_bu_date: '2026-04-01',
        approval_gm_hrd_date: null,
        approval_director_hrd_date: null,
      },
    })).toBe('approval_in_progress')
  })

  it('prefers downstream interview stages after approval is complete', () => {
    expect(resolveRecruitmentFlowStage({
      employeeRequestForm: {
        status: 'open',
        approval_director_bu_date: '2026-04-01',
        approval_gm_hrd_date: '2026-04-02',
        approval_director_hrd_date: '2026-04-03',
        vacancy_status: 'interview',
        passed_candidate_name: null,
      },
    })).toBe('interview_evaluation_in_progress')

    expect(resolveRecruitmentFlowStage({
      employeeRequestForm: {
        status: 'open',
        approval_director_bu_date: '2026-04-01',
        approval_gm_hrd_date: '2026-04-02',
        approval_director_hrd_date: '2026-04-03',
        vacancy_status: 'accepted',
        passed_candidate_name: 'Candidate One',
      },
    })).toBe('interview_evaluation_completed')
  })

  it('returns rejected and closed terminal stages with stable labels', () => {
    expect(resolveRecruitmentFlowStage({
      approvalChain: {
        status: 'pending',
        steps: [{ status: 'rejected' } as any],
      },
      employeeRequestForm: {
        status: 'open',
      },
    })).toBe('rejected')

    expect(resolveRecruitmentFlowStage({
      employeeRequestForm: {
        status: 'closed',
        closed_category: 'employee hired',
      },
    })).toBe('hiring_completed')

    expect(recruitmentFlowStageLabel('erf_requested')).toBe('1. ERF Requested')
    expect(recruitmentFlowStageLabel('approval_in_progress')).toBe('2. Approval In Progress')
    expect(recruitmentFlowStageLabel('assign_recruiter')).toBe('5. Assign Recruiter')
    expect(recruitmentFlowStageLabel('assessment_list_created')).toBe('7. Candidate Form In Progress')
    expect(recruitmentFlowStageLabel('candidate_selected')).toBe('11. Employee Form In Progress')
    expect(recruitmentFlowStageLabel('employee_contract_form_in_progress')).toBe('12. Employee Contract Form In Progress')
  })

  it('normalizes legacy pending approval stages to erf requested', () => {
    expect(resolveRecruitmentFlowStage({
      employeeRequestForm: {
        status: 'open',
        recruitment_flow_stage: 'waiting_gm_hrd_approval' as any,
      },
    })).toBe('approval_in_progress')
  })

  it('prefers the persisted stage when it is already stored on the ERF', () => {
    expect(resolveRecruitmentFlowStage({
      employeeRequestForm: {
        status: 'open',
        recruitment_flow_stage: 'assessment_list_created',
        vacancy_status: 'request',
      },
    })).toBe('assessment_list_created')

    expect(resolveRecruitmentFlowStage({
      employeeRequestForm: {
        status: 'open',
        recruitment_flow_stage: 'candidate_selected',
        vacancy_status: 'accepted',
        passed_candidate_name: 'Candidate One',
      },
    })).toBe('candidate_selected')
  })

  it('returns assign recruiter after approval when a recruiter has been assigned', () => {
    expect(resolveRecruitmentFlowStage({
      employeeRequestForm: {
        status: 'open',
        approval_director_bu_date: '2026-04-01',
        approval_gm_hrd_date: '2026-04-02',
        approval_director_hrd_date: '2026-04-03',
        recruiter_user_id: 'recruiter-1',
      },
    })).toBe('assign_recruiter')
  })

  it('treats fully approved dynamic approval steps as approved even when legacy step-3 date is empty', () => {
    expect(resolveRecruitmentFlowStage({
      employeeRequestForm: {
        status: 'open',
        approval_director_bu_date: '2026-04-01',
        approval_gm_hrd_date: '2026-04-02',
        approval_director_hrd_date: null,
        approval_steps: [
          {
            step_order: 1,
            approval_role_label: 'Director',
            approver_name: 'Director BU',
            approved_at: '2026-04-01',
            status: 'approved',
          },
          {
            step_order: 2,
            approval_role_label: 'GM HRD',
            approver_name: 'GM HRD',
            approved_at: '2026-04-02',
            status: 'approved',
          },
        ],
      },
    })).toBe('erf_approved')
  })
})
