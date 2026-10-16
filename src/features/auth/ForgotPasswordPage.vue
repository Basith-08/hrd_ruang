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
                <h2 class="app-auth-title mt-2">{{ text("forgotPassword.title") }}</h2>
              </div>
            </div>

            <Form class="space-y-5" @submit="onSubmit">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ text("forgotPassword.description") }}
              </p>

              <div class="space-y-2">
                <label class="app-field-label" for="email"
                  >{{ text("login.fields.identifier") }}</label
                >
                <div class="app-auth-input-shell">
                  <Mail class="app-auth-input-icon h-4 w-4" />
                  <Field
                    id="email"
                    name="email"
                    type="text"
                    autocomplete="email"
                    :placeholder="text('login.fields.identifierPlaceholder')"
                    class="app-auth-input-control"
                  />
                </div>
                <ErrorMessage name="email" class="app-error-text" />
              </div>

              <p
                v-if="error"
                class="app-auth-alert"
              >
                {{ error }}
              </p>

              <p
                v-if="successMessage"
                class="text-sm text-[var(--app-color-accent)]"
              >
                {{ successMessage }}
              </p>

              <button
                type="submit"
                class="app-auth-submit"
                :disabled="isLoading"
              >
                <LoaderCircle v-if="isLoading" class="h-4 w-4 animate-spin" />
                <span>{{
                  isLoading ? text("common.processing") : text("forgotPassword.actions.sendReset")
                }}</span>
              </button>

              <NuxtLink
                to="/login"
                class="block text-center text-sm text-[var(--app-color-accent)] hover:text-[var(--app-color-accent-strong)]"
              >
                {{ text("forgotPassword.actions.backToLogin") }}
              </NuxtLink>
            </Form>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRuntimeConfig } from '#imports'
import { ErrorMessage, Field, Form } from 'vee-validate'
import { LoaderCircle, Mail, ShieldCheck } from 'lucide-vue-next'
import { z } from 'zod'

import { useLocale } from '@/composables/useLocale'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import LanguageSwitcher from '@/presentation/components/LanguageSwitcher.vue'
import { callBackendApi } from '@/infrastructure/http/backendApi'

const runtimeConfig = useRuntimeConfig()
const appToast = useAppToast()
const { text } = useLocale()

const isLoading = ref(false)
const error = ref('')
const successMessage = ref('')

function getResetSchema() {
  return z.object({
    email: z.string().email(text('forgotPassword.validation.invalidEmail')),
  })
}

async function onSubmit(values: Record<string, unknown>, actions: any) {
  error.value = ''
  successMessage.value = ''

  const parsed = getResetSchema().safeParse(values)

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors

    actions.setErrors({
      email: fieldErrors.email?.[0] ?? '',
    })
    return
  }

  try {
    isLoading.value = true

    const response = await callBackendApi(
      '/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({
          email: parsed.data.email,
        }),
      },
      { auth: false },
    )

    successMessage.value = text('forgotPassword.messages.emailSent')
    actions.resetForm()
  } catch (err) {
    const message = err instanceof Error ? err.message : text('forgotPassword.messages.failed')
    error.value = message
    appToast.error(message)
  } finally {
    isLoading.value = false
  }
}
</script>
