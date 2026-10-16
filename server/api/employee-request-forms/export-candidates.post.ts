import { readBody } from "h3"

import type { CandidateForm } from "@/domain/entities/CandidateForm"
import { requireAnyPermission } from "~~/server/lib/context.js"
import { isStaffRole, normalizeRoleName } from "~~/server/lib/utils.js"
import {
  getCandidateFormFromCandidateDatabase,
  listManagedCandidateUsersByEmployeeRequestFormIds,
} from "~~/server/services/candidateDatabaseReadService.js"
import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function pickLatestEducation(education) {
  if (!Array.isArray(education) || education.length === 0) {
    return null
  }

  return [...education].sort((left, right) => {
    const leftToYear = Number(left?.to_year ?? 0)
    const rightToYear = Number(right?.to_year ?? 0)
    if (rightToYear !== leftToYear) {
      return rightToYear - leftToYear
    }

    const leftFromYear = Number(left?.from_year ?? 0)
    const rightFromYear = Number(right?.from_year ?? 0)
    return rightFromYear - leftFromYear
  })[0] ?? null
}

function pickLatestWorkHistory(workHistory) {
  if (!Array.isArray(workHistory) || workHistory.length === 0) {
    return null
  }

  return [...workHistory].sort((left, right) => {
    const leftToYear = Number(left?.to_year ?? 0)
    const rightToYear = Number(right?.to_year ?? 0)
    if (rightToYear !== leftToYear) {
      return rightToYear - leftToYear
    }

    const leftFromYear = Number(left?.from_year ?? 0)
    const rightFromYear = Number(right?.from_year ?? 0)
    return rightFromYear - leftFromYear
  })[0] ?? null
}

function joinParts(parts) {
  return parts.map(normalizeText).filter(Boolean).join(" - ") || null
}

function isSelectedCandidate(candidate: { role?: unknown }) {
  return normalizeRoleName(candidate?.role) !== "candidate"
}

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  requireAnyPermission(context, ["recruitment:read"])

  const body = await readBody<{ employee_request_form_ids?: unknown[] }>(event)
  const requestedEmployeeRequestFormIds = [
    ...new Set(
      (Array.isArray(body?.employee_request_form_ids) ? body.employee_request_form_ids : [])
        .map(normalizeText)
        .filter(Boolean),
    ),
  ]

  if (requestedEmployeeRequestFormIds.length === 0) {
    return {
      candidates: [],
    }
  }

  let visibleEmployeeRequestFormIds = requestedEmployeeRequestFormIds

  if (normalizeRoleName(context.roleName) === "manager" && context.userId) {
    const { data, error } = await context.supabase
      .from("employee_request_form")
      .select("id")
      .eq("created_by", context.userId)
      .in("id", requestedEmployeeRequestFormIds)

    if (error) {
      throw new Error(error.message)
    }

    visibleEmployeeRequestFormIds = (data ?? [])
      .map((item) => normalizeText(item.id))
      .filter(Boolean)
  }

  if (visibleEmployeeRequestFormIds.length === 0) {
    return {
      candidates: [],
      employee_request_forms: [],
    }
  }

  const { data: employeeRequestForms, error: employeeRequestFormsError } = await context.supabase
    .from("employee_request_form")
    .select("id, direct_manager")
    .in("id", visibleEmployeeRequestFormIds)

  if (employeeRequestFormsError) {
    throw new Error(employeeRequestFormsError.message)
  }

  const candidates = await listManagedCandidateUsersByEmployeeRequestFormIds(
    {
      isStaff: isStaffRole(context.roleName),
      isManager: normalizeRoleName(context.roleName) === "manager",
      roleName: context.roleName,
      userId: context.userId,
      employeeRequestFormIds: visibleEmployeeRequestFormIds,
    },
    visibleEmployeeRequestFormIds,
  )

  const selectedCandidateByEmployeeRequestFormId = new Map<
    string,
    {
      employee_request_form_id: string | null
      candidate_id: string | null
      full_name: string | null
      email: string | null
      phone_number: string | null
      date_of_birth: string | null
      place_of_birth: string | null
      gender: string | null
      marital_status: string | null
      nationality: string | null
      religion: string | null
      id_no: string | null
      id_card_address: string | null
      residential_address: string | null
      available_start_date: string | null
      notice_period: string | null
      latest_education: string | null
      latest_work_history: string | null
      candidate_form_completion_status: string | null
    }
  >()
  const candidateForms = new Array<CandidateForm>()

  for (const candidate of candidates) {
    if (!isSelectedCandidate(candidate)) {
      continue
    }

    const employeeRequestFormId = normalizeText(candidate.employee_request_form_id)
    const candidateId = normalizeText(candidate.id)
    if (
      !employeeRequestFormId ||
      !candidateId ||
      selectedCandidateByEmployeeRequestFormId.has(employeeRequestFormId)
    ) {
      continue
    }

    const candidateForm = await getCandidateFormFromCandidateDatabase(candidateId, {
      isStaff: isStaffRole(context.roleName),
      isManager: normalizeRoleName(context.roleName) === "manager",
      roleName: context.roleName,
      userId: context.userId,
      employeeRequestFormIds: visibleEmployeeRequestFormIds,
    })
    const latestEducation = pickLatestEducation(candidateForm?.education)
    const latestWorkHistory = pickLatestWorkHistory(candidateForm?.work_history)

    if (candidateForm) {
      candidateForms.push(candidateForm)
    }

    selectedCandidateByEmployeeRequestFormId.set(employeeRequestFormId, {
      employee_request_form_id: employeeRequestFormId || null,
      candidate_id: candidateId || null,
      full_name: normalizeText(candidateForm?.full_name) || normalizeText(candidate.full_name) || null,
      email:
        normalizeText(candidateForm?.personal_email) || normalizeText(candidate.email) || null,
      phone_number: normalizeText(candidateForm?.phone_number) || null,
      date_of_birth: normalizeText(candidateForm?.date_of_birth) || null,
      place_of_birth: normalizeText(candidateForm?.place_of_birth) || null,
      gender: normalizeText(candidateForm?.gender) || null,
      marital_status: normalizeText(candidateForm?.marital_status) || null,
      nationality: normalizeText(candidateForm?.nationality) || null,
      religion: normalizeText(candidateForm?.religion) || null,
      id_no: normalizeText(candidateForm?.id_no) || null,
      id_card_address: normalizeText(candidateForm?.id_card_address) || null,
      residential_address: normalizeText(candidateForm?.residential_address) || null,
      available_start_date: normalizeText(candidateForm?.available_start_date) || null,
      notice_period: normalizeText(candidateForm?.notice_period) || null,
      latest_education: joinParts([
        latestEducation?.level,
        latestEducation?.institution,
        latestEducation?.major,
      ]),
      latest_work_history: joinParts([
        latestWorkHistory?.position,
        latestWorkHistory?.company,
      ]),
      candidate_form_completion_status:
        normalizeText(candidateForm?.completion_status) ||
        normalizeText(candidate.candidate_form_completion_status) ||
        null,
    })
  }

  return {
    candidates: Array.from(selectedCandidateByEmployeeRequestFormId.values()),
    employee_request_forms: (employeeRequestForms ?? []).map((item) => ({
      id: normalizeText(item?.id) || null,
      direct_manager: normalizeText(item?.direct_manager) || null,
    })),
    candidate_forms: candidateForms,
  }
})
