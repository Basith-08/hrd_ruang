<template>
  <ExportConfigurationPage />
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'
import ExportConfigurationPage from '@/features/admin/ExportConfigurationPage.vue'

definePageMeta({
  name: 'configuration-export',
  requiredPermissions: ['export_configuration:read', 'export_configuration:manage', 'export_configuration:generate'],
})
</script>
