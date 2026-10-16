import { createHttpError } from "~~/server/lib/errors.js"
import { isAdminRole, isMissingDatabaseObjectError } from "~~/server/lib/utils.js"
import {
  countCandidateFormsFromCandidateDatabase,
  getCandidateFormFromCandidateDatabase,
  listCandidateFormsFromCandidateDatabase,
} from "~~/server/services/candidateDatabaseReadService.js"

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : ""
}

async function buildAccessScope(context) {
  const roleName = normalizeText(context?.roleName).toLowerCase()
  const isAdmin = isAdminRole(roleName)
  const isCandidate = roleName === "candidate"
  const isManager = roleName === "manager"
  let employeeRequestFormIds = []

  if (isManager && !isAdmin) {
    const { data, error } = await context.supabase
      .from("employee_request_form")
      .select("id")
      .eq("created_by", context.userId)

    if (error) {
      throw new Error(error.message)
    }

    employeeRequestFormIds = (data ?? []).map((item) => String(item.id ?? "").trim()).filter(Boolean)
  }

  return {
    isAdmin,
    isCandidate,
    isManager,
    employeeRequestFormIds,
    userId: context.userId ?? null,
  }
}

function sortCandidateFormsDescending(candidateForms) {
  return [...candidateForms].sort((left, right) =>
    String(right?.updated_at ?? right?.created_at ?? "").localeCompare(
      String(left?.updated_at ?? left?.created_at ?? ""),
    ),
  )
}

export async function listCandidateFormsForDashboard(context) {
  const accessScope = await buildAccessScope(context)
  return sortCandidateFormsDescending(
    await listCandidateFormsFromCandidateDatabase(accessScope),
  )
}

export async function countCandidateFormsForDashboard(context) {
  const accessScope = await buildAccessScope(context)
  try {
    return await countCandidateFormsFromCandidateDatabase(accessScope)
  } catch (error) {
    if (
      !isMissingDatabaseObjectError(error) &&
      !/HRD_PINTU_SUPABASE_/i.test(String(error?.message ?? error))
    ) {
      throw error
    }
    console.warn("Candidate database schema is unavailable; dashboard candidate count defaults to zero.")
    return 0
  }
}

export async function getCandidateFormForDashboard(context, candidateFormId) {
  const normalizedId = normalizeText(candidateFormId)
  if (!normalizedId) {
    throw createHttpError(400, "Candidate form id is required.")
  }

  const accessScope = await buildAccessScope(context)
  return getCandidateFormFromCandidateDatabase(normalizedId, accessScope)
}

export async function getCandidateFormsForDashboardByIds(context, candidateFormIds) {
  const normalizedIds = [
    ...new Set((Array.isArray(candidateFormIds) ? candidateFormIds : [])
      .map((item) => normalizeText(item))
      .filter(Boolean)),
  ]

  if (!normalizedIds.length) {
    return []
  }

  const accessScope = await buildAccessScope(context)
  const candidateForms = await Promise.all(
    normalizedIds.map((candidateFormId) =>
      getCandidateFormFromCandidateDatabase(candidateFormId, accessScope),
    ),
  )

  return candidateForms.filter(Boolean)
}
