<template>
  <section>
    <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div class="min-w-0">
        <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">
          {{ eyebrow }}
        </p>
        <h1 class="mt-2 text-[2.05rem] font-semibold tracking-[-0.03em] text-[#1a2b67]">
          {{ title }}
        </h1>
        <p class="mt-2 text-sm text-slate-500">
          {{ lastUpdatedLabel }}: {{ lastUpdatedValue }}
        </p>
      </div>

      <div class="flex w-full xl:w-auto xl:flex-none xl:justify-end">
        <div class="flex w-full flex-wrap items-center justify-end gap-3 xl:w-auto">
          <button
            type="button"
            class="app-dashboard-action-secondary"
            @click="$emit('refresh')"
          >
            <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4" stroke="currentColor" stroke-width="2">
              <path d="M12 8v4l2 2" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            {{ loading ? loadingLabel : refreshLabel }}
          </button>

          <div ref="statusDropdownRef" class="flex min-w-[132px] flex-col items-stretch">
            <span class="sr-only">{{ statusLabel }}</span>

            <button
              type="button"
              class="app-dashboard-action-secondary min-w-[132px] justify-between"
              :aria-expanded="statusDropdownOpen ? 'true' : 'false'"
              aria-haspopup="listbox"
              @click="statusDropdownOpen = !statusDropdownOpen"
            >
              <span>{{ currentStatusLabel }}</span>
              <svg
                viewBox="0 0 20 20"
                fill="none"
                class="h-4 w-4 text-slate-400 transition"
                stroke="currentColor"
                stroke-width="1.8"
                :class="statusDropdownOpen ? 'rotate-180' : ''"
              >
                <path d="m5 7.5 5 5 5-5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>

            <div
              v-if="statusDropdownOpen"
              class="mt-2 overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_18px_32px_-20px_rgba(15,23,42,0.38)]"
              role="listbox"
            >
              <button
                v-for="mode in statusModes"
                :key="mode.value"
                type="button"
                class="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition"
                :class="statusMode === mode.value ? 'bg-slate-50 font-semibold text-[#1f3a8a]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
                @click="handleStatusSelect(mode.value)"
              >
                <span>{{ mode.label }}</span>
                <span v-if="statusMode === mode.value" class="text-xs text-[#1f3a8a]">•</span>
              </button>
            </div>

            <select
              :value="statusMode"
              class="sr-only"
              @change="handleNativeStatusChange"
            >
              <option v-for="mode in statusModes" :key="`native-${mode.value}`" :value="mode.value">
                {{ mode.label }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="app-dashboard-subpanel mt-4 grid gap-3 lg:grid-cols-[repeat(5,minmax(140px,1fr))_auto_auto] lg:items-end">
      <label class="block">
        <span class="app-fieldset-label mb-1.5 block">
          {{ departmentLabel }}
        </span>
        <SearchableSelect
          :model-value="departmentFilter"
          :options="departmentOptions"
          show-empty-option
          :empty-label="allLabel"
          :placeholder="allLabel"
          @update:model-value="handleDepartmentFilterUpdate"
        />
      </label>

      <label class="block">
        <span class="app-fieldset-label mb-1.5 block">
          {{ levelLabel }}
        </span>
        <SearchableSelect
          :model-value="levelFilter"
          :options="levelOptions"
          show-empty-option
          :empty-label="allLabel"
          :placeholder="allLabel"
          @update:model-value="handleLevelFilterUpdate"
        />
      </label>

      <label class="block">
        <span class="app-fieldset-label mb-1.5 block">
          {{ recruiterLabel }}
        </span>
        <SearchableSelect
          :model-value="recruiterFilter"
          :options="recruiterOptions"
          show-empty-option
          :empty-label="allLabel"
          :placeholder="allLabel"
          @update:model-value="handleRecruiterFilterUpdate"
        />
      </label>

      <label class="block">
        <span class="app-fieldset-label mb-1.5 block">
          {{ fromLabel }}
        </span>
        <input
          :value="periodStart"
          type="date"
          class="app-field h-11 rounded-md border-slate-200 bg-white"
          @input="emit('update:periodStart', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="block">
        <span class="app-fieldset-label mb-1.5 block">
          {{ toLabel }}
        </span>
        <input
          :value="periodEnd"
          type="date"
          class="app-field h-11 rounded-md border-slate-200 bg-white"
          @input="emit('update:periodEnd', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <AppActionButton
        :label="currentMonthLabel"
        variant="secondary"
        class="h-11 whitespace-nowrap px-4 py-0"
        @click="emit('resetCurrentMonth')"
      />

      <AppActionButton
        :label="resetAllLabel"
        variant="ghost"
        class="h-11 whitespace-nowrap px-4 py-0"
        @click="emit('resetAll')"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import type { DashboardStatusMode } from '@/features/recruitment/types/RecruitmentDashboardPage.type'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import SearchableSelect from '@/presentation/components/forms/SearchableSelect.vue'

const props = defineProps<{
  eyebrow: string
  title: string
  description: string
  statusLabel: string
  lastUpdatedLabel: string
  lastUpdatedValue: string
  statusMode: DashboardStatusMode
  statusModes: Array<{
    value: DashboardStatusMode
    label: string
  }>
  loading: boolean
  refreshLabel: string
  loadingLabel: string
  exportExcelLabel: string
  newErfLabel: string
  createErfHref: string
  showExport: boolean
  allLabel: string
  departmentLabel: string
  departmentFilter: string
  departmentOptions: Array<{ value: string; label: string }>
  levelLabel: string
  levelFilter: string
  levelOptions: Array<{ value: string; label: string }>
  recruiterLabel: string
  recruiterFilter: string
  recruiterOptions: Array<{ value: string; label: string }>
  fromLabel: string
  toLabel: string
  periodStart: string
  periodEnd: string
  currentMonthLabel: string
  resetAllLabel: string
}>()

const emit = defineEmits<{
  (event: 'update:statusMode', value: DashboardStatusMode): void
  (event: 'refresh'): void
  (event: 'exportExcel'): void
  (event: 'update:departmentFilter', value: string): void
  (event: 'update:levelFilter', value: string): void
  (event: 'update:recruiterFilter', value: string): void
  (event: 'update:periodStart', value: string): void
  (event: 'update:periodEnd', value: string): void
  (event: 'resetCurrentMonth'): void
  (event: 'resetAll'): void
}>()

function handleDepartmentFilterUpdate(value: string | number | null) {
  emit('update:departmentFilter', String(value ?? ''))
}

function handleLevelFilterUpdate(value: string | number | null) {
  emit('update:levelFilter', String(value ?? ''))
}

function handleRecruiterFilterUpdate(value: string | number | null) {
  emit('update:recruiterFilter', String(value ?? ''))
}

const statusDropdownOpen = ref(false)
const statusDropdownRef = ref<HTMLElement | null>(null)

const currentStatusLabel = computed(() =>
  props.statusModes.find((mode) => mode.value === props.statusMode)?.label ?? props.statusMode,
)

function handleStatusSelect(value: DashboardStatusMode) {
  statusDropdownOpen.value = false
  emit('update:statusMode', value)
}

function handleNativeStatusChange(event: Event) {
  const target = event.target as HTMLSelectElement
  handleStatusSelect(target.value as DashboardStatusMode)
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!statusDropdownRef.value) {
    return
  }

  if (!statusDropdownRef.value.contains(event.target as Node)) {
    statusDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})
</script>
