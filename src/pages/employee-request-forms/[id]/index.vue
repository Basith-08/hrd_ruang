<template>
  <EmployeeRequestFormPage />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import EmployeeRequestFormPage from "@/features/employeeRequestForms/EmployeeRequestFormPage.vue"

definePageMeta({
  name: "employee-request-forms-detail",
  requiredPermissions: ["employee_request_form:read", "recruitment:approved_erf_read"],
})
</script>
