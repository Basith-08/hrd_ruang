<template>
  <div
    class="language-switcher inline-flex items-center gap-1 p-1"
    role="group"
    :aria-label="text('locale.switcher')"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="language-switcher__button min-w-[2.75rem] px-3 py-2"
      :class="locale === option.value
        ? 'language-switcher__button--active'
        : 'language-switcher__button--inactive'"
      :aria-pressed="locale === option.value"
      @click="setLocale(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"

import { useLocale, type SupportedLocale } from "@/composables/useLocale"

const { locale, setLocale, text } = useLocale()

const options = computed<{ label: string; value: SupportedLocale }[]>(() => [
  { label: "EN", value: "en" },
  { label: "ID", value: "id" },
])
</script>

<style scoped>
.language-switcher {
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);
  background: var(--app-color-surface);
  box-shadow: var(--app-shadow-sm);
  backdrop-filter: blur(12px);
}

.language-switcher__button {
  border-radius: var(--app-radius-sm);
  font-size: var(--app-font-size-xs);
  font-weight: 600;
  letter-spacing: var(--app-letterspacing-label);
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.language-switcher__button--active {
  background: var(--app-color-accent);
  color: var(--app-color-text-inverse);
  box-shadow: var(--app-shadow-sm);
}

.language-switcher__button--inactive {
  color: var(--app-color-text-muted);
}

.language-switcher__button--inactive:hover {
  background: var(--app-color-surface-muted);
  color: var(--app-color-text);
}
</style>
