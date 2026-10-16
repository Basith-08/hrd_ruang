<template>
  <div class="app-shell">
    <div class="flex min-h-screen">

      <!-- Mobile sidebar -->
      <div class="lg:hidden">
        <div v-show="isMobileSidebarOpen" class="app-shell-overlay fixed inset-0 z-40" aria-hidden="true"
          @click="isMobileSidebarOpen = false" />
        <aside
          class="app-shell-sidebar fixed inset-y-0 left-0 z-50 flex w-72 flex-col px-4 py-5 transition-transform duration-200 ease-out"
          :class="isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'" role="dialog"
          :aria-label="text('layout.navigation')" aria-modal="true">
          <div class="flex items-start justify-between gap-3">
            <div class="app-brand-card min-w-0 flex-1">
              <div class="app-brand-lockup">
                <div class="app-brand-mark" aria-hidden="true">
                  <img :src="brandMarkSrc" alt="" class="app-brand-mark-image">
                </div>
                <div class="min-w-0">
                  <p class="app-brand-card-eyebrow">
                    {{ text("app.brand.platform") }}
                  </p>
                  <p class="app-brand-card-wordmark">
                    {{ text("app.brand.workspace") }}
                  </p>
                </div>
              </div>
            </div>
            <button type="button" class="app-shell-close-button" :aria-label="text('layout.actions.closeMenu')"
              @click="isMobileSidebarOpen = false">
              <X class="app-shell-close-icon" :size="20" :stroke-width="2" />
            </button>
          </div>

          <AppSidebar variant="mobile" @nav-click="isMobileSidebarOpen = false" />

          <footer class="mt-auto shrink-0 pt-5">
            <div class="app-user-card app-user-card-compact">
              <div class="app-user-card-avatar" aria-hidden="true">
                {{ userInitial }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="app-user-card-value app-user-card-value-compact truncate" :title="userEmail">
                  {{ userEmail }}
                </p>
                <p class="app-user-card-meta">
                  {{ text("layout.labels.signedIn") }}
                </p>
              </div>
              <span v-if="userRole" class="app-user-card-role" :title="userRole">
                {{ userRoleCompactLabel }}
              </span>
            </div>
          </footer>
        </aside>
      </div>

      <!-- Desktop sidebar -->
      <aside
        class="app-shell-sidebar app-shell-sidebar-desktop hidden shrink-0 overflow-hidden transition-[width,padding,opacity,border-color] duration-200 ease-out lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col"
        :class="isDesktopSidebarOpen
          ? 'app-shell-sidebar-desktop-expanded'
          : 'app-shell-sidebar-desktop-collapsed'">
        <template v-if="isDesktopSidebarOpen">
          <div class="app-brand-card app-brand-card-sidebar min-w-0">
            <div class="app-brand-lockup app-brand-lockup-sidebar">
              <div class="app-brand-mark app-brand-mark-sidebar" aria-hidden="true">
                <img :src="brandMarkSrc" alt="" class="app-brand-mark-image">
              </div>
              <div class="min-w-0">
                <p class="app-brand-card-eyebrow">
                  {{ text("app.brand.platform") }}
                </p>
                <p class="app-brand-card-wordmark">
                  {{ text("app.brand.workspace") }}
                </p>
              </div>
            </div>
          </div>

          <AppSidebar variant="desktop" />

          <footer class="mt-5 shrink-0 pt-5">
            <div class="app-user-card app-user-card-compact">
              <div class="app-user-card-avatar" aria-hidden="true">
                {{ userInitial }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="app-user-card-value app-user-card-value-compact truncate" :title="userEmail">
                  {{ userEmail }}
                </p>
                <p class="app-user-card-meta">
                  {{ text("layout.labels.signedIn") }}
                </p>
              </div>
              <span v-if="userRole" class="app-user-card-role" :title="userRole">
                {{ userRoleCompactLabel }}
              </span>
            </div>
          </footer>
        </template>
      </aside>

      <!-- Main content -->
      <div class="flex min-w-0 flex-1 flex-col">
        <AppHeader :page-title="pageTitle" :is-desktop-sidebar-open="isDesktopSidebarOpen" :is-loading="isLoading"
          @open-mobile-sidebar="isMobileSidebarOpen = true"
          @toggle-desktop-sidebar="isDesktopSidebarOpen = !isDesktopSidebarOpen" @logout="handleLogout" />

        <main class="app-shell-content flex-1 px-4 py-6 sm:px-5 lg:px-6">
          <slot />
        </main>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useHead, useRoute, useRouter, useRuntimeConfig } from "#imports"
import { X } from "lucide-vue-next"

import { useLocale } from "@/composables/useLocale"
import { useLayoutNavigation } from "@/composables/useLayoutNavigation"
import { useAppToast } from "@/presentation/components/feedback/useAppToast"
import { useAuthViewModel } from "@/viewmodels/useAuthViewModel"
import AppSidebar from "@/presentation/components/layout/AppSidebar.vue"
import AppHeader from "@/presentation/components/layout/AppHeader.vue"

const route = useRoute()
const router = useRouter()
const runtimeConfig = useRuntimeConfig()
const { text } = useLocale()
const { isLoading, logout, user, userRole } = useAuthViewModel()
const appToast = useAppToast()
const { pageTitle } = useLayoutNavigation()

const isMobileSidebarOpen = ref(false)
const isDesktopSidebarOpen = ref(true)

const userEmail = computed(() => {
  const value = String(user.value?.email ?? "-").trim()
  return value || "-"
})

const userInitial = computed(() => {
  const token = userEmail.value.match(/[A-Za-z0-9]/)?.[0] ?? "U"
  return token.toUpperCase()
})

const userRoleCompactLabel = computed(() => formatCompactRoleLabel(userRole.value))
const brandMarkSrc = computed(() => `${String(runtimeConfig.app.baseURL ?? '/').replace(/\/?$/, '/')}hrd-mark.svg`)

useHead(() => ({ title: pageTitle.value }))

watch(() => route.path, () => { isMobileSidebarOpen.value = false })

function formatCompactRoleLabel(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toLowerCase()
  if (!normalized) return ""

  const aliasMap: Record<string, string> = {
    manager: "MGR",
    candidate: "CND",
    employee: "EMP",
    interviewer: "INT",
    recruiter: "REC",
    super_admin: "SADM",
  }

  if (aliasMap[normalized]) return aliasMap[normalized]

  const tokens = normalized.split(/[\s_-]+/).filter(Boolean)
  if (tokens.length > 1) {
    return tokens.slice(0, 4).map((token) => token[0]).join("").toUpperCase()
  }

  return normalized.slice(0, 4).toUpperCase()
}

async function handleLogout() {
  try {
    await logout()
    appToast.success(text("auth.messages.logoutSuccess"))
    await router.push("/login")
  } catch (err) {
    const message = err instanceof Error ? err.message : text("auth.messages.logoutFailed")
    appToast.error(message)
  }
}
</script>

<style scoped>
.app-shell-close-icon {
  height: 1.25rem;
  width: 1.25rem;
  color: currentColor;
}
</style>
