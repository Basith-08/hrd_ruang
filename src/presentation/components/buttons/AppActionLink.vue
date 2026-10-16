<template>
  <NuxtLink :to="to" :class="linkClass">
    <slot>{{ label }}</slot>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type AppActionLinkVariant = 'primary' | 'secondary' | 'ghost'

const props = withDefaults(
  defineProps<{
    to: string | Record<string, unknown>
    label: string
    variant?: AppActionLinkVariant
  }>(),
  {
    variant: 'secondary',
  },
)

const variantClassMap: Record<AppActionLinkVariant, string> = {
  primary: 'app-button app-button-primary',
  secondary: 'app-button app-button-secondary',
  ghost: 'app-button app-button-ghost',
}

const linkClass = computed(() => variantClassMap[props.variant])
</script>
