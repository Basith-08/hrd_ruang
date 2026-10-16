<template>
  <EmployeeRequestFormList />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import EmployeeRequestFormList from "@/features/employeeRequestForms/EmployeeRequestFormList.vue"

definePageMeta({
  name: "employee-request-forms",
  requiredPermissions: ["employee_request_form:read", "recruitment:approved_erf_read"],
})
</script>
