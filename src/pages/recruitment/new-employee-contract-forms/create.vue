<template>
  <EmployeeContractFormPage />
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'

import EmployeeContractFormPage from '@/features/recruitment/EmployeeContractFormPage.vue'

definePageMeta({
  requiredPermissions: ['employee_contract_form:create'],
})
</script>
