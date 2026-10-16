<template>
  <header class="app-header-shell sticky top-0 z-40">
    <div class="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-6">
      <div class="flex min-w-0 items-start gap-3">
        <button
          type="button"
          class="app-header-control app-header-control-mobile"
          :aria-label="text('layout.actions.openMenu')"
          @click="$emit('open-mobile-sidebar')"
        >
          <Menu class="app-header-control-icon" :size="20" :stroke-width="2" />
        </button>
        <button
          type="button"
          class="app-header-control app-header-control-desktop"
          :aria-label="isDesktopSidebarOpen ? text('layout.actions.hideSidebar') : text('layout.actions.showSidebar')"
          @click="$emit('toggle-desktop-sidebar')"
        >
          <component
            :is="isDesktopSidebarOpen ? ChevronLeft : ChevronRight"
            class="app-header-control-icon"
            :size="20"
            :stroke-width="2"
          />
        </button>
        <div class="min-w-0 rounded-xl border border-transparent px-1 py-0.5">
          <p class="app-header-eyebrow">
            {{ text("layout.labels.workspace") }}
          </p>
          <h2 class="app-header-title mt-0.5 truncate">
            {{ pageTitle }}
          </h2>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-2">
        <LanguageSwitcher />
        <button
          type="button"
          class="app-button app-button-secondary"
          :disabled="isLoading"
          @click="$emit('logout')"
        >
          {{ isLoading ? text("common.processing") : text("common.actions.logout") }}
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Menu, ChevronLeft, ChevronRight } from "lucide-vue-next"
import { useLocale } from "@/composables/useLocale"
import LanguageSwitcher from "@/presentation/components/LanguageSwitcher.vue"

defineProps<{
  pageTitle: string
  isDesktopSidebarOpen: boolean
  isLoading: boolean
}>()

defineEmits<{
  "open-mobile-sidebar": []
  "toggle-desktop-sidebar": []
  "logout": []
}>()

const { text } = useLocale()
</script>

<style scoped>
.app-header-shell {
  border-bottom: 1px solid var(--app-color-border);
  background: linear-gradient(
    180deg,
    var(--app-color-surface-overlay),
    color-mix(in srgb, var(--app-color-surface-muted) 92%, transparent)
  );
  backdrop-filter: blur(12px);
}

.app-header-control {
  display: inline-flex;
  height: 2.5rem;
  width: 2.5rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);
  background: var(--app-color-surface);
  color: var(--app-color-text);
  box-shadow: var(--app-shadow-sm);
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}

.app-header-control-desktop {
  display: none;
}

.app-header-control:hover {
  background: var(--app-color-surface-muted);
}

.app-header-control-icon {
  height: 1.1rem;
  width: 1.1rem;
  color: currentColor;
}

@media (min-width: 1024px) {
  .app-header-control-mobile {
    display: none;
  }

  .app-header-control-desktop {
    display: inline-flex;
  }
}

.app-header-eyebrow {
  color: var(--app-color-text-soft);
  font-size: var(--app-font-size-2xs);
  font-weight: 600;
  letter-spacing: 0.26em;
  text-transform: uppercase;
}

.app-header-title {
  color: var(--app-color-text);
  font-size: var(--app-font-size-xl);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
}
</style>
