<template>
  <div class="flex flex-col gap-4">
    <h2 class="app-dashboard-title !mt-0 !text-[1.15rem]">
      {{ title }}
    </h2>
    <AppInfoGrid
      grid-class="gap-4 md:grid-cols-1"
      label-class="app-table-muted text-xs uppercase tracking-wider"
      value-class="app-copy-strong mt-1 text-sm"
      :fields="fields"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import AppInfoGrid from '@/presentation/components/data/AppInfoGrid.vue'

type ProfileUser = {
  id?: string | null
  full_name?: string | null
  username?: string | null
  email?: string | null
  phone?: string | null
}

const props = defineProps<{
  title: string
  user: ProfileUser | null | undefined
  userIdLabel: string
  fullNameLabel: string
  usernameLabel: string
  emailLabel: string
  phoneLabel: string
}>()

const fields = computed(() => [
  {
    key: 'id',
    label: props.userIdLabel,
    value: props.user?.id || '-',
  },
  {
    key: 'full_name',
    label: props.fullNameLabel,
    value: props.user?.full_name || '-',
  },
  {
    key: 'username',
    label: props.usernameLabel,
    value: props.user?.username || '-',
  },
  {
    key: 'email',
    label: props.emailLabel,
    value: props.user?.email || '-',
  },
  {
    key: 'phone',
    label: props.phoneLabel,
    value: props.user?.phone || '-',
  },
])
</script>
