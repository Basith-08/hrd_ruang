import { requireAnyPermission } from "~~/server/lib/context.js"
import { createHttpError } from "~~/server/lib/errors.js"
import { normalizeRoleName } from "~~/server/lib/utils.js"
import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  const canReadEmployeeRequestForm = context.permissions.includes("employee_request_form:read")
  const canReadRecruitmentDetail =
    context.permissions.includes("recruitment:vacancy_pipeline_detail")
    || context.permissions.includes("recruitment:closed_vacancy_detail")

  requireAnyPermission(context, [
    "employee_request_form:read",
    "recruitment:approved_erf_read",
    "recruitment:vacancy_pipeline_detail",
    "recruitment:closed_vacancy_detail",
  ])

  const employeeRequestFormId = normalizeText(event.context.params?.id)
  if (!employeeRequestFormId) {
    throw createHttpError(400, "Employee request form id is required.")
  }

  let query = context.supabase
    .from("employee_request_form")
    .select(`
      *,
      recruiter_profile:profiles!employee_request_form_recruiter_user_id_fkey(
        full_name,
        username,
        email
      ),
      approval_director_bu_profile:profiles!employee_request_form_approval_director_bu_id_fkey(
        full_name,
        username,
        main_position
      ),
      pt:master_pt(id, name),
      department_ref:master_department(id, name),
      master_designation_ref:master_designation(id, name),
      custom_grup_1:master_custom_grup_1(name),
      custom_grup_2:master_custom_grup_2(name),
      custom_grup_3:master_custom_grup_3(name),
      custom_grup_4:master_custom_grup_4(name),
      custom_grup_5:master_custom_grup_5(name),
      custom_grup_6:master_custom_grup_6(name)
    `)
    .eq("id", employeeRequestFormId)

  if (normalizeRoleName(context.roleName) === "manager" && context.userId) {
    query = query.eq("created_by", context.userId)
  }

  if (!canReadEmployeeRequestForm && !canReadRecruitmentDetail) {
    query = query.not("approval_director_hrd_date", "is", null)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw createHttpError(404, "Job request data not found or inaccessible.")
  }

  return {
    employee_request_form: data,
  }
})
