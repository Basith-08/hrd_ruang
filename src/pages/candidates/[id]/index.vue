<script setup lang="ts">
import { definePageMeta, navigateTo, useRoute } from "#imports"

definePageMeta({
  layout: false,
})

const route = useRoute()
await navigateTo(`/candidate-forms/${route.params.id}`)
</script>
