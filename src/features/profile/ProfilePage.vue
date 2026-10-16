<template>
  <div class="flex w-full flex-col gap-4">
    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-8">
        <div class="max-w-3xl">
          <p class="app-dashboard-eyebrow">
            {{ text('profile.header.eyebrow') }}
          </p>
          <h1 class="app-dashboard-title mt-3">
            {{ text('profile.header.title') }}
          </h1>
          <p class="app-dashboard-copy mt-3 max-w-2xl">
            {{ text('profile.description') }}
          </p>
        </div>

        <ProfileRoleBadge :role="userRole" :label="text('profile.role.label')" />
      </div>
    </section>

    <div class="flex flex-col gap-4">
      <section class="app-dashboard-panel">
        <div class="p-5">
          <ProfileBasicInfoCard
            :title="text('profile.basicInformation')"
            :user="user"
            :user-id-label="text('profile.fields.userId')"
            :full-name-label="text('profile.fields.fullName')"
            :username-label="text('profile.fields.username')"
            :email-label="text('profile.fields.emailAddress')"
            :phone-label="text('common.labels.phoneNumber')"
          />
        </div>
      </section>

      <section class="app-dashboard-panel">
        <div class="p-5">
          <div class="flex flex-col gap-5">
            <div>
              <h2 class="app-dashboard-title !mt-0 !text-[1.15rem]">
                {{ text('profile.password.title') }}
              </h2>
              <p class="app-dashboard-copy mt-1">
                {{ text('profile.password.description') }}
              </p>
            </div>

            <AppAlert :message="passwordError" />

            <form class="flex flex-col gap-4" @submit.prevent="handleChangePassword">
              <label class="block">
                <span class="app-fieldset-label mb-1.5 block">
                  {{ text('profile.password.currentLabel') }}
                </span>
                <AppFormInput
                  v-model="form.currentPassword"
                  type="password"
                  autocomplete="current-password"
                  :placeholder="text('profile.password.currentPlaceholder')"
                  :error-text="fieldErrors.currentPassword"
                />
              </label>

              <label class="block">
                <span class="app-fieldset-label mb-1.5 block">
                  {{ text('profile.password.newLabel') }}
                </span>
                <AppFormInput
                  v-model="form.newPassword"
                  type="password"
                  autocomplete="new-password"
                  minlength="6"
                  :placeholder="text('profile.password.newPlaceholder')"
                  :helper-text="text('profile.password.helper')"
                  :error-text="fieldErrors.newPassword"
                />
              </label>

              <label class="block">
                <span class="app-fieldset-label mb-1.5 block">
                  {{ text('profile.password.confirmLabel') }}
                </span>
                <AppFormInput
                  v-model="form.confirmPassword"
                  type="password"
                  autocomplete="new-password"
                  minlength="6"
                  :placeholder="text('profile.password.confirmPlaceholder')"
                  :error-text="fieldErrors.confirmPassword"
                />
              </label>

              <div class="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-end">
                <AppActionButton
                  type="submit"
                  variant="primary"
                  :label="text('profile.password.submit')"
                  :loading-label="text('profile.password.submitting')"
                  :loading="isSubmitting"
                  :disabled="isSubmitting"
                />
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

import { useLocale } from '@/composables/useLocale'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import AppFormInput from '@/presentation/components/forms/AppFormInput.vue'
import { useAuthViewModel } from '@/viewmodels/useAuthViewModel'
import ProfileBasicInfoCard from './components/ProfileBasicInfoCard.vue'
import ProfileRoleBadge from './components/ProfileRoleBadge.vue'

const { user, userRole, changePassword } = useAuthViewModel()
const { text } = useLocale()
const appToast = useAppToast()

const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const fieldErrors = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const isSubmitting = ref(false)
const passwordError = ref('')

function resetForm() {
  form.currentPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
}

function resetErrors() {
  fieldErrors.currentPassword = ''
  fieldErrors.newPassword = ''
  fieldErrors.confirmPassword = ''
  passwordError.value = ''
}

function validateForm() {
  resetErrors()

  let isValid = true

  if (!form.currentPassword) {
    fieldErrors.currentPassword = text('profile.password.errors.currentRequired')
    isValid = false
  }

  if (!form.newPassword) {
    fieldErrors.newPassword = text('profile.password.errors.newRequired')
    isValid = false
  } else if (form.newPassword.length < 6) {
    fieldErrors.newPassword = text('profile.password.errors.minLength')
    isValid = false
  } else if (form.newPassword === form.currentPassword) {
    fieldErrors.newPassword = text('profile.password.errors.sameAsCurrent')
    isValid = false
  }

  if (!form.confirmPassword) {
    fieldErrors.confirmPassword = text('profile.password.errors.confirmRequired')
    isValid = false
  } else if (form.confirmPassword !== form.newPassword) {
    fieldErrors.confirmPassword = text('profile.password.errors.mismatch')
    isValid = false
  }

  return isValid
}

async function handleChangePassword() {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    await changePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    })
    appToast.success(text('profile.password.success'))
    resetForm()
    resetErrors()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : text('profile.password.errors.submitFailed')
    passwordError.value = message
    appToast.error(message)
  } finally {
    isSubmitting.value = false
  }
}
</script>
