<template>
  <nav class="app-sidebar-nav custom-scrollbar flex-1 overflow-y-auto pr-1" :class="navClass">
    <div v-for="section in filteredNavigationSections" :key="section.id" :class="sectionClass">
      <button
        class="flex w-full items-center justify-between rounded-2xl transition"
        :class="[buttonClass, isSectionOpen(section) ? buttonOpenClass : buttonIdleClass]"
        @click="toggleSection(section.id)"
      >
        <div class="flex items-center" :class="buttonInnerClass">
          <component :is="section.icon" v-if="section.icon" :class="sectionIconClass" />
          <span class="min-w-0 truncate text-left">{{ text(section.labelKey) }}</span>
        </div>
        <component :is="isSectionOpen(section) ? ChevronUp : ChevronDown" :class="chevronClass" />
      </button>

      <div v-show="isSectionOpen(section)" :class="itemsWrapperClass">
        <NuxtLink
          v-for="item in section.items"
          :key="item.to"
          :to="item.to"
          :class="[linkBaseClass, isActiveRoute(item.to) ? linkActiveClass : linkInactiveClass]"
          @click="$emit('nav-click')"
        >
          <div class="flex min-w-0 items-start gap-3">
            <component
              :is="item.icon"
              class="mt-0.5 h-4 w-4 shrink-0 transition-colors"
              :class="isActiveRoute(item.to) ? 'app-sidebar-icon-active' : iconInactiveClass"
            />
            <span class="min-w-0 whitespace-normal text-left leading-5">{{ text(item.labelKey) }}</span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ChevronDown, ChevronUp } from "lucide-vue-next"
import { useLocale } from "@/composables/useLocale"
import { useLayoutNavigation } from "@/composables/useLayoutNavigation"

const props = defineProps<{ variant: "mobile" | "desktop" }>()
defineEmits<{ "nav-click": [] }>()
const { text } = useLocale()
const { filteredNavigationSections, isActiveRoute, toggleSection, isSectionOpen } = useLayoutNavigation()
const isMobile = props.variant === "mobile"

const navClass = isMobile
  ? "mt-5 space-y-5 pb-3 pt-5"
  : "mt-5 space-y-5 pb-3 pt-5"
const sectionClass = "space-y-2"
const buttonClass = isMobile
  ? "app-sidebar-section-button app-sidebar-section-button-mobile px-2.5 py-2"
  : "app-sidebar-section-button app-sidebar-section-button-desktop px-2.5 py-2"
const buttonOpenClass = isMobile
  ? "app-sidebar-section-button-open-mobile"
  : "app-sidebar-section-button-open-desktop"
const buttonIdleClass = ""
const buttonInnerClass = isMobile ? "min-w-0 gap-3" : "min-w-0 gap-2.5"
const sectionIconClass = isMobile ? "h-4 w-4 shrink-0" : "h-4 w-4 shrink-0"
const chevronClass = "app-sidebar-chevron h-4 w-4 shrink-0 transition-transform duration-200"
const itemsWrapperClass = isMobile
  ? "space-y-1.5 pl-2 pt-1"
  : "space-y-1.5 pl-2 pt-1"
const linkBaseClass = isMobile
  ? "app-sidebar-link group flex rounded-xl px-2.5 py-2.5 text-sm transition"
  : "app-sidebar-link group flex rounded-xl px-2.5 py-2.5 text-sm transition"
const linkActiveClass = isMobile
  ? "app-sidebar-link-active"
  : "app-sidebar-link-active"
const linkInactiveClass = isMobile
  ? "app-sidebar-link-inactive app-sidebar-link-inactive-mobile"
  : "app-sidebar-link-inactive app-sidebar-link-inactive-desktop"
const iconInactiveClass = "app-sidebar-icon-inactive"
</script>

<style scoped>
.app-sidebar-nav {
  border-top: 1px solid var(--app-sidebar-color-border);
}

.app-sidebar-section-button {
  color: var(--app-sidebar-color-text-soft);
  font-size: 0.585rem;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.app-sidebar-section-button-mobile:hover {
  color: var(--app-sidebar-color-text);
}

.app-sidebar-section-button-desktop:hover {
  color: var(--app-sidebar-color-text);
}

.app-sidebar-section-button-open-mobile {
  color: var(--app-sidebar-color-text-soft);
}

.app-sidebar-section-button-open-desktop {
  color: var(--app-sidebar-color-text-soft);
}

.app-sidebar-chevron {
  color: var(--app-sidebar-color-text-soft);
}

.app-sidebar-link-active {
  border: 1px solid var(--app-sidebar-color-active-border);
  background: linear-gradient(180deg, var(--app-sidebar-color-active), var(--app-sidebar-color-active-strong));
  color: var(--app-sidebar-color-active-text);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.05);
}

.app-sidebar-icon-active {
  color: var(--app-sidebar-color-active-text);
}

.app-sidebar-link-inactive {
  color: var(--app-sidebar-color-text-muted);
  font-weight: 400;
}

.app-sidebar-link-inactive-mobile:hover {
  background: var(--app-sidebar-color-hover);
  color: var(--app-sidebar-color-text);
}

.app-sidebar-link-inactive-desktop:hover {
  background: var(--app-sidebar-color-hover);
  color: var(--app-sidebar-color-text);
}

.app-sidebar-icon-inactive {
  color: var(--app-sidebar-color-text-soft);
}

.group:hover .app-sidebar-icon-inactive {
  color: var(--app-sidebar-color-text);
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--app-sidebar-color-text-soft) 40%, transparent); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: color-mix(in srgb, var(--app-sidebar-color-text-soft) 55%, transparent); }
</style>
