<template>
  <div :class="containerClassName">
    {{ message }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  message: string
  containerClass?: string
}>(), {
  containerClass: '',
})

const containerClassName = computed(() => [
  'app-copy-body py-10 text-center',
  props.containerClass,
])
</script>
