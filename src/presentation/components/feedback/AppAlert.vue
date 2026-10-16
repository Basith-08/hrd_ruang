<template>
  <p v-if="message" :class="alertClass">
    <slot>{{ message }}</slot>
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type AppAlertVariant = 'error' | 'success' | 'warning' | 'info'

const props = withDefaults(
  defineProps<{
    message?: string | null
    variant?: AppAlertVariant
  }>(),
  {
    message: '',
    variant: 'error',
  },
)

const variantClassMap: Record<AppAlertVariant, string> = {
  error: 'app-alert app-alert-error',
  success: 'app-alert app-alert-success',
  warning: 'app-alert app-alert-warning',
  info: 'app-alert app-alert-info',
}

const alertClass = computed(() => [
  variantClassMap[props.variant],
])
</script>
