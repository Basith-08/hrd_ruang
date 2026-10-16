<template>
  <EmployeeContractFormListPage />
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'

import EmployeeContractFormListPage from '@/features/recruitment/EmployeeContractFormListPage.vue'

definePageMeta({
  requiredPermissions: ['employee_contract_form:read'],
})
</script>
