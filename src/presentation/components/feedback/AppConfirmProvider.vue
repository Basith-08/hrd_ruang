<template>
  <Teleport to="body">
    <div
      v-if="request"
      class="app-modal-overlay z-[60]"
      @click.self="appConfirm.close(false)"
    >
      <div class="app-modal-card max-w-md p-6">
        <div class="space-y-3">
          <h2 class="app-modal-title">
            {{ request.title }}
          </h2>
          <p class="app-modal-description">
            {{ request.message }}
          </p>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <AppActionButton
            variant="secondary"
            :label="request.cancelLabel"
            @click="appConfirm.close(false)"
          />
          <AppActionButton
            :variant="request.tone === 'danger' ? 'danger' : 'primary'"
            :label="request.confirmLabel"
            @click="appConfirm.close(true)"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, Teleport } from 'vue'

import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import { useAppConfirm } from '@/presentation/components/feedback/useAppConfirm'

const appConfirm = useAppConfirm()
const request = computed(() => appConfirm.state.request)
</script>
