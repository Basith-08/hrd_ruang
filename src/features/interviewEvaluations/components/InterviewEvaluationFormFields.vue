<template>
  <div class="grid gap-5 md:grid-cols-2">
    <label class="space-y-2 md:col-span-2">
      <AppFieldLabel>
        {{ text('interviewEvaluations.page.fields.candidate') }}
      </AppFieldLabel>
      <SearchableSelect
        :model-value="form.selected_candidate_option_id"
        :options="candidateSelectOptions"
        :disabled="isDisabled || loading"
        :placeholder="text('interviewEvaluations.page.fields.candidateSearchPlaceholder')"
        show-empty-option
        :empty-label="text('interviewEvaluations.page.fields.selectCandidate')"
        @update:model-value="form.selected_candidate_option_id = typeof $event === 'string' ? $event : ''"
      />
      <p v-if="!loading && candidateSelectOptions.length === 0" class="app-warning-text">
        {{ text('interviewEvaluations.page.fields.noCandidateData') }}
      </p>
    </label>

    <AppInfoGrid class="md:col-span-2" :fields="candidateSummaryFields" />

    <label class="space-y-2.5">
      <AppFieldLabel>
        {{ text('interviewEvaluations.page.fields.interviewerName') }}
      </AppFieldLabel>
      <AppMultiSelect
        :model-value="selectedInterviewerValues"
        :options="interviewerSelectOptions"
        :disabled="isDisabled || saving || interviewersLoading"
        :placeholder="text('interviewEvaluations.page.fields.selectInterviewer')"
        :empty-label="text('interviewEvaluations.page.fields.noSelectedInterviewers')"
        :remove-label="text('interviewEvaluations.page.fields.removeInterviewer')"
        @update:model-value="updateSelectedInterviewers"
      />
      <p class="app-helper-text">
        {{ text('interviewEvaluations.page.fields.selectMultipleInterviewers') }}
      </p>
      <p v-if="!interviewersLoading && interviewerSelectOptions.length === 0" class="app-warning-text">
        {{ text('interviewEvaluations.page.fields.noInterviewerData') }}
      </p>
    </label>

    <label class="space-y-2.5">
      <AppFieldLabel>
        {{ text('interviewEvaluations.page.fields.interviewDate') }}
      </AppFieldLabel>
      <div class="flex gap-2">
        <div class="flex-1">
          <AppFormInput
            v-model="interviewDatePart"
            type="date"
            :disabled="isDisabled || saving"
            required
          />
        </div>
        <div class="relative w-36">
          <AppFormInput
            ref="timeInputRef"
            v-model="interviewTimePart"
            type="time"
            class="app-time-input"
            :disabled="isDisabled || saving"
            required
          />
          <button
            type="button"
            class="app-icon-button-subtle absolute right-2 top-1/2 -translate-y-1/2"
            :disabled="isDisabled || saving"
            :aria-label="text('interviewEvaluations.page.fields.interviewDate')"
            @click="timeInputRef?.showPicker()"
          >
            <Clock class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </label>

    <label
      v-if="showAssessmentFields"
      class="space-y-2.5"
    >
      <AppFieldLabel>
        {{ text('interviewEvaluations.page.fields.recommendation') }}
      </AppFieldLabel>
      <SearchableSelect
        :model-value="form.recommendation"
        :options="recommendationSelectOptions"
        :disabled="isDisabled || saving"
        :placeholder="text('interviewEvaluations.page.fields.recommendationSearchPlaceholder')"
        show-empty-option
        :empty-label="text('interviewEvaluations.page.fields.selectRecommendation')"
        @update:model-value="form.recommendation = resolveRecommendationValue($event)"
      />
    </label>

    <label
      v-if="showAssessmentFields"
      class="space-y-2.5 md:col-span-2"
    >
      <AppFieldLabel>
        {{ text('interviewEvaluations.page.fields.comments') }}
      </AppFieldLabel>
      <AppTextarea
        v-model="form.comments"
        rows="5"
        :disabled="isDisabled || saving"
        :placeholder="text('interviewEvaluations.page.fields.commentsPlaceholder')"
      />
    </label>

    <label
      v-if="showNotesField"
      class="space-y-2.5 md:col-span-2"
    >
      <AppFieldLabel>
        {{ text('interviewEvaluations.page.fields.notes') }}
      </AppFieldLabel>
      <AppTextarea
        v-model="form.notes"
        rows="5"
        :disabled="isDisabled || saving"
        :placeholder="text('interviewEvaluations.page.fields.notesPlaceholder')"
      />
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type PropType } from 'vue'

import type { InterviewEvaluationCandidateOption } from '@/domain/entities/InterviewEvaluation'
import type { InterviewEvaluationRequest } from '@/domain/requests/InterviewEvaluationRequest'
import type {
  InterviewEvaluationInterviewerSelectOption,
  InterviewEvaluationSelectOption,
} from '@/features/interviewEvaluations/types/InterviewEvaluationPage.type'
import { Clock } from 'lucide-vue-next'

import AppInfoGrid from '@/presentation/components/data/AppInfoGrid.vue'
import AppFieldLabel from '@/presentation/components/forms/AppFieldLabel.vue'
import AppFormInput from '@/presentation/components/forms/AppFormInput.vue'
import AppMultiSelect from '@/presentation/components/forms/AppMultiSelect.vue'
import AppTextarea from '@/presentation/components/forms/AppTextarea.vue'
import SearchableSelect from '@/presentation/components/forms/SearchableSelect.vue'

const timeInputRef = ref<InstanceType<typeof AppFormInput> | null>(null)

const props = defineProps({
  form: {
    type: Object as PropType<InterviewEvaluationRequest>,
    required: true,
  },
  selectedCandidate: {
    type: Object as PropType<InterviewEvaluationCandidateOption | null>,
    default: null,
  },
  candidateSelectOptions: {
    type: Array as PropType<InterviewEvaluationSelectOption[]>,
    default: () => [],
  },
  recommendationSelectOptions: {
    type: Array as PropType<InterviewEvaluationSelectOption[]>,
    default: () => [],
  },
  interviewerSelectOptions: {
    type: Array as PropType<InterviewEvaluationInterviewerSelectOption[]>,
    default: () => [],
  },
  interviewersLoading: {
    type: Boolean,
    required: true,
  },
  isDisabled: {
    type: Boolean,
    required: true,
  },
  loading: {
    type: Boolean,
    required: true,
  },
  saving: {
    type: Boolean,
    required: true,
  },
  showAssessmentFields: {
    type: Boolean,
    default: true,
  },
  showNotesField: {
    type: Boolean,
    default: true,
  },
  text: {
    type: Function as PropType<(key: string) => string>,
    required: true,
  },
})

const candidateSummaryFields = computed(() => [
  {
    label: props.text('interviewEvaluations.page.fields.candidateName'),
    value: props.selectedCandidate?.candidate_name || '-',
  },
  {
    label: props.text('interviewEvaluations.page.fields.appliedPosition'),
    value: props.selectedCandidate?.applied_position || '-',
  },
])

const interviewDatePart = computed({
  get() {
    const [datePart] = props.form.interview_date.split('T')
    return datePart || ''
  },
  set(value: string) {
    props.form.interview_date = value ? `${value}T${interviewTimePart.value || '00:00'}` : ''
  },
})

const interviewTimePart = computed({
  get() {
    const [, timePart] = props.form.interview_date.split('T')
    return timePart ? timePart.slice(0, 5) : ''
  },
  set(value: string) {
    if (!interviewDatePart.value) return
    props.form.interview_date = `${interviewDatePart.value}T${value || '00:00'}`
  },
})

const selectedInterviewerValues = computed(() => {
  const recipients = Array.isArray(props.form.interviewer_recipients)
    ? props.form.interviewer_recipients
    : []

  if (recipients.length > 0) {
    return recipients
      .map((recipient) => String(recipient.user_id || recipient.label || recipient.name || '').trim())
      .filter(Boolean)
  }

  return props.form.interviewer_name
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
})

function updateSelectedInterviewers(values: string[]) {
  const selectedOptions = values
    .map((value) => props.interviewerSelectOptions.find((option) => option.value === value))
    .filter((option): option is InterviewEvaluationInterviewerSelectOption => Boolean(option))

  props.form.interviewer_recipients = selectedOptions.map((option) => ({
    user_id: option.user_id,
    name: option.name || option.label,
    email: option.email,
    job_level: option.job_level,
    label: option.label,
  }))
  props.form.interviewer_name = selectedOptions.map((option) => option.label).join(', ')
}

function resolveRecommendationValue(value: string | number | null): InterviewEvaluationRequest['recommendation'] {
  return (typeof value === 'string' ? value : '') as InterviewEvaluationRequest['recommendation']
}
</script>
