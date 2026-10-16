<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-8 pb-12">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="app-page-eyebrow">
          {{ text('approvals.master.eyebrow') }}
        </p>
        <h1 class="app-page-title mt-3">
          {{ text('approvals.master.title') }}
        </h1>
      </div>
      <AppActionButton
        :label="text('approvals.master.editConfiguration')"
        variant="primary"
        @click="goToEdit"
      />
    </div>

    <AppAlert :message="error" />

    <div v-if="loading" class="app-page-description py-20 text-center">
      {{ text('approvals.master.loading') }}
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-2">
      <section v-for="flow in flowSummaries" :key="flow.key" class="app-surface-card">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="app-fieldset-label">Approval Flow — Designation</p>
            <h2 class="app-surface-title mt-2">
              {{ flow.title }}
            </h2>
            <div v-if="flow.designationLabels.length > 0" class="mt-2 flex flex-wrap gap-2">
              <span
                v-for="designationLabel in flow.designationLabels"
                :key="designationLabel"
                class="app-badge-muted"
              >
                {{ designationLabel }}
              </span>
            </div>
          </div>
          <span
            class="app-status-chip"
            :class="flow.isComplete ? 'app-status-chip-success' : 'app-status-chip-warning'"
          >
            {{ flow.isComplete ? 'Configured' : 'Incomplete' }}
          </span>
        </div>

        <div v-if="flow.steps.length > 0" class="mt-6 space-y-4">
          <div
            v-for="step in flow.steps"
            :key="step.id"
            class="app-surface-card app-surface-card-muted px-4 py-4"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="app-fieldset-label">Step {{ step.step_order }}</p>
                <h3 class="app-card-title mt-1">
                  {{ step.approval_role_label || `Approval Step ${step.step_order}` }}
                </h3>
              </div>
              <span
                class="app-status-chip"
                :class="step.profile_id ? 'app-status-chip-success' : 'app-status-chip-neutral'"
              >
                {{ step.profile_id ? 'Set' : 'Missing' }}
              </span>
            </div>

            <div class="app-copy-body mt-4">
              <p class="app-copy-strong">
                {{ step.employee?.full_name || step.employee?.username || '-' }}
              </p>
              <p class="mt-1">
                {{ step.employee?.email || '-' }}
              </p>
            </div>
          </div>
        </div>

        <p
          v-else
          class="app-attachment-preview-copy mt-6 rounded-xl border border-dashed px-4 py-4"
        >
          No approval step configured for this flow.
        </p>
      </section>
    </div>

    <div class="app-notice-panel">
      <div class="app-notice-icon">i</div>
      <div>
        <h3 class="app-notice-title">{{ text('approvals.master.configurationGuide') }}</h3>
        <p class="app-notice-copy">
          Configure the approval steps for each position level. The approval chain will follow the
          ERF designation automatically and use the step order defined here.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from '#imports'

import { useLocale } from '@/composables/useLocale'
import {
  formatApprovalFlowTitle,
  parseDesignationApprovalFlowKey,
} from '@/domain/utils/approvalFlowConfig'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import { useApproverMasterViewModel } from '@/viewmodels/useApproverMasterViewModel'
import { supabase } from '@/infrastructure/supabase/client'

const router = useRouter()
const { text } = useLocale()
const { approvers, loading, error } = useApproverMasterViewModel()
const designationLabelsById = ref<Record<string, string>>({})

const flowSummaries = computed(() => {
  const flowKeys = new Set(
    approvers.value
      .map((approver) => String(approver.approval_flow_key ?? '').trim())
      .filter((flowKey) => parseDesignationApprovalFlowKey(flowKey).length > 0),
  )

  return Array.from(flowKeys).map((flowKey) => {
    const steps = approvers.value
      .filter((item) => item.approval_flow_key === flowKey)
      .sort((left, right) => left.step_order - right.step_order)

    const designationIds = parseDesignationApprovalFlowKey(flowKey)
    const designationLabels = designationIds.map(
      (designationId) => designationLabelsById.value[designationId] ?? designationId,
    )

    return {
      key: flowKey,
      designationLabels,
      title: designationLabels.join(' / ') || formatApprovalFlowTitle(flowKey),
      steps,
      isComplete: steps.length > 0 && steps.every((step) => Boolean(step.profile_id)),
    }
  })
})

function goToEdit() {
  router.push('/approver-master/configure')
}

onMounted(async () => {
  const designationResult = await supabase.from('master_designation').select('id, name')

  if (!designationResult.error) {
    designationLabelsById.value = Object.fromEntries(
      (designationResult.data ?? [])
        .map((item: any) => [String(item.id ?? '').trim(), String(item.name ?? '').trim()])
        .filter(([id, name]: [string, string]) => id && name),
    )
  }
})
</script>
