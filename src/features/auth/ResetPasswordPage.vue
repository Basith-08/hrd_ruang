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
            <div v-if="!isValidToken" class="text-center">
              <div class="mb-6">
                <AlertCircle class="mx-auto h-12 w-12 text-red-600" />
              </div>
              <h2 class="app-auth-title mb-4">{{ text("resetPassword.invalidToken") }}</h2>
              <p class="mb-6 text-gray-600 dark:text-gray-400">
                {{ text("resetPassword.invalidTokenDescription") }}
              </p>
              <NuxtLink
                to="/login"
                  class="inline-block rounded-lg bg-[var(--app-color-accent)] px-6 py-2 text-white hover:bg-[var(--app-color-accent-strong)]"
              >
                {{ text("resetPassword.actions.backToLogin") }}
              </NuxtLink>
            </div>

            <div v-else-if="isResetSuccessful" class="text-center">
              <div class="mb-6">
                <CheckCircle class="mx-auto h-12 w-12 text-green-600" />
              </div>
              <h2 class="app-auth-title mb-4">{{ text("resetPassword.success") }}</h2>
              <p class="mb-6 text-gray-600 dark:text-gray-400">
                {{ text("resetPassword.successDescription") }}
              </p>
              <NuxtLink
                to="/login"
                  class="inline-block rounded-lg bg-[var(--app-color-accent)] px-6 py-2 text-white hover:bg-[var(--app-color-accent-strong)]"
              >
                {{ text("resetPassword.actions.goToLogin") }}
              </NuxtLink>
            </div>

            <div v-else>
              <div class="mb-8 flex items-start justify-between gap-3">
                <div class="app-auth-icon-badge">
                  <ShieldCheck class="h-6 w-6" />
                </div>
                <div class="flex-1">
                  <p class="app-auth-section-label">
                    {{ text("login.section.authentication") }}
                  </p>
                  <h2 class="app-auth-title mt-2">{{ text("resetPassword.title") }}</h2>
                </div>
              </div>

              <Form class="space-y-5" @submit="onSubmit">
                <div class="space-y-2">
                  <label class="app-field-label" for="password">
                    {{ text("resetPassword.fields.newPassword") }}
                  </label>
                  <div class="app-auth-input-shell">
                    <LockKeyhole class="app-auth-input-icon h-4 w-4" />
                    <Field
                      id="password"
                      name="password"
                      :type="state.showPassword ? 'text' : 'password'"
                      autocomplete="new-password"
                      :placeholder="text('resetPassword.fields.passwordPlaceholder')"
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

                <div class="space-y-2">
                  <label class="app-field-label" for="confirmPassword">
                    {{ text("resetPassword.fields.confirmPassword") }}
                  </label>
                  <div class="app-auth-input-shell">
                    <LockKeyhole class="app-auth-input-icon h-4 w-4" />
                    <Field
                      id="confirmPassword"
                      name="confirmPassword"
                      :type="state.showConfirmPassword ? 'text' : 'password'"
                      autocomplete="new-password"
                      :placeholder="text('resetPassword.fields.confirmPasswordPlaceholder')"
                      class="app-auth-input-control"
                    />
                    <button
                      type="button"
                      class="app-auth-toggle"
                      :aria-label="
                        state.showConfirmPassword
                          ? text('login.actions.hidePassword')
                          : text('login.actions.showPassword')
                      "
                      @click="state.showConfirmPassword = !state.showConfirmPassword"
                    >
                      <component :is="state.showConfirmPassword ? EyeOff : Eye" class="h-4 w-4" />
                    </button>
                  </div>
                  <ErrorMessage name="confirmPassword" class="app-error-text" />
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
                    isLoading ? text("common.processing") : text("resetPassword.actions.resetPassword")
                  }}</span>
                </button>

                <NuxtLink
                  to="/login"
                  class="block text-center text-sm text-[var(--app-color-accent)] hover:text-[var(--app-color-accent-strong)]"
                >
                  {{ text("resetPassword.actions.backToLogin") }}
                </NuxtLink>
              </Form>
            </div>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter, useRuntimeConfig } from '#imports'
import { ErrorMessage, Field, Form } from 'vee-validate'
import { AlertCircle, CheckCircle, Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-vue-next'
import { z } from 'zod'

import { useLocale } from '@/composables/useLocale'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import LanguageSwitcher from '@/presentation/components/LanguageSwitcher.vue'
import { callBackendApi } from '@/infrastructure/http/backendApi'

const route = useRoute()
const router = useRouter()
const appToast = useAppToast()
const { text } = useLocale()

const isLoading = ref(false)
const error = ref('')
const isValidToken = ref(false)
const isResetSuccessful = ref(false)
const token = ref('')

const state = reactive({
  showPassword: false,
  showConfirmPassword: false,
})

function getResetSchema() {
  return z.object({
    password: z.string().min(8, text('login.validation.passwordMin')),
    confirmPassword: z.string().min(8, text('login.validation.passwordMin')),
  }).refine((data) => data.password === data.confirmPassword, {
    message: text('resetPassword.validation.passwordMismatch'),
    path: ['confirmPassword'],
  })
}

onMounted(() => {
  const queryToken = String(route.query.token ?? '').trim()
  if (!queryToken) {
    isValidToken.value = false
    return
  }

  token.value = queryToken
  isValidToken.value = true
})

async function onSubmit(values: Record<string, unknown>, actions: any) {
  error.value = ''

  const parsed = getResetSchema().safeParse(values)

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors

    actions.setErrors({
      password: fieldErrors.password?.[0] ?? '',
      confirmPassword: fieldErrors.confirmPassword?.[0] ?? '',
    })
    return
  }

  try {
    isLoading.value = true

    await callBackendApi(
      '/auth/reset-password',
      {
        method: 'POST',
        body: JSON.stringify({
          token: token.value,
          newPassword: parsed.data.password,
        }),
      },
      { auth: false },
    )

    isResetSuccessful.value = true
    appToast.success(text('resetPassword.messages.success'))
  } catch (err) {
    const message = err instanceof Error ? err.message : text('resetPassword.messages.failed')
    error.value = message
    appToast.error(message)
  } finally {
    isLoading.value = false
  }
}
</script>
