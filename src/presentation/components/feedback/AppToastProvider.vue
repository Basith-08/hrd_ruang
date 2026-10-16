<template>
  <Teleport to="body">
    <Toaster
      position="top-center"
      rich-colors
      expand
      :duration="4000"
      :toast-options="{
        classes: {
          toast: 'app-toast',
        },
      }"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { Teleport } from 'vue'
import { Toaster } from 'vue-sonner'
</script>