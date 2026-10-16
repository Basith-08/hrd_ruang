<template>
  <ExportConfigurationTemplatesPage />
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'
import ExportConfigurationTemplatesPage from '@/features/admin/ExportConfigurationTemplatesPage.vue'

definePageMeta({
  name: 'configuration-export-templates',
  requiredPermissions: ['export_configuration:manage'],
})
</script>
