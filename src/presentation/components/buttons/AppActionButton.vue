<template>
  <button
    :type="type"
    :class="buttonClass"
    :aria-label="label"
    :title="label"
    :disabled="loading || disabled"
    @click="$emit('click')"
  >
    <template v-if="loading && loadingLabel">
      {{ loadingLabel }}
    </template>
    <slot v-else>
      {{ label }}
    </slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type AppActionButtonVariant = 'primary' | 'ghost' | 'danger' | 'dangerSubtle' | 'secondary' | 'icon' | 'success'

const props = withDefaults(
  defineProps<{
    label: string
    loadingLabel?: string
    loading?: boolean
    disabled?: boolean
    variant?: AppActionButtonVariant
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    loadingLabel: '',
    loading: false,
    disabled: false,
    variant: 'secondary',
    type: 'button',
  },
)

defineEmits<{
  (event: 'click'): void
}>()

const variantClassMap: Record<AppActionButtonVariant, string> = {
  primary: 'app-button app-button-primary',
  secondary: 'app-button app-button-secondary',
  ghost: 'app-button app-button-ghost',
  danger: 'app-button app-button-danger',
  dangerSubtle: 'app-button app-button-danger-subtle',
  icon: 'app-button app-button-icon',
  success: 'app-button app-button-success',
}

const buttonClass = computed(() => [
  variantClassMap[props.variant],
])
</script>
