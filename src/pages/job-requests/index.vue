<script setup lang="ts">
import { definePageMeta, navigateTo } from "#imports"

definePageMeta({
  layout: false,
})

await navigateTo("/employee-request-forms")
</script>
