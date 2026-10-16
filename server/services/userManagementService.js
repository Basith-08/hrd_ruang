import { randomBytes } from "node:crypto"

import { createHttpError } from "~~/server/lib/errors.js"
import { getJakartaTimestamp } from "~~/server/lib/time.js"
import {
  buildPersonalData,
  extractCreatorId,
  isNonEmptyString,
  isMissingDatabaseObjectError,
  isStaffRole,
  normalizeRoleName,
  readPersonalDataString,
} from "~~/server/lib/utils.js"
import { requireAnyPermission } from "~~/server/lib/context.js"
import { runInBackground } from "~~/server/lib/backgroundTask.js"
import {
  addCandidateServiceApplication,
  createCandidateServiceAccount,
  resetCandidateServicePassword,
  revokeCandidateServiceAccount,
  setCandidateServiceAccountActive,
  switchCandidateServiceAccountToEmployee,
  updateCandidateServiceAccount,
} from "~~/server/services/candidateServiceClient.js"
import {
  decodeCandidateServiceUserId,
} from "~~/server/services/candidateProjectionService.js"
import {
  assertStaffCanManageCandidateAccount,
  getManagedCandidateUserFromCandidateDatabase,
  listCandidateBindingsByIdentityUserIdsFromCandidateDatabase,
  listManagedCandidateUsersFromCandidateDatabase,
  loadCandidateUserHistoryFromCandidateDatabase,
} from "~~/server/services/candidateDatabaseReadService.js"
import { sendCandidateCredentialEmailIfEligible } from "~~/server/services/candidateCredentialEmailService.js"

function normalizeText(value) {
  return String(value ?? "").trim()
}

function generateCandidatePassword(length = 12) {
  const normalizedLength = Number.isFinite(length) ? Math.max(6, Math.trunc(length)) : 12
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*"
  const bytes = randomBytes(normalizedLength)

  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")
}

function resolveUserHistorySortTimestamp(entry) {
  return String(entry?.activated_at ?? entry?.created_at ?? "")
}

function mapManagedUser(employee, roleInfo, email, candidateBinding) {
  return {
    id: employee.id,
    account_source: "internal",
    email,
    username: employee.username ?? null,
    full_name: employee.full_name ?? null,
    phone: employee.phone ?? null,
    employee_request_form_id: candidateBinding?.employee_request_form_id ?? null,
    department_id: employee.department_id ?? null,
    master_designation_id: employee.master_designation_id ?? null,
    personal_data:
      employee.personal_data && typeof employee.personal_data === "object"
        ? employee.personal_data
        : null,
    first_name:
      readPersonalDataString(employee.personal_data, "first_name") ?? employee.full_name ?? null,
    middle_name: readPersonalDataString(employee.personal_data, "middle_name"),
    last_name: readPersonalDataString(employee.personal_data, "last_name"),
    main_position: employee.main_position ?? null,
    hire_location: null,
    date_of_birth: null,
    place_of_birth: null,
    nationality: null,
    marital_status: null,
    religion: null,
    gender: null,
    ethnic: null,
    blood_type: null,
    no_id: null,
    employee_code: readPersonalDataString(employee.personal_data, "employee_code"),
    contract_number: readPersonalDataString(employee.personal_data, "contract_number"),
    cost_center_pt_id: employee.cost_center_pt_id ?? null,
    department: employee.department_ref?.name ?? null,
    designation: employee.master_designation_ref?.name ?? null,
    employment_type: null,
    employment_start_date: null,
    emergency_contact_name: null,
    emergency_contact_phone:
      readPersonalDataString(employee.personal_data, "phone_number") ?? employee.phone ?? null,
    custom_grup_1_id: null,
    custom_grup_2_id: null,
    custom_grup_3_id: null,
    custom_grup_4_id: null,
    custom_grup_5_id: null,
    custom_grup_6_id: null,
    is_active: employee.is_active ?? true,
    role: roleInfo.roleName ?? null,
    role_id: roleInfo.roleId ?? null,
    created_at: employee.created_at ?? null,
    updated_at: null,
    last_login_at: null,
    candidate_form_id: candidateBinding?.candidate_form_id ?? null,
    candidate_form_completion_status: candidateBinding?.candidate_form_completion_status ?? null,
    candidate_form_created_at: candidateBinding?.candidate_form_created_at ?? null,
    candidate_form_updated_at: candidateBinding?.candidate_form_updated_at ?? null,
    candidate_form_is_submitted: candidateBinding?.candidate_form_is_submitted ?? false,
    candidate_form_has_contract_documents: candidateBinding?.candidate_form_has_contract_documents ?? false,
  }
}

function buildCandidateJobSnapshot(binding) {
  return {
    pt_id: binding.pt_id ?? null,
    pt_name: binding.pt_name ?? null,
    department_id: binding.department_id ?? null,
    department_name: binding.department_name ?? null,
    master_designation_id: binding.master_designation_id ?? null,
    designation_name: binding.designation_name ?? null,
    main_position: binding.main_position ?? null,
  }
}

const CANDIDATE_BINDABLE_RECRUITMENT_STAGES = new Set([
  "erf_approved",
  "assign_recruiter",
  "candidate_sourcing",
  "assessment_list_created",
  "interview_scheduled",
  "interview_evaluation_in_progress",
  "interview_evaluation_completed",
  "candidate_selected",
  "employee_contract_form_in_progress",
])

function assertCandidateBindableEmployeeRequestForm(binding) {
  if (!binding.employee_request_form_id) {
    throw createHttpError(400, "Candidate accounts must be bound to an ERF.")
  }

  const recruitmentFlowStage = normalizeText(binding.recruitment_flow_stage).toLowerCase()

  if (!CANDIDATE_BINDABLE_RECRUITMENT_STAGES.has(recruitmentFlowStage)) {
    throw createHttpError(
      400,
      "Selected ERF is not eligible for candidate account binding.",
    )
  }

  if (recruitmentFlowStage === "erf_approved" && !normalizeText(binding.recruiter_user_id)) {
    throw createHttpError(
      400,
      "Selected ERF must have a recruiter assigned before candidate accounts can be created.",
    )
  }
}

function normalizeUserListScope(scope) {
  const value = normalizeText(scope).toLowerCase()

  if (value === "users" || value === "candidate" || value === "employee" || value === "candidateemployee" || value === "all") {
    return value
  }

  return "all"
}

function roleMatchesUserListScope(roleName, scope) {
  const normalizedRole = normalizeRoleName(roleName)

  switch (scope) {
    case "users":
      return normalizedRole !== "candidate" && normalizedRole !== "employee"
    case "candidate":
      return normalizedRole === "candidate"
    case "employee":
      return normalizedRole === "employee"
    case "candidateemployee":
      return normalizedRole === "candidate" || normalizedRole === "employee"
    case "all":
    default:
      return true
  }
}

async function listAllAuthUsers(supabase) {
  const users = []
  const perPage = 1000
  let page = 1

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })

    if (error) {
      throw new Error(error.message)
    }

    users.push(...data.users)

    if (!data.nextPage) {
      break
    }

    page = data.nextPage
  }

  return users
}

function getUserManagementAccessScope(context) {
  return {
    isStaff: isStaffRole(context.roleName),
    canReadAllCandidates: Boolean(context.permissions?.includes("candidate_employee:read_all")),
    roleName: context.roleName,
    userId: context.userId,
  }
}

async function getRoleNameById(supabase, roleId) {
  const { data, error } = await supabase.from("roles").select("name").eq("id", roleId).single()

  if (error) {
    throw new Error(error.message)
  }

  return normalizeRoleName(data?.name)
}

async function getCurrentRoleNameByUserId(supabase, userId) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return normalizeRoleName(data?.roles?.name)
}

async function getProfileById(supabase, userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
        id,
        username,
        email,
        full_name,
        phone,
        department_id,
        master_designation_id,
        main_position,
        cost_center_pt_id,
        is_active,
        personal_data,
        created_at
      `,
    )
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

async function resolveEmployeeRequestFormBinding(supabase, employeeRequestFormId) {
  const id = String(employeeRequestFormId ?? "").trim()
  if (!id) {
    return {
      employee_request_form_id: null,
      pt_id: null,
      pt_name: null,
      department_id: null,
      department_name: null,
      master_designation_id: null,
      designation_name: null,
      main_position: null,
    }
  }

  const { data, error } = await supabase
    .from("employee_request_form")
    .select(
      `
        id,
        pt_id,
        department_id,
        master_designation_id,
        main_position,
        recruiter_user_id,
        recruitment_flow_stage,
        pt_ref:master_pt(name),
        department_ref:master_department(name),
        master_designation_ref:master_designation(name)
      `,
    )
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw createHttpError(404, "Selected ERF was not found.")
  }

  return {
    employee_request_form_id: data.id ?? null,
    pt_id: data.pt_id ?? null,
    pt_name: data.pt_ref?.name ?? null,
    department_id: data.department_id ?? null,
    department_name: data.department_ref?.name ?? null,
    master_designation_id: data.master_designation_id ?? null,
    designation_name: data.master_designation_ref?.name ?? null,
    main_position: data.main_position ?? null,
    recruiter_user_id: data.recruiter_user_id ?? null,
    recruitment_flow_stage: data.recruitment_flow_stage ?? null,
  }
}

async function resolveProfileAssignment(supabase, input) {
  const employeeRequestFormId = String(input.employee_request_form_id ?? "").trim()
  if (employeeRequestFormId) {
    return resolveEmployeeRequestFormBinding(supabase, employeeRequestFormId)
  }

  return {
    employee_request_form_id: null,
    pt_id: null,
    pt_name: null,
    department_id: String(input.department_id ?? "").trim() || null,
    department_name: null,
    master_designation_id: String(input.master_designation_id ?? "").trim() || null,
    designation_name: null,
    main_position: String(input.main_position ?? "").trim() || null,
  }
}

async function resolveProfileDesignationIds(supabase, binding) {
  const masterDesignationId = String(binding.master_designation_id ?? "").trim()
  return { master_designation_id: masterDesignationId || null }
}

async function assertCanManageUser(supabase, accessScope, userId) {
  if (!accessScope.isStaff || !accessScope.userId) {
    return
  }

  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select("role_id, roles(name)")
    .eq("user_id", userId)
    .maybeSingle()

  if (roleError) {
    throw new Error(roleError.message)
  }

  const targetRoleName = normalizeRoleName(roleData?.roles?.name)
  if (targetRoleName !== "candidate") {
    throw createHttpError(403, "Staff can only manage users with the candidate role.")
  }

  const authUsers = await listAllAuthUsers(supabase)
  const targetUser = authUsers.find((user) => user.id === userId)

  if (!targetUser) {
    throw createHttpError(404, "User account was not found.")
  }

  if (extractCreatorId(targetUser) !== accessScope.userId) {
    throw createHttpError(403, "You can only manage candidate accounts that you created.")
  }
}

function mapCandidateSummaryToManagedUser(summary) {
  if (!summary || !String(summary.candidate_id ?? "").trim()) {
    throw createHttpError(
      502,
      "Candidate service returned an invalid candidate summary payload.",
    )
  }

  return {
    id: `candidate:${summary.candidate_id}`,
    account_source: "candidate_service",
    email: summary.email ?? null,
    username: null,
    full_name: summary.full_name ?? null,
    phone: summary.phone ?? null,
    employee_request_form_id: summary.primary_application?.erf_id ?? null,
    department_id: null,
    master_designation_id: null,
    personal_data: null,
    first_name: summary.full_name ?? null,
    middle_name: null,
    last_name: null,
    main_position: summary.primary_application?.job_snapshot?.main_position ?? null,
    hire_location: null,
    date_of_birth: null,
    place_of_birth: null,
    nationality: null,
    marital_status: null,
    religion: null,
    gender: null,
    ethnic: null,
    blood_type: null,
    no_id: null,
    employee_code: summary.employee_code ?? null,
    contract_number: summary.contract_number ?? null,
    department: summary.primary_application?.job_snapshot?.department_name ?? null,
    designation: summary.primary_application?.job_snapshot?.designation_name ?? null,
    employment_type: null,
    employment_start_date: null,
    emergency_contact_name: null,
    emergency_contact_phone: summary.phone ?? null,
    custom_grup_1_id: null,
    custom_grup_2_id: null,
    custom_grup_3_id: null,
    custom_grup_4_id: null,
    custom_grup_5_id: null,
    custom_grup_6_id: null,
    is_active: normalizeRoleName(summary.status) === "active",
    role: summary.role ?? "candidate",
    role_id: null,
    created_at: summary.created_at ?? null,
    activated_at: summary.activated_at ?? summary.created_at ?? null,
    updated_at: summary.updated_at ?? null,
    last_login_at: summary.last_login_at ?? null,
    candidate_form_completion_status: null,
    candidate_form_updated_at: null,
  }
}

export async function loadManagedUsers(context, scope = "all") {
  requireAnyPermission(context, ["user:read", "candidate_employee:read"])

  const accessScope = getUserManagementAccessScope(context)
  const userListScope = normalizeUserListScope(scope)
  const { supabase } = context

  const profileSelect = `id,
    username,
    email,
    full_name,
    phone,
    avatar_url,
    department_id,
    master_designation_id,
    department_ref:master_department(name),
    master_designation_ref:master_designation(name),
    main_position,
    cost_center_pt_id,
    is_active,
    personal_data,
    created_at`
  const profileSelectWithoutCostCenter = profileSelect.replace("    cost_center_pt_id,\n", "")

  async function fetchActiveProfiles(select) {
    return supabase
      .from("profiles")
      .select(select)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
  }

  let { data: profiles, error: profileError } = await fetchActiveProfiles(profileSelect)

  if (
    profileError &&
    /cost_center_pt_id/i.test(profileError.message) &&
    isMissingDatabaseObjectError(profileError)
  ) {
    console.warn("profiles.cost_center_pt_id is not available; continuing without cost center data.")
    const fallbackResult = await fetchActiveProfiles(profileSelectWithoutCostCenter)
    profiles = fallbackResult.data
    profileError = fallbackResult.error
  }

  if (profileError) {
    throw new Error(profileError.message)
  }

  if (!profiles || profiles.length === 0) {
    if (userListScope === "candidate" || userListScope === "candidateemployee" || userListScope === "all") {
      return listManagedCandidateUsersFromCandidateDatabase(accessScope, supabase)
    }

    return []
  }

  const userIds = profiles.map((profile) => profile.id)
  const needsCandidateData =
    userListScope === "candidate" || userListScope === "candidateemployee" || userListScope === "all"

  const [{ data: userRoles, error: rolesError }, authUsers] = await Promise.all([
    supabase
      .from("user_roles")
      .select("user_id, role_id, roles(name)")
      .in("user_id", userIds),
    accessScope.isStaff && !accessScope.canReadAllCandidates && accessScope.userId
      ? listAllAuthUsers(supabase)
      : Promise.resolve([]),
  ])

  if (rolesError) {
    throw new Error(rolesError.message)
  }

  let candidateBindings = new Map()
  if (needsCandidateData) {
    try {
      candidateBindings = await listCandidateBindingsByIdentityUserIdsFromCandidateDatabase(userIds)
    } catch (error) {
      if (
        !isMissingDatabaseObjectError(error) &&
        !/HRD_PINTU_SUPABASE_/i.test(String(error?.message ?? error))
      ) {
        throw error
      }
      console.warn("Candidate database schema is unavailable; continuing without candidate bindings.")
    }
  }

  const emailMap = new Map()
  const creatorMap = new Map()
  for (const authUser of authUsers) {
    if (authUser.email) {
      emailMap.set(authUser.id, authUser.email)
    }
    creatorMap.set(authUser.id, extractCreatorId(authUser))
  }

  const roleMap = new Map()
  for (const userRole of userRoles ?? []) {
    roleMap.set(userRole.user_id, {
      roleId: userRole.role_id,
      roleName: String(userRole?.roles?.name ?? "").trim() || null,
    })
  }

  const candidateBindingMap = new Map()
  for (const [candidateId, binding] of candidateBindings.entries()) {
    if (!candidateId || candidateBindingMap.has(candidateId)) {
      continue
    }

    candidateBindingMap.set(candidateId, binding ?? null)
  }

  const filteredProfiles =
    accessScope.isStaff && !accessScope.canReadAllCandidates && accessScope.userId
      ? profiles.filter((profile) => {
          const roleInfo = roleMap.get(profile.id)
          return (
            normalizeRoleName(roleInfo?.roleName) === "candidate" &&
            creatorMap.get(profile.id) === accessScope.userId &&
            roleMatchesUserListScope(roleInfo?.roleName, userListScope)
          )
        })
      : profiles.filter((profile) =>
          roleMatchesUserListScope(roleMap.get(profile.id)?.roleName, userListScope),
        )

  const localUsers = filteredProfiles.map((profile) =>
    mapManagedUser(
      profile,
      roleMap.get(profile.id) ?? { roleId: null, roleName: null },
      profile.email ?? emailMap.get(profile.id) ?? "",
      candidateBindingMap.get(profile.id) ?? null,
    ),
  )

  let candidateServiceUsers = []
  if (needsCandidateData) {
    try {
      candidateServiceUsers = await listManagedCandidateUsersFromCandidateDatabase(
        accessScope,
        supabase,
      )
    } catch (error) {
      if (
        !isMissingDatabaseObjectError(error) &&
        !/HRD_PINTU_SUPABASE_/i.test(String(error?.message ?? error))
      ) {
        throw error
      }
      console.warn("Candidate database schema is unavailable; continuing without candidate accounts.")
    }
  }

  return [...candidateServiceUsers, ...localUsers].sort((left, right) =>
    String(right.created_at ?? "").localeCompare(String(left.created_at ?? "")),
  )
}

export async function loadUserHistory(context) {
  requireAnyPermission(context, ["user:read", "user_history:read"])
  const accessScope = getUserManagementAccessScope(context)

  const { data: profiles, error: profileError } = await context.supabase
    .from("profiles")
    .select("id, email, username, full_name, main_position, created_at, is_active")
    .eq("is_active", false)
    .order("created_at", { ascending: false })

  if (profileError) {
    throw new Error(profileError.message)
  }

  const localHistory = []

  if (profiles && profiles.length > 0) {
    const userIds = profiles.map((profile) => profile.id)
    const { data: userRoles, error: rolesError } = await context.supabase
      .from("user_roles")
      .select("user_id, roles(name)")
      .in("user_id", userIds)

    if (rolesError) {
      throw new Error(rolesError.message)
    }

    const roleMap = new Map()
    for (const userRole of userRoles ?? []) {
      roleMap.set(userRole.user_id, String(userRole?.roles?.name ?? "").trim() || null)
    }

    localHistory.push(
      ...profiles.map((profile) => ({
        id: profile.id,
        account_source: "internal",
        email: profile.email ?? null,
        username: profile.username ?? null,
        full_name: profile.full_name ?? null,
        role: roleMap.get(profile.id) ?? null,
        main_position: profile.main_position ?? null,
        created_at: profile.created_at ?? null,
        is_active: profile.is_active ?? false,
      })),
    )
  }

  const remoteHistory = await loadCandidateUserHistoryFromCandidateDatabase(accessScope)

  return [...remoteHistory, ...localHistory].sort((left, right) =>
    resolveUserHistorySortTimestamp(right).localeCompare(resolveUserHistorySortTimestamp(left)),
  )
}

export async function loadUserManagementRoles(context, scope = "all") {
  requireAnyPermission(context, ["user:read", "candidate_employee:read", "user:create", "user:update"])

  const accessScope = getUserManagementAccessScope(context)
  const normalizedScope = normalizeUserListScope(scope)
  const { data, error } = await context.supabase
    .from("roles")
    .select("id, name, description")
    .order("name", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const roles = data ?? []
  if (normalizedScope === "candidate") {
    return roles.filter((role) => normalizeRoleName(role.name) === "candidate")
  }

  if (normalizedScope === "employee") {
    return roles.filter((role) => normalizeRoleName(role.name) === "employee")
  }

  if (normalizedScope === "candidateemployee") {
    return roles.filter((role) => {
      const roleName = normalizeRoleName(role.name)
      return roleName === "candidate" || roleName === "employee"
    })
  }

  if (normalizedScope === "users") {
    return roles.filter((role) => {
      const roleName = normalizeRoleName(role.name)
      return roleName !== "candidate" && roleName !== "employee"
    })
  }

  if (accessScope.isStaff) {
    return roles.filter((role) => normalizeRoleName(role.name) === "candidate")
  }

  return roles
}

export async function createManagedUser(context, input) {
  requireAnyPermission(context, ["user:create"])

  const accessScope = getUserManagementAccessScope(context)
  const roleName = await getRoleNameById(context.supabase, input.role_id)

  if (accessScope.isStaff && roleName !== "candidate") {
    throw createHttpError(403, "Staff can only create users with the candidate role.")
  }

  if (roleName === "candidate") {
    const fullName = String(input.full_name ?? "").trim()
    const phone = String(input.phone ?? "").trim() || null
    const employeeCode = String(input.employee_code ?? "").trim() || null
    const password = String(input.password ?? "").trim() || generateCandidatePassword()
    const binding = await resolveProfileAssignment(context.supabase, input)

    assertCandidateBindableEmployeeRequestForm(binding)

    const candidateSummary = await createCandidateServiceAccount({
      email: input.email,
      password,
      full_name: fullName,
      phone,
      employee_code: employeeCode,
      created_by_internal_user_id: accessScope.userId ?? null,
      erf_id: binding.employee_request_form_id,
      job_snapshot: buildCandidateJobSnapshot(binding),
    })

    runInBackground(
      () =>
        sendCandidateCredentialEmailIfEligible({
          email: candidateSummary?.email ?? input.email,
          password,
          candidateName: candidateSummary?.full_name ?? fullName,
          mainPosition:
            candidateSummary?.primary_application?.job_snapshot?.main_position ??
            binding.main_position ??
            null,
        }),
      "candidate credential email",
    )

    return (
      await getManagedCandidateUserFromCandidateDatabase(candidateSummary.candidate_id, context.supabase)
    ) ?? mapCandidateSummaryToManagedUser(candidateSummary)
  }

  const { data: authData, error: authError } = await context.supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: accessScope.userId
      ? {
          created_by: accessScope.userId,
        }
      : undefined,
  })

  if (authError) {
    throw new Error(authError.message)
  }

  if (!authData.user) {
    throw new Error("Failed to create user account.")
  }

  const userId = authData.user.id
  const fullName = String(input.full_name ?? "").trim()
  const phone = String(input.phone ?? "").trim() || null
  const username = String(input.username ?? "").trim() || null
  const binding = await resolveProfileAssignment(context.supabase, input)
  const designationIds = await resolveProfileDesignationIds(context.supabase, binding)
  const costCenterPtId = String(input.cost_center_pt_id ?? "").trim() || null
  const personalData = buildPersonalData(
    {
      full_name: fullName,
      email: input.email,
      phone,
    },
    null,
  )
  personalData.employee_code = String(input.employee_code ?? "").trim() || null
  personalData.contract_number = String(input.contract_number ?? "").trim() || null

  const { error: profileError } = await context.supabase
    .from("profiles")
    .update({
      username,
      email: input.email,
      full_name: fullName,
      phone,
      department_id: binding.department_id,
      master_designation_id: designationIds.master_designation_id,
      main_position: binding.main_position,
      cost_center_pt_id: costCenterPtId,
      is_active: input.is_active ?? true,
      personal_data: personalData,
    })
    .eq("id", userId)

  if (profileError) {
    throw new Error(profileError.message)
  }

  const { error: roleError } = await context.supabase.from("user_roles").insert({
    user_id: userId,
    role_id: input.role_id,
  })

  if (roleError) {
    throw new Error(roleError.message)
  }

  return mapManagedUser(
    {
      id: userId,
      username,
      email: input.email,
      full_name: fullName,
      phone,
      department_id: binding.department_id,
      master_designation_id: designationIds.master_designation_id,
      main_position: binding.main_position,
      cost_center_pt_id: costCenterPtId,
      is_active: input.is_active ?? true,
      personal_data: personalData,
      created_at: getJakartaTimestamp(),
    },
    {
      roleId: input.role_id,
      roleName,
    },
    input.email,
    binding.employee_request_form_id,
  )
}

export async function updateManagedUser(context, userId, input) {
  requireAnyPermission(context, ["user:update"])

  const accessScope = getUserManagementAccessScope(context)
  const roleName = await getRoleNameById(context.supabase, input.role_id)
  const candidateServiceUserId = decodeCandidateServiceUserId(userId)

  if (candidateServiceUserId) {
    await assertStaffCanManageCandidateAccount(candidateServiceUserId, accessScope)

    const existingCandidate = await getManagedCandidateUserFromCandidateDatabase(
      candidateServiceUserId,
      context.supabase,
    )
    const currentCandidateRoleName = normalizeRoleName(existingCandidate?.role)

    if (currentCandidateRoleName === "candidate" && roleName !== "candidate") {
      throw createHttpError(
        400,
        "Candidate service accounts cannot be reassigned to internal roles.",
      )
    }

    const binding = await resolveProfileAssignment(context.supabase, input)
    const isErfBindingChanged =
      binding.employee_request_form_id
      && binding.employee_request_form_id !== existingCandidate?.employee_request_form_id

    if (isErfBindingChanged) {
      assertCandidateBindableEmployeeRequestForm(binding)
    }
    const employeeCode = String(input.employee_code ?? "").trim() || null

    let candidateSummary = await updateCandidateServiceAccount(candidateServiceUserId, {
      email: input.email,
      full_name: input.full_name,
      phone: input.phone,
      employee_code: employeeCode,
      contract_number: String(input.contract_number ?? "").trim() || null,
      created_by_internal_user_id: accessScope.userId ?? null,
      ...(isErfBindingChanged
        ? {
            erf_id: binding.employee_request_form_id,
            job_snapshot: buildCandidateJobSnapshot(binding),
          }
        : {}),
    })

    if (isErfBindingChanged) {
      candidateSummary = await addCandidateServiceApplication(candidateServiceUserId, {
        erf_id: binding.employee_request_form_id,
        job_snapshot: buildCandidateJobSnapshot(binding),
      })
    }

    if (isNonEmptyString(input.password)) {
      candidateSummary = await resetCandidateServicePassword(
        candidateServiceUserId,
        input.password.trim(),
      )
    }

    return (
      await getManagedCandidateUserFromCandidateDatabase(candidateServiceUserId, context.supabase)
    ) ?? mapCandidateSummaryToManagedUser(candidateSummary)
  }

  await assertCanManageUser(context.supabase, accessScope, userId)

  if (accessScope.isStaff && roleName !== "candidate") {
    throw createHttpError(403, "Staff can only save users with the candidate role.")
  }

  const currentRoleName = await getCurrentRoleNameByUserId(context.supabase, userId)
  if (currentRoleName === "candidate" && roleName !== "candidate") {
    throw createHttpError(
      400,
      "Candidate accounts cannot be reassigned to employee roles here.",
    )
  }

  const authPayload = { email: input.email }
  if (isNonEmptyString(input.password)) {
    authPayload.password = input.password.trim()
  }

  const { error: authError } = await context.supabase.auth.admin.updateUserById(userId, authPayload)
  if (authError) {
    throw new Error(authError.message)
  }

  const fullName = String(input.full_name ?? "").trim()
  const phone = String(input.phone ?? "").trim() || null
  const username = String(input.username ?? "").trim() || null
  const binding = await resolveProfileAssignment(context.supabase, input)
  const designationIds = await resolveProfileDesignationIds(context.supabase, binding)
  const existingProfile = await getProfileById(context.supabase, userId)
  const personalData = buildPersonalData(
    {
      full_name: fullName,
      email: input.email,
      phone,
    },
    existingProfile?.personal_data,
  )
  if (Object.prototype.hasOwnProperty.call(input, "employee_code")) {
    personalData.employee_code = String(input.employee_code ?? "").trim() || null
  }
  if (Object.prototype.hasOwnProperty.call(input, "contract_number")) {
    personalData.contract_number = String(input.contract_number ?? "").trim() || null
  }

  const costCenterPtId = Object.prototype.hasOwnProperty.call(input, "cost_center_pt_id")
    ? String(input.cost_center_pt_id ?? "").trim() || null
    : existingProfile?.cost_center_pt_id ?? null

  const { error: profileError } = await context.supabase
    .from("profiles")
    .update({
      username,
      email: input.email,
      full_name: fullName,
      phone,
      department_id: binding.department_id,
      master_designation_id: designationIds.master_designation_id,
      main_position: binding.main_position,
      cost_center_pt_id: costCenterPtId,
      is_active: input.is_active ?? true,
      personal_data: personalData,
    })
    .eq("id", userId)

  if (profileError) {
    throw new Error(profileError.message)
  }

  const { error: deleteError } = await context.supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  const { error: insertError } = await context.supabase.from("user_roles").insert({
    user_id: userId,
    role_id: input.role_id,
  })

  if (insertError) {
    throw new Error(insertError.message)
  }

  return mapManagedUser(
    {
      id: userId,
      username,
      email: input.email,
      full_name: fullName,
      phone,
      department_id: binding.department_id,
      master_designation_id: designationIds.master_designation_id,
      main_position: binding.main_position,
      cost_center_pt_id: costCenterPtId,
      is_active: input.is_active ?? true,
      personal_data: personalData,
      created_at: existingProfile?.created_at ?? null,
    },
    {
      roleId: input.role_id,
      roleName,
    },
    input.email,
    binding.employee_request_form_id,
  )
}

export async function deleteManagedUser(context, userId) {
  requireAnyPermission(context, ["user:update"])

  const accessScope = getUserManagementAccessScope(context)
  const candidateServiceUserId = decodeCandidateServiceUserId(userId)

  if (candidateServiceUserId) {
    await assertStaffCanManageCandidateAccount(candidateServiceUserId, accessScope)
    await revokeCandidateServiceAccount(candidateServiceUserId)
    return
  }

  await assertCanManageUser(context.supabase, accessScope, userId)

  const { error } = await context.supabase.auth.admin.deleteUser(userId)
  if (error) {
    throw new Error(error.message)
  }
}

export async function updateManagedUserRole(context, userId, roleId) {
  requireAnyPermission(context, ["user:update"])

  const accessScope = getUserManagementAccessScope(context)
  const roleName = await getRoleNameById(context.supabase, roleId)
  const candidateServiceUserId = decodeCandidateServiceUserId(userId)

  if (candidateServiceUserId) {
    await assertStaffCanManageCandidateAccount(candidateServiceUserId, accessScope)
    if (roleName !== "candidate") {
      throw createHttpError(
        400,
        "Candidate service accounts cannot be reassigned to another role.",
      )
    }

    return
  }

  await assertCanManageUser(context.supabase, accessScope, userId)

  if (accessScope.isStaff && roleName !== "candidate") {
    throw createHttpError(403, "Staff can only assign the candidate role.")
  }

  const { error: deleteError } = await context.supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  const { error: insertError } = await context.supabase.from("user_roles").insert({
    user_id: userId,
    role_id: roleId,
  })

  if (insertError) {
    throw new Error(insertError.message)
  }
}

export async function setManagedUserActiveStatus(context, userId, isActive) {
  requireAnyPermission(context, ["user:update"])

  const accessScope = getUserManagementAccessScope(context)
  const candidateServiceUserId = decodeCandidateServiceUserId(userId)

  if (candidateServiceUserId) {
    await assertStaffCanManageCandidateAccount(candidateServiceUserId, accessScope)
    await setCandidateServiceAccountActive(candidateServiceUserId, isActive)
    return
  }

  await assertCanManageUser(context.supabase, accessScope, userId)

  if (!isActive && context.userId === userId) {
    throw createHttpError(400, "You cannot deactivate your own account.")
  }

  const { error } = await context.supabase
    .from("profiles")
    .update({ is_active: Boolean(isActive) })
    .eq("id", userId)

  if (error) {
    throw new Error(error.message)
  }
}

async function switchManagedUserToEmployeeInternal(context, userId) {
  const accessScope = getUserManagementAccessScope(context)
  const candidateServiceUserId = decodeCandidateServiceUserId(userId)

  if (!candidateServiceUserId) {
    throw createHttpError(
      400,
      "Only candidate portal accounts can be switched to employee mode.",
    )
  }

  await assertStaffCanManageCandidateAccount(candidateServiceUserId, accessScope)

  const summary = await switchCandidateServiceAccountToEmployee(candidateServiceUserId)

  return (
    await getManagedCandidateUserFromCandidateDatabase(candidateServiceUserId, context.supabase)
  ) ?? mapCandidateSummaryToManagedUser(summary)
}

export async function switchManagedUserToEmployee(context, userId) {
  requireAnyPermission(context, ["user:switch_to_employee"])
  return switchManagedUserToEmployeeInternal(context, userId)
}

export async function setPassedCandidateToEmployee(context, userId) {
  return switchManagedUserToEmployeeInternal(context, userId)
}
