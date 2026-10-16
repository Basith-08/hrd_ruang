import { ApprovalRepositoryImpl } from '@/infrastructure/supabase/repositories/ApprovalRepositoryImpl'
import { AuthRepositoryImpl } from '@/infrastructure/supabase/repositories/AuthRepositoryImpl'
import { CandidateDocumentExplorerRepositoryImpl } from '@/infrastructure/supabase/repositories/CandidateDocumentExplorerRepositoryImpl'
import { CandidateFormRepositoryImpl } from '@/infrastructure/supabase/repositories/CandidateFormRepositoryImpl'
import { EmployeeRequestFormRepositoryImpl } from '@/infrastructure/supabase/repositories/EmployeeRequestFormRepositoryImpl'
import { InterviewEvaluationRepositoryImpl } from '@/infrastructure/supabase/repositories/InterviewEvaluationRepositoryImpl'
import { RecruitmentTrackingRepositoryImpl } from '@/infrastructure/supabase/repositories/RecruitmentTrackingRepositoryImpl'
import { RoleRepositoryImpl } from '@/infrastructure/supabase/repositories/RoleRepositoryImpl'
import { UserManagementRepositoryImpl } from '@/infrastructure/supabase/repositories/UserManagementRepositoryImpl'

export type AppRepositories = {
  approvalRepo: ApprovalRepositoryImpl
  authRepo: AuthRepositoryImpl
  candidateDocumentExplorerRepo: CandidateDocumentExplorerRepositoryImpl
  candidateFormRepo: CandidateFormRepositoryImpl
  employeeRequestFormRepo: EmployeeRequestFormRepositoryImpl
  interviewEvaluationRepo: InterviewEvaluationRepositoryImpl
  recruitmentTrackingRepo: RecruitmentTrackingRepositoryImpl
  roleRepo: RoleRepositoryImpl
  userManagementRepo: UserManagementRepositoryImpl
}

let repositories: AppRepositories | null = null

export function createInfrastructureRepositories(): AppRepositories {
  return {
    approvalRepo: new ApprovalRepositoryImpl(),
    authRepo: new AuthRepositoryImpl(),
    candidateDocumentExplorerRepo: new CandidateDocumentExplorerRepositoryImpl(),
    candidateFormRepo: new CandidateFormRepositoryImpl(),
    employeeRequestFormRepo: new EmployeeRequestFormRepositoryImpl(),
    interviewEvaluationRepo: new InterviewEvaluationRepositoryImpl(),
    recruitmentTrackingRepo: new RecruitmentTrackingRepositoryImpl(),
    roleRepo: new RoleRepositoryImpl(),
    userManagementRepo: new UserManagementRepositoryImpl(),
  }
}

export function getInfrastructureRepositories(): AppRepositories {
  if (!repositories) {
    repositories = createInfrastructureRepositories()
  }

  return repositories
}
