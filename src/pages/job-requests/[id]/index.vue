<script setup lang="ts">
import { definePageMeta, navigateTo, useRoute } from "#imports"

definePageMeta({
  layout: false,
})

const route = useRoute()
await navigateTo(`/employee-request-forms/${route.params.id}`)
</script>
