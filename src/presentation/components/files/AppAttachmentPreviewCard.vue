<template>
  <div class="app-attachment-preview">
    <p class="app-attachment-preview-title">{{ title }}</p>

    <p v-if="loading" class="app-attachment-preview-copy">
      {{ loadingLabel }}
    </p>

    <div v-else-if="items.length > 0" class="mt-4 space-y-2">
      <component
        :is="item.url ? 'a' : 'div'"
        v-for="item in items"
        :key="item.path || item.name"
        :href="item.url || undefined"
        :target="item.url ? '_blank' : undefined"
        :rel="item.url ? 'noopener noreferrer' : undefined"
        class="block rounded-xl border px-4 py-3 text-sm transition"
        :class="item.url ? linkItemClass : emptyLinkItemClass"
      >
        {{ item.name }}
      </component>
    </div>

    <p v-else class="app-attachment-preview-copy">
      {{ emptyLabel }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface AttachmentPreviewItem {
  path: string
  name: string
  url?: string | null
}

withDefaults(
  defineProps<{
    title: string
    items?: AttachmentPreviewItem[]
    loading?: boolean
    loadingLabel: string
    emptyLabel: string
    linkItemClass?: string
    emptyLinkItemClass?: string
  }>(),
  {
    items: () => [],
    loading: false,
    linkItemClass: 'app-attachment-preview-link',
    emptyLinkItemClass: 'app-attachment-preview-link-empty',
  },
)
</script>
