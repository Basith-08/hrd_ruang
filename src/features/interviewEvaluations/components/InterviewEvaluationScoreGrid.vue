<template>
  <div>
    <div class="mb-4">
      <h3 class="app-section-title-compact">{{ title }}</h3>
      <p class="app-section-description mt-1">
        {{ legend }}
      </p>
    </div>

    <div class="app-table-shell">
      <div v-if="!isMobileViewport">
        <table class="w-full table-fixed text-left text-sm">
          <thead class="app-table-head">
            <tr>
              <th class="w-[5%] px-4 py-3 font-medium whitespace-nowrap">{{ columnLabel('number', 'No') }}</th>
              <th class="w-[14%] px-4 py-3 font-medium">{{ columnLabel('category', 'Category') }}</th>
              <th class="w-[48%] px-4 py-3 font-medium">{{ columnLabel('description', 'Description') }}</th>
              <th class="w-[15%] px-4 py-3 font-medium">{{ columnLabel('score', 'Score') }}</th>
              <th class="w-[18%] px-4 py-3 font-medium">{{ columnLabel('info', 'Info') }}</th>
            </tr>
          </thead>
          <tbody class="app-table-body divide-y app-table-divider">
            <tr v-for="item in scoreRows" :key="item.item_number" class="align-top">
              <td class="app-copy-strong px-4 py-4">{{ item.item_number }}</td>
              <td class="px-4 py-4">
                <p class="app-copy-strong break-words">{{ item.title }}</p>
              </td>
              <td class="px-4 py-4">
                <p class="leading-6 break-words">{{ item.description }}</p>
                <p v-if="item.note" class="app-note-warning mt-2">
                  {{ item.note }}
                </p>
              </td>
              <td class="px-4 py-4">
                <AppSelect
                  :model-value="String(item.score ?? '')"
                  :options="scoreValueOptions"
                  :placeholder="selectScoreLabel"
                  :disabled="isDisabled"
                  select-class="min-w-0 px-3 py-2.5"
                  @change="$emit('updateScore', item.item_number, $event)"
                />
              </td>
              <td class="px-4 py-4">
                <AppFormInput
                  :model-value="item.info"
                  type="text"
                  :disabled="isDisabled"
                  :placeholder="optionalNoteLabel"
                  @update:model-value="$emit('updateScoreInfo', item.item_number, $event)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="grid gap-0">
        <section
          v-for="item in scoreRows"
          :key="item.item_number"
          class="app-table-divider border-t p-4 first:border-t-0"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="app-label-compact">
                {{ columnLabel('number', 'No') }} {{ item.item_number }}
              </p>
              <p class="app-copy-strong mt-2 break-words text-base">
                {{ item.title }}
              </p>
            </div>
          </div>

          <div class="mt-3 space-y-3">
            <div>
              <p class="app-label-compact">
                {{ columnLabel('description', 'Description') }}
              </p>
              <p class="app-copy-body mt-1 break-words">{{ item.description }}</p>
              <p v-if="item.note" class="app-note-warning mt-2">
                {{ item.note }}
              </p>
            </div>

            <div>
              <p class="app-label-compact mb-1.5">
                {{ columnLabel('score', 'Score') }}
              </p>
              <AppSelect
                :model-value="String(item.score ?? '')"
                :options="scoreValueOptions"
                :placeholder="selectScoreLabel"
                :disabled="isDisabled"
                select-class="min-w-0 px-3 py-2.5"
                @change="$emit('updateScore', item.item_number, $event)"
              />
            </div>

            <div>
              <p class="app-label-compact mb-1.5">
                {{ columnLabel('info', 'Info') }}
              </p>
              <AppFormInput
                :model-value="item.info"
                type="text"
                :disabled="isDisabled"
                :placeholder="optionalNoteLabel"
                @update:model-value="$emit('updateScoreInfo', item.item_number, $event)"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, type PropType } from 'vue'

import type { InterviewEvaluationScoreRow } from '@/features/interviewEvaluations/types/InterviewEvaluationPage.type'
import AppFormInput from '@/presentation/components/forms/AppFormInput.vue'
import AppSelect from '@/presentation/components/forms/AppSelect.vue'
import type { AppTableColumn } from '@/presentation/components/tables/AppTable.vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  legend: {
    type: String,
    required: true,
  },
  columns: {
    type: Array as PropType<AppTableColumn[]>,
    required: true,
  },
  scoreRows: {
    type: Array as PropType<InterviewEvaluationScoreRow[]>,
    default: () => [],
  },
  scoreValueOptions: {
    type: Array as PropType<number[]>,
    default: () => [],
  },
  isDisabled: {
    type: Boolean,
    required: true,
  },
  selectScoreLabel: {
    type: String,
    required: true,
  },
  optionalNoteLabel: {
    type: String,
    required: true,
  },
})

defineEmits<{
  (event: 'updateScore', itemNumber: number, value: Event): void
  (event: 'updateScoreInfo', itemNumber: number, value: string): void
}>()

const isMobileViewport = ref(false)

function syncViewportMode() {
  if (typeof window === 'undefined') {
    isMobileViewport.value = false
    return
  }

  isMobileViewport.value = window.innerWidth < 768
}

onMounted(() => {
  syncViewportMode()
  window.addEventListener('resize', syncViewportMode)
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined') {
    return
  }

  window.removeEventListener('resize', syncViewportMode)
})

function columnLabel(key: string, fallback: string) {
  return props.columns.find((column) => column.key === key)?.label || fallback
}
</script>
