<template>
  <EmployeeRequestFormPage />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import EmployeeRequestFormPage from "@/features/employeeRequestForms/EmployeeRequestFormPage.vue"

definePageMeta({
  name: "employee-request-forms-edit",
  requiredPermissions: ["employee_request_form:update"],
})
</script>
