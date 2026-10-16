<template>
  <main class="app-auth-shell">
    <div class="app-auth-backdrop" />
    <div class="absolute right-6 top-6 z-10 sm:right-8 sm:top-8">
      <LanguageSwitcher />
    </div>

    <div
      class="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10"
    >
      <div class="app-auth-frame grid w-full items-stretch lg:grid-cols-[1.08fr_0.92fr]">
        <section class="app-auth-brand-panel hidden lg:flex lg:min-h-[620px] lg:flex-col lg:justify-between lg:p-10 xl:p-12">
          <div>
            <p class="app-page-eyebrow tracking-[0.35em]">
              {{ text("app.brand.workspace") }}
            </p>
            <h1 class="app-auth-hero-title mt-6 max-w-xl">
              {{ text("login.hero.title") }}
            </h1>
          </div>

          <div>
            <div class="app-auth-rule" />
            <p class="app-auth-section-label mt-8">
              {{ text("login.section.authentication") }}
            </p>
          </div>
        </section>

        <section class="app-auth-surface p-6 sm:p-8 lg:flex lg:min-h-[620px] lg:items-center lg:p-10 xl:p-12">
          <div class="w-full">
            <div class="mb-8 flex items-start justify-between gap-3">
              <div class="app-auth-icon-badge">
                <ShieldCheck class="h-6 w-6" />
              </div>
              <div class="flex-1">
                <p class="app-auth-section-label">
                  {{ text("login.section.authentication") }}
                </p>
                <h2 class="app-auth-title mt-2">{{ text("login.title") }}</h2>
              </div>
            </div>

            <Form class="space-y-5" @submit="onSubmit">
              <div class="space-y-2">
                <label class="app-field-label" for="identifier"
                  >{{ text("login.fields.identifier") }}</label
                >
                <div class="app-auth-input-shell">
                  <Mail class="app-auth-input-icon h-4 w-4" />
                  <Field
                    id="identifier"
                    name="identifier"
                    type="text"
                    autocomplete="username"
                    :placeholder="text('login.fields.identifierPlaceholder')"
                    class="app-auth-input-control"
                  />
                </div>
                <ErrorMessage name="identifier" class="app-error-text" />
              </div>

              <div class="space-y-2">
                <label class="app-field-label" for="password">
                  {{ text("login.fields.password") }}
                </label>
                <div class="app-auth-input-shell">
                  <LockKeyhole class="app-auth-input-icon h-4 w-4" />
                  <Field
                    id="password"
                    name="password"
                    :type="state.showPassword ? 'text' : 'password'"
                    autocomplete="current-password"
                    :placeholder="text('login.fields.passwordPlaceholder')"
                    class="app-auth-input-control"
                  />
                  <button
                    type="button"
                    class="app-auth-toggle"
                    :aria-label="
                      state.showPassword
                        ? text('login.actions.hidePassword')
                        : text('login.actions.showPassword')
                    "
                    @click="state.showPassword = !state.showPassword"
                  >
                    <component :is="state.showPassword ? EyeOff : Eye" class="h-4 w-4" />
                  </button>
                </div>
                <ErrorMessage name="password" class="app-error-text" />
              </div>

              <p
                v-if="error"
                class="app-auth-alert"
              >
                {{ error }}
              </p>

              <button
                type="submit"
                class="app-auth-submit"
                :disabled="isLoading"
              >
                <LoaderCircle v-if="isLoading" class="h-4 w-4 animate-spin" />
                <span>{{
                  isLoading ? text("common.processing") : text("login.actions.signIn")
                }}</span>
              </button>

              <div class="text-center">
                <NuxtLink
                  to="/forgot-password"
                  class="text-sm text-[var(--app-color-accent)] hover:text-[var(--app-color-accent-strong)]"
                >
                  {{ text("login.actions.forgotPassword") }}
                </NuxtLink>
              </div>
            </Form>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { navigateTo, useRoute, useRouter, useRuntimeConfig } from '#imports'
import { ErrorMessage, Field, Form } from 'vee-validate'
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from 'lucide-vue-next'
import { z } from 'zod'

import { useLocale } from '@/composables/useLocale'
import { createLoginPageState } from '@/features/auth/LoginPage.state'
import type {
  LoginSubmitActions,
} from '@/features/auth/types/LoginPage.type'
import { isExternalRouteTarget } from '@/infrastructure/security/candidatePortal'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import LanguageSwitcher from '@/presentation/components/LanguageSwitcher.vue'
import { getDefaultRouteForRole } from '@/infrastructure/security/defaultRoute'
import { getSafeInternalRedirect } from '@/infrastructure/security/safeRedirect'
import { useAuthViewModel } from '@/viewmodels/useAuthViewModel'

const route = useRoute()
const router = useRouter()
const runtimeConfig = useRuntimeConfig()
const { error, isLoading, login } = useAuthViewModel()
const appToast = useAppToast()
const { text } = useLocale()

const state = reactive(createLoginPageState())

function getLoginSchema() {
  return z.object({
    identifier: z.string().trim().min(3, text('login.validation.identifierRequired')),
    password: z.string().min(8, text('login.validation.passwordMin')),
  })
}

async function onSubmit(
  values: Record<string, unknown>,
  actions: LoginSubmitActions,
) {
  const parsed = getLoginSchema().safeParse(values)

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors

    actions.setErrors({
      identifier: fieldErrors.identifier?.[0] ?? '',
      password: fieldErrors.password?.[0] ?? '',
    })
    return
  }

  try {
    const authenticatedUser = await login(parsed.data)
    appToast.success(text('auth.messages.loginSuccess'))
    const redirect = getSafeInternalRedirect(route.query.redirect)
    const target =
      redirect ||
      getDefaultRouteForRole(authenticatedUser?.role, runtimeConfig.public.candidatePortalUrl)

    if (isExternalRouteTarget(target)) {
      await navigateTo(target, { external: true })
      return
    }

    await router.push(target)
  } catch (err) {
    const message = err instanceof Error ? err.message : text('auth.messages.loginFailed')
    appToast.error(message)
  }
}
</script>
