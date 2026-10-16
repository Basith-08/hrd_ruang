export const REQUIRED_APP_PERMISSIONS = [
  {
    name: "dashboard:read",
    description: "View the main dashboard",
  },
  {
    name: "employee_request_form:create",
    description: "Create employee request forms",
  },
  {
    name: "employee_request_form:read",
    description: "View employee request forms",
  },
  {
    name: "employee_request_form:requester_read",
    description: "View the requester field on employee request forms",
  },
  {
    name: "employee_request_form:requester_update",
    description: "Update the requester field on employee request forms",
  },
  {
    name: "employee_request_form:update",
    description: "Update employee request forms",
  },
  {
    name: "employee_request_form:assign_recruiter",
    description: "Assign recruiters to approved employee request forms",
  },
  {
    name: "employee_request_form:delete",
    description: "Delete employee request forms",
  },
  {
    name: "employee_request_form:close",
    description: "Close ERF records from the Employee Request Form list",
  },
  {
    name: "employee_request_form:export_pdf",
    description: "Export ERF records to PDF from the Employee Request Form list",
  },
  {
    name: "approval:action",
    description: "Approve or reject assigned approval requests",
  },
  {
    name: "approval:read",
    description: "View approval tracking and approver configuration",
  },
  {
    name: "approval:tracking_all",
    description: "View all approval tracking data across users",
  },
  {
    name: "recruitment:read",
    description: "View recruitment dashboard",
  },
  {
    name: "recruitment:approved_erf_read",
    description: "View approved employee request forms",
  },
  {
    name: "pic_recruitment:read",
    description: "View PIC recruitment page and approved ERF assignment queue",
  },
  {
    name: "pic_recruitment:update",
    description: "Assign or update recruiters from the PIC recruitment page",
  },
  {
    name: "recruitment:vacancy_pipeline",
    description: "View vacancy pipeline page in the recruitment module",
  },
  {
    name: "recruitment:vacancy_pipeline_detail",
    description: "Open vacancy pipeline detail from the recruitment module",
  },
  {
    name: "recruitment:closed_vacancy",
    description: "View closed vacancy page in the recruitment module",
  },
  {
    name: "recruitment:closed_vacancy_detail",
    description: "Open closed vacancy detail from the recruitment module",
  },
  {
    name: "recruitment:candidate_database",
    description: "View candidate database page in the recruitment module",
  },
  {
    name: "recruitment:interview_evaluasi",
    description: "View interview evaluasi page in the recruitment module",
  },
  {
    name: "recruitment:document_explorer",
    description: "View candidate document explorer in the recruitment module",
  },
  {
    name: "candidate_form:create",
    description: "Create candidate forms",
  },
  {
    name: "candidate_form:read",
    description: "View candidate forms",
  },
  {
    name: "candidate_form:update",
    description: "Update candidate forms",
  },
  {
    name: "candidate_form:delete",
    description: "Delete candidate forms",
  },
  {
    name: "candidate_form:export_pdf",
    description: "Export candidate forms to PDF",
  },
  {
    name: "employee_form:create",
    description: "Create employee forms",
  },
  {
    name: "employee_form:read",
    description: "View employee forms",
  },
  {
    name: "employee_form:update",
    description: "Update employee forms",
  },
  {
    name: "employee_form:update_contract_documents",
    description: "Upload Draft Employment Contract and SKB from Employee Form details",
  },
  {
    name: "employee_form:delete",
    description: "Delete employee forms",
  },
  {
    name: "employee_form:export_pdf",
    description: "Export employee forms to PDF",
  },
  {
    name: "employee_contract_form:create",
    description: "Create new employee contract forms (NECF)",
  },
  {
    name: "employee_contract_form:read",
    description: "View new employee contract forms (NECF)",
  },
  {
    name: "employee_contract_form:read_all",
    description: "View all new employee contract form (NECF) records regardless of who created them",
  },
  {
    name: "employee_contract_form:update",
    description: "Update new employee contract forms (NECF)",
  },
  {
    name: "employee_contract_form:delete",
    description: "Delete new employee contract forms (NECF)",
  },
  {
    name: "employee_contract_form:export_pdf",
    description: "Print or export new employee contract forms (NECF) to PDF",
  },
  {
    name: "export_configuration:read",
    description: "View export configuration menu and overview page",
  },
  {
    name: "export_configuration:manage",
    description: "Manage DOCX export templates and field mapping",
  },
  {
    name: "export_configuration:generate",
    description: "Prepare, preview, and generate export documents",
  },
  {
    name: "interview_evaluation:create",
    description: "Create interview evaluation forms",
  },
  {
    name: "interview_evaluation:read",
    description: "View interview evaluation forms",
  },
  {
    name: "interview_evaluation:read_all",
    description: "View all interview evaluation forms regardless of who created them",
  },
  {
    name: "interview_evaluation:update",
    description: "Update interview evaluation forms",
  },
  {
    name: "interview_evaluation:interviewer_form",
    description: "Access interviewer assignments and submit assigned interview evaluations",
  },
  {
    name: "interview_evaluation:delete",
    description: "Delete interview evaluation forms",
  },
  {
    name: "document:download",
    description: "Download employee request form and candidate attachments",
  },
  {
    name: "role:manage",
    description: "Manage roles and permission assignments",
  },
  {
    name: "user:create",
    description: "Create and assign application users",
  },
  {
    name: "user:read",
    description: "View users and assigned roles",
  },
  {
    name: "candidate_employee:read",
    description: "View candidate and employee user list",
  },
  {
    name: "candidate_employee:read_all",
    description: "View all candidate and employee records regardless of who created them",
  },
  {
    name: "user:update",
    description: "Update user profile and role assignments",
  },
  {
    name: "user:switch_to_employee",
    description: "Switch candidate portal accounts to employee mode",
  },
  {
    name: "user:delete",
    description: "Delete users",
  },
  {
    name: "user_history:read",
    description: "View user management history",
  },
]
