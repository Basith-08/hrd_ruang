<template>
  <ExportConfigurationGeneratePage />
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'
import ExportConfigurationGeneratePage from '@/features/admin/ExportConfigurationGeneratePage.vue'

definePageMeta({
  name: 'configuration-export-generate',
  requiredPermissions: ['export_configuration:generate'],
})
</script>
