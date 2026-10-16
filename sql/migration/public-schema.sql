


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."blood_type_enum" AS ENUM (
    'A',
    'B',
    'AB',
    'O'
);


ALTER TYPE "public"."blood_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."education_level_enum" AS ENUM (
    'SD / Sederajat',
    'SMP / MTs / Sederajat',
    'SMA / SMK / MA / Sederajat',
    'Diploma I (D1)',
    'Diploma II (D2)',
    'Diploma III (D3)',
    'Diploma IV (D4)',
    'Sarjana (S1)',
    'Magister (S2)',
    'Doktor (S3)'
);


ALTER TYPE "public"."education_level_enum" OWNER TO "postgres";


CREATE TYPE "public"."employment_status_enum" AS ENUM (
    'Daily',
    'Probation',
    'Contract'
);


ALTER TYPE "public"."employment_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."gender_enum" AS ENUM (
    'Male',
    'Female'
);


ALTER TYPE "public"."gender_enum" OWNER TO "postgres";


CREATE TYPE "public"."language_proficiency_level" AS ENUM (
    'good',
    'fair',
    'poor'
);


ALTER TYPE "public"."language_proficiency_level" OWNER TO "postgres";


CREATE TYPE "public"."marital_status_enum" AS ENUM (
    'Single',
    'Married',
    'Divorced'
);


ALTER TYPE "public"."marital_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."position_status_enum" AS ENUM (
    'Replacement',
    'New Position MPP',
    'New Position Non-MPP',
    'Internship'
);


ALTER TYPE "public"."position_status_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approval_chain_employee_request_form_id"("approval_chain_id" "uuid") RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select ac.employee_request_form_id
  from public.approval_chains ac
  where ac.id = approval_chain_id
  limit 1;
$$;


ALTER FUNCTION "public"."approval_chain_employee_request_form_id"("approval_chain_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_approval_chain"("approval_chain_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select auth.uid() is not null
    and (
      public.has_permission('approval:tracking_all')
      or (
        public.is_manager()
        and public.employee_request_form_owner(
          public.approval_chain_employee_request_form_id(approval_chain_id)
        ) = auth.uid()
      )
      or public.is_chain_assigned_to_current_user(approval_chain_id)
    );
$$;


ALTER FUNCTION "public"."can_access_approval_chain"("approval_chain_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_access_approval_chain"("approval_chain_id" "uuid") IS 'Returns true when the current user can read an approval chain through approval:tracking_all, ERF ownership, or assigned approver email.';



CREATE OR REPLACE FUNCTION "public"."can_access_employee_request_form"("employee_request_form_created_by" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select auth.uid() is not null
    and (
      (
        public.is_manager()
        and employee_request_form_created_by = auth.uid()
      )
      or (
        not public.is_manager()
        and (
          public.has_permission('employee_request_form:read')
          or public.has_permission('recruitment:approved_erf_read')
          or public.has_permission('recruitment:pic_recruitment_read')
          or public.has_permission('approval:read')
          or public.has_permission('recruitment:read')
        )
      )
    );
$$;


ALTER FUNCTION "public"."can_access_employee_request_form"("employee_request_form_created_by" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_access_employee_request_form"("employee_request_form_created_by" "uuid") IS 'Applies dashboard ERF row access: manager is owner-scoped; non-manager follows read permissions.';



CREATE OR REPLACE FUNCTION "public"."can_write_employee_request_form"("employee_request_form_created_by" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select auth.uid() is not null
    and (
      (
        public.is_manager()
        and employee_request_form_created_by = auth.uid()
      )
      or (
        not public.is_manager()
        and (
          public.has_permission('employee_request_form:create')
          or public.has_permission('employee_request_form:update')
          or public.has_permission('employee_request_form:assign_recruiter')
          or public.has_permission('employee_request_form:delete')
          or public.has_permission('employee_request_form:close')
          or public.has_permission('recruitment:pic_recruitment_update')
        )
      )
    );
$$;


ALTER FUNCTION "public"."can_write_employee_request_form"("employee_request_form_created_by" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_write_employee_request_form"("employee_request_form_created_by" "uuid") IS 'Applies dashboard ERF write access: manager is owner-scoped; non-manager follows write permissions.';



CREATE OR REPLACE FUNCTION "public"."current_user_email"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;


ALTER FUNCTION "public"."current_user_email"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."current_user_email"() IS 'Returns the lowercase email from the current auth JWT.';



CREATE OR REPLACE FUNCTION "public"."employee_request_form_owner"("employee_request_form_id" "uuid") RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select erf.created_by
  from public.employee_request_form erf
  where erf.id = employee_request_form_id
  limit 1;
$$;


ALTER FUNCTION "public"."employee_request_form_owner"("employee_request_form_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.profiles(id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_permission"("permission_name" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp
      on rp.role_id = ur.role_id
    join public.permissions p
      on p.id = rp.permission_id
    where ur.user_id = auth.uid()
      and p.name = permission_name
  );
$$;


ALTER FUNCTION "public"."has_permission"("permission_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("role_name" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r
      on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and lower(r.name) = lower(role_name)
  );
$$;


ALTER FUNCTION "public"."has_role"("role_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."has_role"("role_name" "text") IS 'Returns true when auth.uid() is linked to the requested role name.';



CREATE OR REPLACE FUNCTION "public"."is_candidate"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select public.has_role('candidate');
$$;


ALTER FUNCTION "public"."is_candidate"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_chain_assigned_to_current_user"("approval_chain_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.approval_steps aps
    where aps.chain_id = approval_chain_id
      and lower(coalesce(aps.approver_email, '')) = public.current_user_email()
  );
$$;


ALTER FUNCTION "public"."is_chain_assigned_to_current_user"("approval_chain_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_internal_user"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select auth.uid() is not null
    and not public.is_candidate();
$$;


ALTER FUNCTION "public"."is_internal_user"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_internal_user"() IS 'Returns true for authenticated non-candidate users in the dashboard database.';



CREATE OR REPLACE FUNCTION "public"."is_manager"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select public.has_role('manager');
$$;


ALTER FUNCTION "public"."is_manager"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."approval_chains" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_request_form_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."approval_chains" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."approval_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chain_id" "uuid" NOT NULL,
    "step_order" integer NOT NULL,
    "approver_email" "text" NOT NULL,
    "approver_name" "text",
    "token" "uuid" DEFAULT "gen_random_uuid"(),
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "approved_at" timestamp without time zone,
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "approval_role_key" "text",
    "approval_role_label" "text"
);


ALTER TABLE "public"."approval_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."approver_master" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "step_order" integer DEFAULT 1 NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "profile_id" "uuid",
    "approval_flow_key" "text" NOT NULL,
    "approval_role_key" "text" NOT NULL,
    "approval_role_label" "text" NOT NULL
);


ALTER TABLE "public"."approver_master" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_contract_form" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_request_form_id" "uuid" NOT NULL,
    "candidate_id" "uuid" NOT NULL,
    "candidate_name" "text",
    "candidate_email" "text",
    "contract_number" "text" NOT NULL,
    "employee_code" "text" NOT NULL,
    "contract_start_date" "date" NOT NULL,
    "contract_end_date" "date" NOT NULL,
    "approval_user_id" "uuid",
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "employee_contract_form_contract_date_check" CHECK (("contract_end_date" >= "contract_start_date"))
);


ALTER TABLE "public"."employee_contract_form" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_request_form" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employment_status" "public"."employment_status_enum",
    "direct_manager" "text",
    "site" "text",
    "working_location" "text",
    "required_date" "date",
    "position_status" "public"."position_status_enum",
    "periode_probation" integer,
    "main_position" "text",
    "created_by" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "custom_grup_1_id" "uuid",
    "custom_grup_2_id" "uuid",
    "custom_grup_3_id" "uuid",
    "custom_grup_4_id" "uuid",
    "custom_grup_5_id" "uuid",
    "custom_grup_6_id" "uuid",
    "status" "text" DEFAULT 'open'::"text",
    "closed_date" timestamp with time zone,
    "closed_category" "text",
    "reason" "text",
    "pt_id" "uuid",
    "organizational_structure" "text"[] DEFAULT '{}'::"text"[],
    "job_description" "text"[] DEFAULT '{}'::"text"[],
    "designation_id" "uuid",
    "department_id" "uuid",
    "recruitment_flow_stage" "text",
    "updated_by" "uuid",
    "bu_id" "uuid",
    "approval_director_bu_id" "uuid",
    "recruiter_user_id" "uuid",
    CONSTRAINT "check_job_request_closed_category" CHECK ((("closed_category" = ANY (ARRAY['employee hired'::"text", 'canceled'::"text"])) OR ("closed_category" IS NULL))),
    CONSTRAINT "check_job_request_status" CHECK (("status" = ANY (ARRAY['open'::"text", 'closed'::"text"]))),
    CONSTRAINT "employee_request_form_recruitment_flow_stage_check" CHECK ((("recruitment_flow_stage" IS NULL) OR ("recruitment_flow_stage" = ANY (ARRAY['erf_requested'::"text", 'approval_in_progress'::"text", 'erf_approved'::"text", 'assign_recruiter'::"text", 'candidate_sourcing'::"text", 'assessment_list_created'::"text", 'interview_scheduled'::"text", 'interview_evaluation_in_progress'::"text", 'interview_evaluation_completed'::"text", 'candidate_selected'::"text", 'employee_contract_form_in_progress'::"text", 'hiring_completed'::"text", 'closed'::"text", 'rejected'::"text"]))))
);


ALTER TABLE "public"."employee_request_form" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."export_template_fields" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_id" "uuid" NOT NULL,
    "field_key" "text" NOT NULL,
    "field_label" "text",
    "source_type" "text" DEFAULT 'auto'::"text" NOT NULL,
    "source_path" "text",
    "field_type" "text" DEFAULT 'text'::"text" NOT NULL,
    "is_required" boolean DEFAULT false NOT NULL,
    "is_editable" boolean DEFAULT true NOT NULL,
    "default_value" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."export_template_fields" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."export_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text",
    "description" "text",
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "storage_bucket" "text" DEFAULT 'export-templates'::"text" NOT NULL,
    "detected_fields" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."export_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."generated_exports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_id" "uuid",
    "candidate_id" "uuid",
    "file_name" "text" NOT NULL,
    "file_path" "text",
    "payload" "jsonb" NOT NULL,
    "generated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."generated_exports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_evaluation_forms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_request_form_id" "uuid",
    "candidate_service_candidate_id" "uuid",
    "candidate_service_application_id" "uuid",
    "candidate_name" "text" NOT NULL,
    "applied_position" "text",
    "interviewer_name" "text" NOT NULL,
    "interview_date" "date" NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "interviewer_recipients" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "average_score" numeric(10,2),
    CONSTRAINT "interview_evaluation_forms_interviewer_recipients_is_array" CHECK (("jsonb_typeof"("interviewer_recipients") = 'array'::"text"))
);


ALTER TABLE "public"."interview_evaluation_forms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_evaluation_interviewer_scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "interview_evaluation_interviewer_id" "uuid" NOT NULL,
    "item_number" integer NOT NULL,
    "category_title" "text" NOT NULL,
    "category_description" "text" NOT NULL,
    "score" integer,
    "info" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "interview_evaluation_interviewer_scores_item_number_check" CHECK ((("item_number" >= 1) AND ("item_number" <= 10))),
    CONSTRAINT "interview_evaluation_interviewer_scores_score_check" CHECK (((("score" >= 1) AND ("score" <= 5)) OR ("score" IS NULL)))
);


ALTER TABLE "public"."interview_evaluation_interviewer_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_evaluation_interviewers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "interview_evaluation_form_id" "uuid" NOT NULL,
    "interviewer_user_id" "uuid",
    "interviewer_name" "text" NOT NULL,
    "interviewer_email" "text",
    "interviewer_job_level" "text",
    "interviewer_label" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "comments" "text",
    "recommendation" "text",
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "interview_evaluation_interviewers_label_not_blank" CHECK (("btrim"("interviewer_label") <> ''::"text")),
    CONSTRAINT "interview_evaluation_interviewers_name_not_blank" CHECK (("btrim"("interviewer_name") <> ''::"text")),
    CONSTRAINT "interview_evaluation_interviewers_recommendation_check" CHECK ((("recommendation" = ANY (ARRAY['continue_recruitment'::"text", 'find_comparison_candidate'::"text", 'stop_recruitment'::"text", 'save_as_candidate_database'::"text"])) OR ("recommendation" IS NULL)))
);


ALTER TABLE "public"."interview_evaluation_interviewers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_bu" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."master_bu" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_custom_grup_1" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."master_custom_grup_1" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_custom_grup_2" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."master_custom_grup_2" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_custom_grup_3" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."master_custom_grup_3" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_custom_grup_4" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."master_custom_grup_4" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_custom_grup_5" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."master_custom_grup_5" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_custom_grup_6" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."master_custom_grup_6" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_department" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bu_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."master_department" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_designation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "required_date_min_months" integer,
    CONSTRAINT "master_designation_required_date_min_months_check" CHECK ((("required_date_min_months" IS NULL) OR ("required_date_min_months" >= 0)))
);


ALTER TABLE "public"."master_designation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_job_level" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "required_date_min_months" integer,
    CONSTRAINT "master_job_level_required_date_min_months_check" CHECK ((("required_date_min_months" IS NULL) OR ("required_date_min_months" >= 0)))
);


ALTER TABLE "public"."master_job_level" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_pt" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "address" "text"
);


ALTER TABLE "public"."master_pt" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "phone" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "email" "text",
    "full_name" "text",
    "main_position" "text",
    "personal_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "department_id" "uuid",
    "designation_id" "uuid"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."recruitment_queue_view" WITH ("security_invoker"='true') AS
 WITH "latest_chains" AS (
         SELECT DISTINCT ON ("ac"."employee_request_form_id") "ac"."id" AS "chain_id",
            "ac"."employee_request_form_id",
            "ac"."status",
            "ac"."created_at",
            "ac"."updated_at"
           FROM "public"."approval_chains" "ac"
          ORDER BY "ac"."employee_request_form_id", "ac"."updated_at" DESC, "ac"."created_at" DESC, "ac"."id" DESC
        ), "approval_step_summary" AS (
         SELECT "aps"."chain_id",
            "max"(
                CASE
                    WHEN ("aps"."step_order" = 1) THEN "aps"."approver_name"
                    ELSE NULL::"text"
                END) AS "employee_request_form_approval_director_bu",
            "max"(
                CASE
                    WHEN (("aps"."step_order" = 1) AND ("aps"."status" = 'approved'::"text")) THEN "aps"."approved_at"
                    ELSE NULL::timestamp without time zone
                END) AS "employee_request_form_approval_director_bu_date",
            "max"(
                CASE
                    WHEN ("aps"."step_order" = 2) THEN "aps"."approver_name"
                    ELSE NULL::"text"
                END) AS "employee_request_form_approval_gm_hrd",
            "max"(
                CASE
                    WHEN (("aps"."step_order" = 2) AND ("aps"."status" = 'approved'::"text")) THEN "aps"."approved_at"
                    ELSE NULL::timestamp without time zone
                END) AS "employee_request_form_approval_gm_hrd_date",
            "max"(
                CASE
                    WHEN ("aps"."step_order" = 3) THEN "aps"."approver_name"
                    ELSE NULL::"text"
                END) AS "employee_request_form_approval_director_hrd",
            "max"(
                CASE
                    WHEN (("aps"."step_order" = 3) AND ("aps"."status" = 'approved'::"text")) THEN "aps"."approved_at"
                    ELSE NULL::timestamp without time zone
                END) AS "employee_request_form_approval_director_hrd_date"
           FROM "public"."approval_steps" "aps"
          GROUP BY "aps"."chain_id"
        )
 SELECT COALESCE("lc"."chain_id", "erf"."id") AS "id",
    "lc"."chain_id",
    "erf"."id" AS "employee_request_form_id",
    COALESCE("lc"."created_at", "erf"."created_at") AS "created_at",
    COALESCE("erf"."updated_at", "lc"."updated_at", "erf"."created_at", "lc"."created_at") AS "updated_at",
    "pt"."name" AS "employee_request_form_pt_pembebanan",
    "dept"."name" AS "employee_request_form_department",
    "lvl"."name" AS "employee_request_form_designation",
    "lvl"."name" AS "employee_request_form_job_level",
    "erf"."main_position" AS "employee_request_form_main_position",
    "erf"."site" AS "employee_request_form_site",
    "erf"."working_location" AS "employee_request_form_working_location",
    ("erf"."employment_status")::"text" AS "employee_request_form_employment_status",
    ("erf"."position_status")::"text" AS "employee_request_form_position_status",
    "erf"."required_date" AS "employee_request_form_required_date",
    "erf"."recruiter_user_id" AS "employee_request_form_recruiter_user_id",
    COALESCE("recruiter"."full_name", "recruiter"."username", "recruiter"."email") AS "employee_request_form_recruiter_name",
    "erf"."status" AS "employee_request_form_status",
    "erf"."closed_date" AS "employee_request_form_closed_date",
    "cg1"."name" AS "employee_request_form_custom_grup_1",
    "cg2"."name" AS "employee_request_form_custom_grup_2",
    "cg3"."name" AS "employee_request_form_custom_grup_3",
    "cg4"."name" AS "employee_request_form_custom_grup_4",
    "cg5"."name" AS "employee_request_form_custom_grup_5",
    "cg6"."name" AS "employee_request_form_custom_grup_6",
    "ass"."employee_request_form_approval_director_bu",
    "ass"."employee_request_form_approval_director_bu_date",
    "ass"."employee_request_form_approval_gm_hrd",
    "ass"."employee_request_form_approval_gm_hrd_date",
    "ass"."employee_request_form_approval_director_hrd",
    "ass"."employee_request_form_approval_director_hrd_date"
   FROM (((((((((((("public"."employee_request_form" "erf"
     LEFT JOIN "latest_chains" "lc" ON (("lc"."employee_request_form_id" = "erf"."id")))
     LEFT JOIN "approval_step_summary" "ass" ON (("ass"."chain_id" = "lc"."chain_id")))
     LEFT JOIN "public"."master_pt" "pt" ON (("pt"."id" = "erf"."pt_id")))
     LEFT JOIN "public"."master_department" "dept" ON (("dept"."id" = "erf"."department_id")))
     LEFT JOIN "public"."master_job_level" "lvl" ON (("lvl"."id" = "erf"."designation_id")))
     LEFT JOIN "public"."profiles" "recruiter" ON (("recruiter"."id" = "erf"."recruiter_user_id")))
     LEFT JOIN "public"."master_custom_grup_1" "cg1" ON (("cg1"."id" = "erf"."custom_grup_1_id")))
     LEFT JOIN "public"."master_custom_grup_2" "cg2" ON (("cg2"."id" = "erf"."custom_grup_2_id")))
     LEFT JOIN "public"."master_custom_grup_3" "cg3" ON (("cg3"."id" = "erf"."custom_grup_3_id")))
     LEFT JOIN "public"."master_custom_grup_4" "cg4" ON (("cg4"."id" = "erf"."custom_grup_4_id")))
     LEFT JOIN "public"."master_custom_grup_5" "cg5" ON (("cg5"."id" = "erf"."custom_grup_5_id")))
     LEFT JOIN "public"."master_custom_grup_6" "cg6" ON (("cg6"."id" = "erf"."custom_grup_6_id")));


ALTER VIEW "public"."recruitment_queue_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "role_id" "uuid" NOT NULL,
    "permission_id" "uuid" NOT NULL
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "assigned_at" timestamp without time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."approval_chains"
    ADD CONSTRAINT "approval_chains_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."approval_steps"
    ADD CONSTRAINT "approval_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."approver_master"
    ADD CONSTRAINT "approver_master_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_contract_form"
    ADD CONSTRAINT "employee_contract_form_candidate_key" UNIQUE ("employee_request_form_id", "candidate_id");



ALTER TABLE ONLY "public"."employee_contract_form"
    ADD CONSTRAINT "employee_contract_form_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."export_template_fields"
    ADD CONSTRAINT "export_template_fields_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."export_templates"
    ADD CONSTRAINT "export_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generated_exports"
    ADD CONSTRAINT "generated_exports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_evaluation_forms"
    ADD CONSTRAINT "interview_evaluation_forms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_evaluation_interviewer_scores"
    ADD CONSTRAINT "interview_evaluation_interviewer_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_evaluation_interviewer_scores"
    ADD CONSTRAINT "interview_evaluation_interviewer_scores_unique_item" UNIQUE ("interview_evaluation_interviewer_id", "item_number");



ALTER TABLE ONLY "public"."interview_evaluation_interviewers"
    ADD CONSTRAINT "interview_evaluation_interviewers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_bu"
    ADD CONSTRAINT "master_bu_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."master_bu"
    ADD CONSTRAINT "master_bu_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_custom_grup_1"
    ADD CONSTRAINT "master_custom_grup_1_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_custom_grup_2"
    ADD CONSTRAINT "master_custom_grup_2_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_custom_grup_3"
    ADD CONSTRAINT "master_custom_grup_3_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_custom_grup_4"
    ADD CONSTRAINT "master_custom_grup_4_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_custom_grup_5"
    ADD CONSTRAINT "master_custom_grup_5_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_custom_grup_6"
    ADD CONSTRAINT "master_custom_grup_6_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_department"
    ADD CONSTRAINT "master_department_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_designation"
    ADD CONSTRAINT "master_designation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_job_level"
    ADD CONSTRAINT "master_job_level_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."master_job_level"
    ADD CONSTRAINT "master_job_level_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_pt"
    ADD CONSTRAINT "master_pt_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."master_pt"
    ADD CONSTRAINT "master_pt_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_request_form"
    ADD CONSTRAINT "new_employee_application_form_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id");



CREATE INDEX "approval_chains_job_request_id_idx" ON "public"."approval_chains" USING "btree" ("employee_request_form_id");



CREATE UNIQUE INDEX "approval_chains_one_active_per_job_request_uidx" ON "public"."approval_chains" USING "btree" ("employee_request_form_id") WHERE ("status" = ANY (ARRAY['draft'::"text", 'pending'::"text"]));



CREATE INDEX "approval_steps_chain_id_idx" ON "public"."approval_steps" USING "btree" ("chain_id");



CREATE UNIQUE INDEX "approval_steps_chain_id_step_order_uidx" ON "public"."approval_steps" USING "btree" ("chain_id", "step_order");



CREATE INDEX "approval_steps_token_idx" ON "public"."approval_steps" USING "btree" ("token");



CREATE INDEX "employee_request_form_pt_id_idx" ON "public"."employee_request_form" USING "btree" ("pt_id");



CREATE INDEX "idx_approval_chain_erf_status" ON "public"."approval_chains" USING "btree" ("employee_request_form_id", "status");



CREATE INDEX "idx_approval_chains_created_at" ON "public"."approval_chains" USING "btree" ("created_at");



CREATE INDEX "idx_approval_chains_created_by" ON "public"."approval_chains" USING "btree" ("created_by");



CREATE INDEX "idx_approval_chains_erf_id" ON "public"."approval_chains" USING "btree" ("employee_request_form_id");



CREATE INDEX "idx_approval_chains_job_request_id" ON "public"."approval_chains" USING "btree" ("employee_request_form_id");



CREATE INDEX "idx_approval_steps_approver_email" ON "public"."approval_steps" USING "btree" ("approver_email");



CREATE INDEX "idx_approval_steps_chain_order" ON "public"."approval_steps" USING "btree" ("chain_id", "step_order");



CREATE INDEX "idx_approval_steps_email" ON "public"."approval_steps" USING "btree" ("approver_email");



CREATE INDEX "idx_approval_steps_status" ON "public"."approval_steps" USING "btree" ("status");



CREATE UNIQUE INDEX "idx_approval_steps_token" ON "public"."approval_steps" USING "btree" ("token");



CREATE INDEX "idx_approver_master_created_by" ON "public"."approver_master" USING "btree" ("created_by");



CREATE INDEX "idx_approver_master_employee_id" ON "public"."approver_master" USING "btree" ("profile_id");



CREATE UNIQUE INDEX "idx_approver_master_flow_role_unique" ON "public"."approver_master" USING "btree" ("approval_flow_key", "approval_role_key");



CREATE UNIQUE INDEX "idx_approver_master_flow_step_unique" ON "public"."approver_master" USING "btree" ("approval_flow_key", "step_order");



CREATE INDEX "idx_employee_contract_form_approval_user_id" ON "public"."employee_contract_form" USING "btree" ("approval_user_id");



CREATE INDEX "idx_employee_contract_form_candidate_id" ON "public"."employee_contract_form" USING "btree" ("candidate_id");



CREATE INDEX "idx_employee_contract_form_employee_request_form_id" ON "public"."employee_contract_form" USING "btree" ("employee_request_form_id");



CREATE INDEX "idx_employee_request_form_bu_id" ON "public"."employee_request_form" USING "btree" ("bu_id");



CREATE INDEX "idx_employee_request_form_designation_id" ON "public"."employee_request_form" USING "btree" ("designation_id");



CREATE INDEX "idx_employee_request_form_approval_director_bu_id" ON "public"."employee_request_form" USING "btree" ("approval_director_bu_id");



CREATE INDEX "idx_employee_request_form_recruiter_user_id" ON "public"."employee_request_form" USING "btree" ("recruiter_user_id");



CREATE INDEX "idx_employees_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_erf_created_at" ON "public"."employee_request_form" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_erf_created_by" ON "public"."employee_request_form" USING "btree" ("created_by");



CREATE INDEX "idx_erf_pt_id" ON "public"."employee_request_form" USING "btree" ("pt_id");



CREATE INDEX "idx_erf_required_date" ON "public"."employee_request_form" USING "btree" ("required_date");



CREATE INDEX "idx_erf_status" ON "public"."employee_request_form" USING "btree" ("status");



CREATE INDEX "idx_erf_status_created_at" ON "public"."employee_request_form" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_export_template_fields_template_id" ON "public"."export_template_fields" USING "btree" ("template_id");



CREATE INDEX "idx_generated_exports_candidate_id" ON "public"."generated_exports" USING "btree" ("candidate_id");



CREATE INDEX "idx_generated_exports_template_id" ON "public"."generated_exports" USING "btree" ("template_id");



CREATE INDEX "idx_interview_evaluation_forms_candidate_service_candidate_id" ON "public"."interview_evaluation_forms" USING "btree" ("candidate_service_candidate_id");



CREATE INDEX "idx_interview_evaluation_forms_employee_request_form_id" ON "public"."interview_evaluation_forms" USING "btree" ("employee_request_form_id");



CREATE INDEX "idx_interview_evaluation_forms_interview_date_created_at_desc" ON "public"."interview_evaluation_forms" USING "btree" ("interview_date" DESC, "created_at" DESC);



CREATE INDEX "idx_interview_evaluation_interviewer_scores_interviewer_id" ON "public"."interview_evaluation_interviewer_scores" USING "btree" ("interview_evaluation_interviewer_id");



CREATE INDEX "idx_interview_evaluation_interviewers_form_id" ON "public"."interview_evaluation_interviewers" USING "btree" ("interview_evaluation_form_id");



CREATE UNIQUE INDEX "idx_interview_evaluation_interviewers_form_label_unique" ON "public"."interview_evaluation_interviewers" USING "btree" ("interview_evaluation_form_id", "interviewer_label");



CREATE INDEX "idx_interview_evaluation_interviewers_user_id" ON "public"."interview_evaluation_interviewers" USING "btree" ("interviewer_user_id");



CREATE INDEX "idx_master_department_name" ON "public"."master_department" USING "btree" ("name");



CREATE INDEX "idx_master_designation_name" ON "public"."master_designation" USING "btree" ("name");



CREATE INDEX "idx_new_employee_application_form_closed_date" ON "public"."employee_request_form" USING "btree" ("closed_date");



CREATE INDEX "idx_new_employee_application_form_created_at" ON "public"."employee_request_form" USING "btree" ("created_at");



CREATE INDEX "idx_new_employee_application_form_created_by" ON "public"."employee_request_form" USING "btree" ("created_by");



CREATE INDEX "idx_new_employee_application_form_custom_grup_1_id" ON "public"."employee_request_form" USING "btree" ("custom_grup_1_id");



CREATE INDEX "idx_new_employee_application_form_custom_grup_2_id" ON "public"."employee_request_form" USING "btree" ("custom_grup_2_id");



CREATE INDEX "idx_new_employee_application_form_custom_grup_3_id" ON "public"."employee_request_form" USING "btree" ("custom_grup_3_id");



CREATE INDEX "idx_new_employee_application_form_custom_grup_4_id" ON "public"."employee_request_form" USING "btree" ("custom_grup_4_id");



CREATE INDEX "idx_new_employee_application_form_custom_grup_5_id" ON "public"."employee_request_form" USING "btree" ("custom_grup_5_id");



CREATE INDEX "idx_new_employee_application_form_custom_grup_6_id" ON "public"."employee_request_form" USING "btree" ("custom_grup_6_id");



CREATE INDEX "idx_new_employee_application_form_main_position" ON "public"."employee_request_form" USING "btree" ("main_position");



CREATE INDEX "idx_new_employee_application_form_required_date" ON "public"."employee_request_form" USING "btree" ("required_date");



CREATE INDEX "idx_new_employee_application_form_status" ON "public"."employee_request_form" USING "btree" ("status");



CREATE INDEX "idx_new_employee_application_form_updated_at" ON "public"."employee_request_form" USING "btree" ("updated_at");



CREATE INDEX "idx_profiles_designation_id" ON "public"."profiles" USING "btree" ("designation_id");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_role_permissions_permission_id" ON "public"."role_permissions" USING "btree" ("permission_id");



CREATE INDEX "idx_role_permissions_role_id" ON "public"."role_permissions" USING "btree" ("role_id");



CREATE INDEX "idx_roles_updated_at" ON "public"."roles" USING "btree" ("updated_at");



CREATE INDEX "idx_user_roles_assigned_at" ON "public"."user_roles" USING "btree" ("assigned_at");



CREATE INDEX "idx_user_roles_role_id" ON "public"."user_roles" USING "btree" ("role_id");



CREATE INDEX "idx_user_roles_user_id" ON "public"."user_roles" USING "btree" ("user_id");



CREATE UNIQUE INDEX "uq_export_template_fields_template_id_field_key" ON "public"."export_template_fields" USING "btree" ("template_id", "field_key");



CREATE OR REPLACE TRIGGER "trg_set_updated_at__employee_contract_form" BEFORE UPDATE ON "public"."employee_contract_form" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at__export_templates" BEFORE UPDATE ON "public"."export_templates" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at__interview_evaluation_forms" BEFORE UPDATE ON "public"."interview_evaluation_forms" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at__interview_evaluation_interviewer_scores" BEFORE UPDATE ON "public"."interview_evaluation_interviewer_scores" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at__interview_evaluation_interviewers" BEFORE UPDATE ON "public"."interview_evaluation_interviewers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."approval_chains"
    ADD CONSTRAINT "approval_chains_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."approval_chains"
    ADD CONSTRAINT "approval_chains_employee_request_form_id_fkey" FOREIGN KEY ("employee_request_form_id") REFERENCES "public"."employee_request_form"("id");



ALTER TABLE ONLY "public"."approval_steps"
    ADD CONSTRAINT "approval_steps_chain_id_fkey" FOREIGN KEY ("chain_id") REFERENCES "public"."approval_chains"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."approver_master"
    ADD CONSTRAINT "approver_master_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."approver_master"
    ADD CONSTRAINT "approver_master_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."employee_contract_form"
    ADD CONSTRAINT "employee_contract_form_approval_user_id_fkey" FOREIGN KEY ("approval_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employee_contract_form"
    ADD CONSTRAINT "employee_contract_form_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employee_contract_form"
    ADD CONSTRAINT "employee_contract_form_employee_request_form_id_fkey" FOREIGN KEY ("employee_request_form_id") REFERENCES "public"."employee_request_form"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."employee_contract_form"
    ADD CONSTRAINT "employee_contract_form_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employee_request_form"
    ADD CONSTRAINT "employee_request_form_approval_director_bu_id_fkey" FOREIGN KEY ("approval_director_bu_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employee_request_form"
    ADD CONSTRAINT "employee_request_form_bu_id_fkey" FOREIGN KEY ("bu_id") REFERENCES "public"."master_bu"("id");



ALTER TABLE ONLY "public"."employee_request_form"
    ADD CONSTRAINT "employee_request_form_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."master_department"("id");



ALTER TABLE ONLY "public"."employee_request_form"
    ADD CONSTRAINT "employee_request_form_designation_id_fkey" FOREIGN KEY ("designation_id") REFERENCES "public"."master_job_level"("id");



ALTER TABLE ONLY "public"."employee_request_form"
    ADD CONSTRAINT "employee_request_form_pt_id_fkey" FOREIGN KEY ("pt_id") REFERENCES "public"."master_pt"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employee_request_form"
    ADD CONSTRAINT "employee_request_form_recruiter_user_id_fkey" FOREIGN KEY ("recruiter_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employee_request_form"
    ADD CONSTRAINT "employee_request_form_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."export_template_fields"
    ADD CONSTRAINT "export_template_fields_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."export_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generated_exports"
    ADD CONSTRAINT "generated_exports_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."export_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."interview_evaluation_forms"
    ADD CONSTRAINT "interview_evaluation_forms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."interview_evaluation_forms"
    ADD CONSTRAINT "interview_evaluation_forms_employee_request_form_id_fkey" FOREIGN KEY ("employee_request_form_id") REFERENCES "public"."employee_request_form"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."interview_evaluation_forms"
    ADD CONSTRAINT "interview_evaluation_forms_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."interview_evaluation_interviewers"
    ADD CONSTRAINT "interview_evaluation_intervie_interview_evaluation_form_id_fkey" FOREIGN KEY ("interview_evaluation_form_id") REFERENCES "public"."interview_evaluation_forms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_evaluation_interviewer_scores"
    ADD CONSTRAINT "interview_evaluation_intervie_interview_evaluation_intervi_fkey" FOREIGN KEY ("interview_evaluation_interviewer_id") REFERENCES "public"."interview_evaluation_interviewers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_evaluation_interviewer_scores"
    ADD CONSTRAINT "interview_evaluation_interviewer_scores_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."interview_evaluation_interviewer_scores"
    ADD CONSTRAINT "interview_evaluation_interviewer_scores_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."interview_evaluation_interviewers"
    ADD CONSTRAINT "interview_evaluation_interviewers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."interview_evaluation_interviewers"
    ADD CONSTRAINT "interview_evaluation_interviewers_interviewer_user_id_fkey" FOREIGN KEY ("interviewer_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."interview_evaluation_interviewers"
    ADD CONSTRAINT "interview_evaluation_interviewers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employee_request_form"
    ADD CONSTRAINT "new_employee_application_form_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."employee_request_form"
    ADD CONSTRAINT "new_employee_application_form_custom_grup_1_id_fkey" FOREIGN KEY ("custom_grup_1_id") REFERENCES "public"."master_custom_grup_1"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employee_request_form"
    ADD CONSTRAINT "new_employee_application_form_custom_grup_2_id_fkey" FOREIGN KEY ("custom_grup_2_id") REFERENCES "public"."master_custom_grup_2"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employee_request_form"
    ADD CONSTRAINT "new_employee_application_form_custom_grup_3_id_fkey" FOREIGN KEY ("custom_grup_3_id") REFERENCES "public"."master_custom_grup_3"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employee_request_form"
    ADD CONSTRAINT "new_employee_application_form_custom_grup_4_id_fkey" FOREIGN KEY ("custom_grup_4_id") REFERENCES "public"."master_custom_grup_4"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employee_request_form"
    ADD CONSTRAINT "new_employee_application_form_custom_grup_5_id_fkey" FOREIGN KEY ("custom_grup_5_id") REFERENCES "public"."master_custom_grup_5"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employee_request_form"
    ADD CONSTRAINT "new_employee_application_form_custom_grup_6_id_fkey" FOREIGN KEY ("custom_grup_6_id") REFERENCES "public"."master_custom_grup_6"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."master_department"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_designation_id_fkey" FOREIGN KEY ("designation_id") REFERENCES "public"."master_job_level"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."approval_chains" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "approval_chains_delete_scoped" ON "public"."approval_chains" FOR DELETE TO "authenticated" USING ("public"."can_write_employee_request_form"("public"."employee_request_form_owner"("employee_request_form_id")));



CREATE POLICY "approval_chains_insert_scoped" ON "public"."approval_chains" FOR INSERT TO "authenticated" WITH CHECK ((("public"."is_manager"() AND ("public"."employee_request_form_owner"("employee_request_form_id") = "auth"."uid"())) OR ((NOT "public"."is_manager"()) AND ("public"."has_permission"('employee_request_form:create'::"text") OR "public"."has_permission"('employee_request_form:update'::"text") OR "public"."has_permission"('employee_request_form:delete'::"text") OR "public"."has_permission"('employee_request_form:close'::"text")))));



CREATE POLICY "approval_chains_select_scoped" ON "public"."approval_chains" FOR SELECT TO "authenticated" USING ("public"."can_access_approval_chain"("id"));



CREATE POLICY "approval_chains_update_scoped" ON "public"."approval_chains" FOR UPDATE TO "authenticated" USING ((("public"."has_permission"('approval:action'::"text") AND "public"."is_chain_assigned_to_current_user"("id")) OR "public"."can_write_employee_request_form"("public"."employee_request_form_owner"("employee_request_form_id")))) WITH CHECK ((("public"."has_permission"('approval:action'::"text") AND "public"."is_chain_assigned_to_current_user"("id")) OR "public"."can_access_employee_request_form"("public"."employee_request_form_owner"("employee_request_form_id"))));



ALTER TABLE "public"."approval_steps" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "approval_steps_delete_scoped" ON "public"."approval_steps" FOR DELETE TO "authenticated" USING ("public"."can_write_employee_request_form"("public"."employee_request_form_owner"("public"."approval_chain_employee_request_form_id"("chain_id"))));



CREATE POLICY "approval_steps_insert_scoped" ON "public"."approval_steps" FOR INSERT TO "authenticated" WITH CHECK ("public"."can_write_employee_request_form"("public"."employee_request_form_owner"("public"."approval_chain_employee_request_form_id"("chain_id"))));



CREATE POLICY "approval_steps_select_scoped" ON "public"."approval_steps" FOR SELECT TO "authenticated" USING ("public"."can_access_approval_chain"("chain_id"));



CREATE POLICY "approval_steps_update_scoped" ON "public"."approval_steps" FOR UPDATE TO "authenticated" USING (("public"."has_permission"('approval:action'::"text") AND ("lower"(COALESCE("approver_email", ''::"text")) = "public"."current_user_email"()))) WITH CHECK (("public"."has_permission"('approval:action'::"text") AND ("lower"(COALESCE("approver_email", ''::"text")) = "public"."current_user_email"())));



ALTER TABLE "public"."approver_master" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "approver_master_select_internal" ON "public"."approver_master" FOR SELECT TO "authenticated" USING ("public"."is_internal_user"());



CREATE POLICY "approver_master_write_approval_read" ON "public"."approver_master" TO "authenticated" USING ("public"."has_permission"('approval:read'::"text")) WITH CHECK ("public"."has_permission"('approval:read'::"text"));



ALTER TABLE "public"."employee_contract_form" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "employee_contract_form_delete" ON "public"."employee_contract_form" FOR DELETE TO "authenticated" USING ("public"."has_permission"('employee_form:delete'::"text"));



CREATE POLICY "employee_contract_form_insert" ON "public"."employee_contract_form" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_permission"('employee_form:create'::"text"));



CREATE POLICY "employee_contract_form_select" ON "public"."employee_contract_form" FOR SELECT TO "authenticated" USING ("public"."has_permission"('employee_form:read'::"text"));



CREATE POLICY "employee_contract_form_update" ON "public"."employee_contract_form" FOR UPDATE TO "authenticated" USING ("public"."has_permission"('employee_form:update'::"text")) WITH CHECK ("public"."has_permission"('employee_form:update'::"text"));



ALTER TABLE "public"."employee_request_form" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "employee_request_form_delete_scoped" ON "public"."employee_request_form" FOR DELETE TO "authenticated" USING ("public"."can_write_employee_request_form"("created_by"));



CREATE POLICY "employee_request_form_insert_scoped" ON "public"."employee_request_form" FOR INSERT TO "authenticated" WITH CHECK ("public"."can_write_employee_request_form"("created_by"));



CREATE POLICY "employee_request_form_select_scoped" ON "public"."employee_request_form" FOR SELECT TO "authenticated" USING ("public"."can_access_employee_request_form"("created_by"));



CREATE POLICY "employee_request_form_update_scoped" ON "public"."employee_request_form" FOR UPDATE TO "authenticated" USING ("public"."can_write_employee_request_form"("created_by")) WITH CHECK ("public"."can_write_employee_request_form"("created_by"));



ALTER TABLE "public"."export_template_fields" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."export_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."generated_exports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interview_evaluation_forms" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "interview_evaluation_forms_delete" ON "public"."interview_evaluation_forms" FOR DELETE TO "authenticated" USING ("public"."has_permission"('interview_evaluation:delete'::"text"));



CREATE POLICY "interview_evaluation_forms_insert" ON "public"."interview_evaluation_forms" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_permission"('interview_evaluation:create'::"text"));



CREATE POLICY "interview_evaluation_forms_select" ON "public"."interview_evaluation_forms" FOR SELECT TO "authenticated" USING ("public"."has_permission"('interview_evaluation:read'::"text"));



CREATE POLICY "interview_evaluation_forms_update" ON "public"."interview_evaluation_forms" FOR UPDATE TO "authenticated" USING ("public"."has_permission"('interview_evaluation:update'::"text")) WITH CHECK ("public"."has_permission"('interview_evaluation:update'::"text"));



ALTER TABLE "public"."interview_evaluation_interviewer_scores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "interview_evaluation_interviewer_scores_delete" ON "public"."interview_evaluation_interviewer_scores" FOR DELETE TO "authenticated" USING (("public"."has_permission"('interview_evaluation:delete'::"text") OR "public"."has_permission"('interview_evaluation:update'::"text") OR "public"."has_permission"('interview_evaluation:interviewer_form'::"text")));



CREATE POLICY "interview_evaluation_interviewer_scores_insert" ON "public"."interview_evaluation_interviewer_scores" FOR INSERT TO "authenticated" WITH CHECK (("public"."has_permission"('interview_evaluation:create'::"text") OR "public"."has_permission"('interview_evaluation:update'::"text") OR "public"."has_permission"('interview_evaluation:interviewer_form'::"text")));



CREATE POLICY "interview_evaluation_interviewer_scores_select" ON "public"."interview_evaluation_interviewer_scores" FOR SELECT TO "authenticated" USING (("public"."has_permission"('interview_evaluation:read'::"text") OR "public"."has_permission"('interview_evaluation:interviewer_form'::"text") OR "public"."has_permission"('interview_evaluation:update'::"text")));



CREATE POLICY "interview_evaluation_interviewer_scores_update" ON "public"."interview_evaluation_interviewer_scores" FOR UPDATE TO "authenticated" USING (("public"."has_permission"('interview_evaluation:update'::"text") OR "public"."has_permission"('interview_evaluation:interviewer_form'::"text"))) WITH CHECK (("public"."has_permission"('interview_evaluation:update'::"text") OR "public"."has_permission"('interview_evaluation:interviewer_form'::"text")));



ALTER TABLE "public"."interview_evaluation_interviewers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "interview_evaluation_interviewers_delete" ON "public"."interview_evaluation_interviewers" FOR DELETE TO "authenticated" USING ("public"."has_permission"('interview_evaluation:delete'::"text"));



CREATE POLICY "interview_evaluation_interviewers_insert" ON "public"."interview_evaluation_interviewers" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_permission"('interview_evaluation:create'::"text"));



CREATE POLICY "interview_evaluation_interviewers_select" ON "public"."interview_evaluation_interviewers" FOR SELECT TO "authenticated" USING (("public"."has_permission"('interview_evaluation:read'::"text") OR "public"."has_permission"('interview_evaluation:interviewer_form'::"text") OR "public"."has_permission"('interview_evaluation:update'::"text")));



CREATE POLICY "interview_evaluation_interviewers_update" ON "public"."interview_evaluation_interviewers" FOR UPDATE TO "authenticated" USING ("public"."has_permission"('interview_evaluation:update'::"text")) WITH CHECK ("public"."has_permission"('interview_evaluation:update'::"text"));



ALTER TABLE "public"."master_bu" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "master_bu_select_authenticated" ON "public"."master_bu" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "master_bu_write_managed" ON "public"."master_bu" TO "authenticated" USING (("public"."has_permission"('user:read'::"text") OR "public"."has_permission"('role:manage'::"text"))) WITH CHECK (("public"."has_permission"('user:read'::"text") OR "public"."has_permission"('role:manage'::"text")));



ALTER TABLE "public"."master_custom_grup_1" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "master_custom_grup_1_select_authenticated" ON "public"."master_custom_grup_1" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "master_custom_grup_1_write_managed" ON "public"."master_custom_grup_1" TO "authenticated" USING (("public"."has_permission"('user:read'::"text") OR "public"."has_permission"('role:manage'::"text"))) WITH CHECK (("public"."has_permission"('user:read'::"text") OR "public"."has_permission"('role:manage'::"text")));



ALTER TABLE "public"."master_custom_grup_2" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "master_custom_grup_2_select_authenticated" ON "public"."master_custom_grup_2" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "master_custom_grup_2_write_managed" ON "public"."master_custom_grup_2" TO "authenticated" USING (("public"."has_permission"('user:read'::"text") OR "public"."has_permission"('role:manage'::"text"))) WITH CHECK (("public"."has_permission"('user:read'::"text") OR "public"."has_permission"('role:manage'::"text")));



ALTER TABLE "public"."master_custom_grup_3" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "master_custom_grup_3_select_authenticated" ON "public"."master_custom_grup_3" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "master_custom_grup_3_write_managed" ON "public"."master_custom_grup_3" TO "authenticated" USING (("public"."has_permission"('user:read'::"text") OR "public"."has_permission"('role:manage'::"text"))) WITH CHECK (("public"."has_permission"('user:read'::"text") OR "public"."has_permission"('role:manage'::"text")));



ALTER TABLE "public"."master_custom_grup_4" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "master_custom_grup_4_select_authenticated" ON "public"."master_custom_grup_4" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "master_custom_grup_4_write_managed" ON "public"."master_custom_grup_4" TO "authenticated" USING (("public"."has_permission"('user:read'::"text") OR "public"."has_permission"('role:manage'::"text"))) WITH CHECK (("public"."has_permission"('user:read'::"text") OR "public"."has_permission"('role:manage'::"text")));



ALTER TABLE "public"."master_custom_grup_5" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "master_custom_grup_5_select_authenticated" ON "public"."master_custom_grup_5" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "master_custom_grup_5_write_managed" ON "public"."master_custom_grup_5" TO "authenticated" USING (("public"."has_permission"('user:read'::"text") OR "public"."has_permission"('role:manage'::"text"))) WITH CHECK (("public"."has_permission"('user:read'::"text") OR "public"."has_permission"('role:manage'::"text")));



ALTER TABLE "public"."master_custom_grup_6" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "master_custom_grup_6_select_authenticated" ON "public"."master_custom_grup_6" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "master_custom_grup_6_write_managed" ON "public"."master_custom_grup_6" TO "authenticated" USING (("public"."has_permission"('user:read'::"text") OR "public"."has_permission"('role:manage'::"text"))) WITH CHECK (("public"."has_permission"('user:read'::"text") OR "public"."has_permission"('role:manage'::"text")));



ALTER TABLE "public"."master_department" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "master_department_select_authenticated" ON "public"."master_department" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "master_department_write_managed" ON "public"."master_department" TO "authenticated" USING (("public"."has_permission"('user:read'::"text") OR "public"."has_permission"('role:manage'::"text"))) WITH CHECK (("public"."has_permission"('user:read'::"text") OR "public"."has_permission"('role:manage'::"text")));



ALTER TABLE "public"."master_designation" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "master_designation_select_authenticated" ON "public"."master_designation" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "master_designation_write_managed" ON "public"."master_designation" TO "authenticated" USING (("public"."has_permission"('user:read'::"text") OR "public"."has_permission"('role:manage'::"text"))) WITH CHECK (("public"."has_permission"('user:read'::"text") OR "public"."has_permission"('role:manage'::"text")));



ALTER TABLE "public"."master_job_level" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "master_job_level_select_authenticated" ON "public"."master_job_level" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "master_job_level_write_managed" ON "public"."master_job_level" TO "authenticated" USING (("public"."has_permission"('user:read'::"text") OR "public"."has_permission"('role:manage'::"text"))) WITH CHECK (("public"."has_permission"('user:read'::"text") OR "public"."has_permission"('role:manage'::"text")));



ALTER TABLE "public"."master_pt" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "master_pt_select_authenticated" ON "public"."master_pt" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "master_pt_write_managed" ON "public"."master_pt" TO "authenticated" USING (("public"."has_permission"('user:read'::"text") OR "public"."has_permission"('role:manage'::"text"))) WITH CHECK (("public"."has_permission"('user:read'::"text") OR "public"."has_permission"('role:manage'::"text")));



ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "permissions_select_authenticated" ON "public"."permissions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "permissions_write_role_manage" ON "public"."permissions" TO "authenticated" USING ("public"."has_permission"('role:manage'::"text")) WITH CHECK ("public"."has_permission"('role:manage'::"text"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select_self_or_internal" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."is_internal_user"()));



CREATE POLICY "profiles_update_self_or_user_update" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."has_permission"('user:update'::"text"))) WITH CHECK ((("id" = "auth"."uid"()) OR "public"."has_permission"('user:update'::"text")));



ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "role_permissions_select_authenticated" ON "public"."role_permissions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "role_permissions_write_role_manage" ON "public"."role_permissions" TO "authenticated" USING ("public"."has_permission"('role:manage'::"text")) WITH CHECK ("public"."has_permission"('role:manage'::"text"));



ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "roles_select_authenticated" ON "public"."roles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "roles_write_role_manage" ON "public"."roles" TO "authenticated" USING ("public"."has_permission"('role:manage'::"text")) WITH CHECK ("public"."has_permission"('role:manage'::"text"));



ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_roles_select_scoped" ON "public"."user_roles" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."has_permission"('role:manage'::"text") OR "public"."has_permission"('user:read'::"text")));



CREATE POLICY "user_roles_write_managed" ON "public"."user_roles" TO "authenticated" USING (("public"."has_permission"('role:manage'::"text") OR "public"."has_permission"('user:update'::"text"))) WITH CHECK (("public"."has_permission"('role:manage'::"text") OR "public"."has_permission"('user:update'::"text")));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."approval_chain_employee_request_form_id"("approval_chain_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."approval_chain_employee_request_form_id"("approval_chain_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approval_chain_employee_request_form_id"("approval_chain_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_approval_chain"("approval_chain_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_approval_chain"("approval_chain_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_approval_chain"("approval_chain_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_employee_request_form"("employee_request_form_created_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_employee_request_form"("employee_request_form_created_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_employee_request_form"("employee_request_form_created_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_write_employee_request_form"("employee_request_form_created_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_write_employee_request_form"("employee_request_form_created_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_write_employee_request_form"("employee_request_form_created_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."employee_request_form_owner"("employee_request_form_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."employee_request_form_owner"("employee_request_form_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."employee_request_form_owner"("employee_request_form_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."has_permission"("permission_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_permission"("permission_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_permission"("permission_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_permission"("permission_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("role_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("role_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("role_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_candidate"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_candidate"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_candidate"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_chain_assigned_to_current_user"("approval_chain_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_chain_assigned_to_current_user"("approval_chain_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_chain_assigned_to_current_user"("approval_chain_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_internal_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_internal_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_internal_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_manager"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_manager"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_manager"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."approval_chains" TO "anon";
GRANT ALL ON TABLE "public"."approval_chains" TO "authenticated";
GRANT ALL ON TABLE "public"."approval_chains" TO "service_role";



GRANT ALL ON TABLE "public"."approval_steps" TO "anon";
GRANT ALL ON TABLE "public"."approval_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."approval_steps" TO "service_role";



GRANT ALL ON TABLE "public"."approver_master" TO "anon";
GRANT ALL ON TABLE "public"."approver_master" TO "authenticated";
GRANT ALL ON TABLE "public"."approver_master" TO "service_role";



GRANT ALL ON TABLE "public"."employee_contract_form" TO "anon";
GRANT ALL ON TABLE "public"."employee_contract_form" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_contract_form" TO "service_role";



GRANT ALL ON TABLE "public"."employee_request_form" TO "anon";
GRANT ALL ON TABLE "public"."employee_request_form" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_request_form" TO "service_role";



GRANT ALL ON TABLE "public"."export_template_fields" TO "anon";
GRANT ALL ON TABLE "public"."export_template_fields" TO "authenticated";
GRANT ALL ON TABLE "public"."export_template_fields" TO "service_role";



GRANT ALL ON TABLE "public"."export_templates" TO "anon";
GRANT ALL ON TABLE "public"."export_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."export_templates" TO "service_role";



GRANT ALL ON TABLE "public"."generated_exports" TO "anon";
GRANT ALL ON TABLE "public"."generated_exports" TO "authenticated";
GRANT ALL ON TABLE "public"."generated_exports" TO "service_role";



GRANT ALL ON TABLE "public"."interview_evaluation_forms" TO "anon";
GRANT ALL ON TABLE "public"."interview_evaluation_forms" TO "authenticated";
GRANT ALL ON TABLE "public"."interview_evaluation_forms" TO "service_role";



GRANT ALL ON TABLE "public"."interview_evaluation_interviewer_scores" TO "anon";
GRANT ALL ON TABLE "public"."interview_evaluation_interviewer_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."interview_evaluation_interviewer_scores" TO "service_role";



GRANT ALL ON TABLE "public"."interview_evaluation_interviewers" TO "anon";
GRANT ALL ON TABLE "public"."interview_evaluation_interviewers" TO "authenticated";
GRANT ALL ON TABLE "public"."interview_evaluation_interviewers" TO "service_role";



GRANT ALL ON TABLE "public"."master_bu" TO "anon";
GRANT ALL ON TABLE "public"."master_bu" TO "authenticated";
GRANT ALL ON TABLE "public"."master_bu" TO "service_role";



GRANT ALL ON TABLE "public"."master_custom_grup_1" TO "anon";
GRANT ALL ON TABLE "public"."master_custom_grup_1" TO "authenticated";
GRANT ALL ON TABLE "public"."master_custom_grup_1" TO "service_role";



GRANT ALL ON TABLE "public"."master_custom_grup_2" TO "anon";
GRANT ALL ON TABLE "public"."master_custom_grup_2" TO "authenticated";
GRANT ALL ON TABLE "public"."master_custom_grup_2" TO "service_role";



GRANT ALL ON TABLE "public"."master_custom_grup_3" TO "anon";
GRANT ALL ON TABLE "public"."master_custom_grup_3" TO "authenticated";
GRANT ALL ON TABLE "public"."master_custom_grup_3" TO "service_role";



GRANT ALL ON TABLE "public"."master_custom_grup_4" TO "anon";
GRANT ALL ON TABLE "public"."master_custom_grup_4" TO "authenticated";
GRANT ALL ON TABLE "public"."master_custom_grup_4" TO "service_role";



GRANT ALL ON TABLE "public"."master_custom_grup_5" TO "anon";
GRANT ALL ON TABLE "public"."master_custom_grup_5" TO "authenticated";
GRANT ALL ON TABLE "public"."master_custom_grup_5" TO "service_role";



GRANT ALL ON TABLE "public"."master_custom_grup_6" TO "anon";
GRANT ALL ON TABLE "public"."master_custom_grup_6" TO "authenticated";
GRANT ALL ON TABLE "public"."master_custom_grup_6" TO "service_role";



GRANT ALL ON TABLE "public"."master_department" TO "anon";
GRANT ALL ON TABLE "public"."master_department" TO "authenticated";
GRANT ALL ON TABLE "public"."master_department" TO "service_role";



GRANT ALL ON TABLE "public"."master_designation" TO "anon";
GRANT ALL ON TABLE "public"."master_designation" TO "authenticated";
GRANT ALL ON TABLE "public"."master_designation" TO "service_role";



GRANT ALL ON TABLE "public"."master_job_level" TO "anon";
GRANT ALL ON TABLE "public"."master_job_level" TO "authenticated";
GRANT ALL ON TABLE "public"."master_job_level" TO "service_role";



GRANT ALL ON TABLE "public"."master_pt" TO "anon";
GRANT ALL ON TABLE "public"."master_pt" TO "authenticated";
GRANT ALL ON TABLE "public"."master_pt" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."recruitment_queue_view" TO "anon";
GRANT ALL ON TABLE "public"."recruitment_queue_view" TO "authenticated";
GRANT ALL ON TABLE "public"."recruitment_queue_view" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";





