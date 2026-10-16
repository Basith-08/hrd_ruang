import { computed, ref, watch, type Component } from "vue"
import { useRoute } from "#imports"
import {
  LayoutDashboard, FileText, UserCheck, CheckSquare, Briefcase,
  ClipboardList, FileCheck, UserCircle, Settings, ShieldCheck, Building2,
} from "lucide-vue-next"
import { useLocale } from "@/composables/useLocale"
import { useAuthViewModel } from "@/viewmodels/useAuthViewModel"

export interface NavItem {
  to: string
  labelKey: string
  icon: Component
  adminOnly?: boolean
  permissions?: string[]
}

export interface NavSection {
  id: string
  labelKey: string
  icon?: Component
  items: NavItem[]
}

export function useLayoutNavigation() {
  const route = useRoute()
  const { text } = useLocale()
  const { userRole, hasAnyPermission, hasPermission } = useAuthViewModel()

  const openSections = ref<string[]>(["recruitmentProcess", "overview"])

  const normalizedRole = computed(() => (userRole.value ?? "").toLowerCase())
  const isAdminRole = computed(() =>
    normalizedRole.value === "super_admin",
  )
  const canReadCandidateEmployees = computed(() =>
    hasAnyPermission(["candidate_employee:read", "user:read"]),
  )
  const candidateWorkspaceNavTarget = computed(() =>
    canReadCandidateEmployees.value ? "/candidate-employees" : "/candidate-forms",
  )
  const candidateWorkspaceNavLabelKey = computed(() =>
    canReadCandidateEmployees.value
      ? "layout.nav.items.candidateEmployees"
      : "layout.nav.items.candidateEmployeeForms",
  )
  const canReadInterviewEvaluations = computed(() => hasPermission("interview_evaluation:read"))
  const interviewEvaluationsNavLabelKey = computed(() =>
    canReadInterviewEvaluations.value
      ? "layout.nav.items.assessmentList"
      : "layout.nav.items.interviewerForm",
  )

  const navigationSections = computed((): NavSection[] => [
    {
      id: "recruitmentProcess",
      labelKey: "layout.nav.sections.recruitmentProcess",
      icon: Briefcase,
      items: [
        { to: "/employee-request-forms", labelKey: "layout.nav.items.employeeRequestForms", icon: FileText, permissions: ["employee_request_form:read", "recruitment:approved_erf_read"] },
        { to: "/approval-tracking", labelKey: "layout.nav.items.approvalTracking", icon: CheckSquare, permissions: ["approval:read"] },
        { to: "/recruitment/pic-recruitment", labelKey: "layout.nav.items.picRecruitment", icon: UserCheck, permissions: ["pic_recruitment:read", "recruitment:pic_recruitment_read"] },
        {
          to: candidateWorkspaceNavTarget.value,
          labelKey: candidateWorkspaceNavLabelKey.value,
          icon: ClipboardList,
          permissions: ["candidate_employee:read", "user:read", "candidate_form:read", "employee_form:read"],
        },
        { to: "/user-history", labelKey: "layout.nav.items.userHistory", icon: Settings, permissions: ["user_history:read"] },
        {
          to: "/interview-evaluations",
          labelKey: interviewEvaluationsNavLabelKey.value,
          icon: FileCheck,
          permissions: ["interview_evaluation:interviewer_form", "interview_evaluation:read"],
        },
        { to: "/recruitment/new-employee-contract-forms", labelKey: "layout.nav.items.newEmployeeContractForms", icon: FileText, permissions: ["employee_contract_form:read"] },
        { to: "/configuration-export", labelKey: "layout.nav.items.configurationExport", icon: FileText, permissions: ["export_configuration:read", "export_configuration:manage", "export_configuration:generate"] },
      ],
    },
    {
      id: "overview",
      labelKey: "layout.nav.sections.overview",
      icon: LayoutDashboard,
      items: [
        { to: "/dashboard", labelKey: "layout.nav.items.dashboard", icon: LayoutDashboard, permissions: ["dashboard:read"] },
        { to: "/recruitment", labelKey: "layout.nav.items.recruitmentDashboard", icon: Briefcase, permissions: ["recruitment:read"] },
        { to: "/recruitment/vacancy-pipeline", labelKey: "layout.nav.items.vacancyPipeline", icon: ClipboardList, permissions: ["recruitment:vacancy_pipeline"] },
        { to: "/recruitment/closed-vacancy", labelKey: "layout.nav.items.closedVacancy", icon: ClipboardList, permissions: ["recruitment:closed_vacancy"] },
        { to: "/recruitment/candidate-database", labelKey: "layout.nav.items.recruitmentCandidates", icon: UserCheck, permissions: ["recruitment:candidate_database"] },
        { to: "/recruitment/interview-evaluasi", labelKey: "layout.nav.items.interviewEvaluasi", icon: FileCheck, permissions: ["recruitment:interview_evaluasi"] },
        { to: "/recruitment/document-explorer", labelKey: "layout.nav.items.documentExplorer", icon: Briefcase, permissions: ["recruitment:document_explorer"] },
      ],
    },
    {
      id: "masterData",
      labelKey: "layout.nav.sections.masterData",
      icon: Settings,
      items: [
        { to: "/approver-master", labelKey: "layout.nav.items.approverMaster", icon: UserCheck, permissions: ["approval:read"], adminOnly: true },
        { to: "/custom-group-management", labelKey: "layout.nav.items.customGroups", icon: Settings, permissions: ["user:read"], adminOnly: true },
        { to: "/master-data-management", labelKey: "layout.nav.items.masterDataErf", icon: Building2, permissions: ["user:read"], adminOnly: true },
      ],
    },
    {
      id: "personal",
      labelKey: "layout.nav.sections.personal",
      icon: UserCircle,
      items: [{ to: "/profile", labelKey: "layout.nav.items.profile", icon: UserCircle }],
    },
    {
      id: "systemAdmin",
      labelKey: "layout.nav.sections.systemAdmin",
      icon: ShieldCheck,
      items: [
        { to: "/user-management", labelKey: "layout.nav.items.userManagement", icon: Settings, permissions: ["user:read"] },
        { to: "/role-management", labelKey: "layout.nav.items.roleManagement", icon: ShieldCheck, permissions: ["role:manage"] },
      ],
    },
  ])

  const filteredNavigationSections = computed(() =>
    navigationSections.value
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            (!item.permissions || hasAnyPermission(item.permissions)) &&
            (!item.adminOnly || isAdminRole.value),
        ),
      }))
      .filter((section) => section.items.length > 0),
  )

  function getUserManagementContextTarget() {
    const routeType = String(route.query.type ?? "").trim().toLowerCase()
    const routeRole = String(route.query.role ?? "").trim().toLowerCase()
    const routeScope = String(route.query.scope ?? "").trim().toLowerCase()

    if (
      route.path.startsWith("/user-management/") &&
      (
        routeType === "candidate" ||
        routeRole === "employee" ||
        routeScope === "candidateemployee" ||
        routeScope === "candidate" ||
        routeScope === "employee"
      )
    ) {
      return "/candidate-employees"
    }

    return null
  }

  function isActiveRoute(targetPath: string) {
    const contextualTarget = getUserManagementContextTarget()
    if (contextualTarget) {
      return targetPath === contextualTarget
    }

    const matchesTarget = route.path === targetPath || route.path.startsWith(`${targetPath}/`)
    if (!matchesTarget) return false

    const hasMoreSpecificMatch = navigationSections.value
      .flatMap((s) => s.items)
      .some((item) =>
        item.to !== targetPath &&
        item.to.length > targetPath.length &&
        (route.path === item.to || route.path.startsWith(`${item.to}/`)),
      )

    return !hasMoreSpecificMatch
  }

  function toggleSection(id: string) {
    const index = openSections.value.indexOf(id)
    if (index === -1) openSections.value.push(id)
    else openSections.value.splice(index, 1)
  }

  function isSectionOpen(section: NavSection) {
    return openSections.value.includes(section.id) || section.items.some((item) => isActiveRoute(item.to))
  }

  const pageTitle = computed(() => {
    const contextualTarget = getUserManagementContextTarget()
    if (contextualTarget === "/candidate-employees") {
      return text("page.candidateEmployees")
    }

    const matchers: Array<{ prefix: string; titleKey: string }> = [
      { prefix: "/dashboard", titleKey: "page.dashboard" },
      { prefix: "/employee-request-forms", titleKey: "page.employeeRequestForms" },
      { prefix: "/job-requests", titleKey: "page.employeeRequestForms" },
      { prefix: "/approver-master", titleKey: "page.approverMaster" },
      { prefix: "/approval-tracking", titleKey: "page.approvalTracking" },
      { prefix: "/recruitment/document-explorer", titleKey: "page.portalDocumentExplorer" },
      { prefix: "/recruitment/pic-recruitment", titleKey: "page.picRecruitment" },
      { prefix: "/recruitment/new-employee-contract-forms", titleKey: "page.newEmployeeContractForms" },
      { prefix: "/recruitment/closed-vacancy", titleKey: "page.closedVacancy" },
      { prefix: "/recruitment/vacancy-pipeline", titleKey: "page.vacancyPipeline" },
      { prefix: "/recruitment/candidate-database", titleKey: "page.recruitmentCandidates" },
      { prefix: "/recruitment/interview-evaluasi", titleKey: "page.interviewEvaluasi" },
      { prefix: "/recruitment", titleKey: "page.recruitmentDashboard" },
      {
        prefix: "/candidate-forms",
        titleKey: canReadCandidateEmployees.value ? "page.candidateEmployees" : "page.candidateEmployeeForms",
      },
      { prefix: "/candidates", titleKey: "page.candidateEmployeeForms" },
      { prefix: "/candidate-management", titleKey: "page.candidateEmployeeForms" },
      { prefix: "/applications", titleKey: "page.candidateEmployeeForms" },
      { prefix: "/interview-evaluations/manage", titleKey: "page.interviewEvaluation" },
      {
        prefix: "/interview-evaluations/list",
        titleKey: canReadInterviewEvaluations.value ? "page.interviewEvaluation" : "page.interviewerForm",
      },
      {
        prefix: "/interview-evaluations",
        titleKey: canReadInterviewEvaluations.value ? "page.interviewEvaluation" : "page.interviewerForm",
      },
      { prefix: "/profile", titleKey: "page.profile" },
      { prefix: "/candidate-employees", titleKey: "page.candidateEmployees" },
      { prefix: "/user-management", titleKey: "page.userManagement" },
      { prefix: "/user-history", titleKey: "page.userHistory" },
      { prefix: "/role-management", titleKey: "page.roleManagement" },
      { prefix: "/custom-group-management", titleKey: "page.customGroupManagement" },
      { prefix: "/master-data-management", titleKey: "page.masterDataErf" },
      { prefix: "/configuration-export/templates", titleKey: "page.exportConfigurationTemplates" },
      { prefix: "/configuration-export/generate", titleKey: "page.exportConfigurationGenerate" },
      { prefix: "/configuration-export", titleKey: "page.exportConfiguration" },
      { prefix: "/export-configuration", titleKey: "page.exportConfiguration" },
    ]

    const match = matchers.find(
      (item) => route.path === item.prefix || route.path.startsWith(`${item.prefix}/`),
    )
    return match ? text(match.titleKey) : text("page.appTitle")
  })

  watch(() => route.path, () => { /* consumed by sidebar close in parent */ })

  return {
    filteredNavigationSections,
    isActiveRoute,
    toggleSection,
    isSectionOpen,
    pageTitle,
  }
}
