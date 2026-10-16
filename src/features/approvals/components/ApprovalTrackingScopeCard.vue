<template>
  <div class="app-surface-card p-5">
    <h3 class="app-label-compact">
      {{ title }}
    </h3>
    <div class="app-surface-card app-surface-card-muted mt-4 px-4 py-3">
      <p class="app-copy-strong text-sm">
        {{ scopeText }}
      </p>
      <p class="app-helper-text mt-1">
        {{ signedInAsText }}
      </p>
    </div>

    <div class="mt-4 px-4 py-3 text-sm" :class="notice.className">
      {{ notice.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

import type { ApprovalTrackingNotice } from '@/features/approvals/types/ApprovalTrackingPage.type'

defineProps({
  title: {
    type: String,
    required: true,
  },
  scopeText: {
    type: String,
    required: true,
  },
  signedInAsText: {
    type: String,
    required: true,
  },
  notice: {
    type: Object as PropType<ApprovalTrackingNotice>,
    required: true,
  },
})
</script>
