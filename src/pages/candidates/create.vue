<script setup lang="ts">
import { definePageMeta, navigateTo } from "#imports"

definePageMeta({
  layout: false,
})

await navigateTo("/candidate-forms/create")
</script>
