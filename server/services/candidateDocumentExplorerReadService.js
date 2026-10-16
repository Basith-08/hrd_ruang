import { isAdminRole, isMissingDatabaseObjectError } from "~~/server/lib/utils.js"
import { listCandidateDocumentExplorerItemsFromCandidateDatabase } from "~~/server/services/candidateDatabaseReadService.js"

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

export async function listCandidateDocumentExplorerItemsForDashboard(context) {
  const accessScope = await buildAccessScope(context)
  try {
    return await listCandidateDocumentExplorerItemsFromCandidateDatabase(
      accessScope,
      context.supabase,
    )
  } catch (error) {
    if (
      !isMissingDatabaseObjectError(error) &&
      !/HRD_PINTU_SUPABASE_/i.test(String(error?.message ?? error))
    ) {
      throw error
    }
    console.warn("Candidate database schema is unavailable; dashboard document readiness defaults to zero.")
    return []
  }
}
