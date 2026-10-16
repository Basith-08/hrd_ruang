<template>
  <div class="mx-auto flex max-w-6xl flex-col gap-8 pb-12">
    <div class="flex items-center gap-4">
      <AppActionButton label="Back" variant="icon" @click="router.back()"> ← </AppActionButton>
      <div>
        <p class="app-page-eyebrow">Master Data</p>
        <h1 class="app-section-title mt-1">Approver Configuration</h1>
      </div>
    </div>

    <AppAlert :message="error" />

    <div v-if="loading" class="app-page-description py-20 text-center">Loading data...</div>

    <form v-else class="space-y-8" @submit.prevent="handleSubmit">
      <section class="app-surface-card space-y-5">
        <div>
          <p class="app-fieldset-label">Approval Flow — Designation (New)</p>
          <h2 class="app-surface-title mt-2">Add Designation Flow</h2>
          <p class="app-page-description mt-2">
            Select one or more designation. This creates a flow with prefix
            <code>designations:</code> used by ERF with master_designation_id.
          </p>
        </div>

        <template v-if="designationOptions.length > 0">
          <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <SearchableSelect
              :model-value="pendingDesignationId"
              :options="designationOptions"
              placeholder="Available designations"
              show-empty-option
              empty-label="Choose designation"
              class="w-full min-w-0"
              @update:model-value="pendingDesignationId = String($event ?? '')"
            />
            <AppActionButton
              label="Add Designation"
              variant="secondary"
              class="w-full justify-center lg:w-auto"
              @click="addPendingDesignation"
            />
          </div>
        </template>

        <div v-else class="app-state-card app-state-card-neutral">
          <p class="app-copy-strong">All designations are already mapped to an approval flow.</p>
        </div>

        <div v-if="pendingFlowDesignations.length > 0" class="flex flex-wrap gap-2">
          <span v-for="d in pendingFlowDesignations" :key="d.id" class="app-badge-muted">
            {{ d.label }}
            <button type="button" class="ml-2 text-inherit" @click="removePendingDesignation(d.id)">
              ×
            </button>
          </span>
        </div>

        <div class="flex justify-end">
          <AppActionButton
            label="Create Designation Flow"
            variant="primary"
            :disabled="pendingFlowDesignations.length === 0"
            @click="addDesignationFlow"
          />
        </div>
      </section>

      <section v-for="flow in formFlows" :key="flow.key" class="app-surface-card">
        <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="app-fieldset-label">Approval Flow — Designation</p>
            <h2 class="app-surface-title mt-2">{{ flow.title }}</h2>
            <div class="mt-2 flex flex-wrap gap-2">
              <span v-for="desId in flow.designationIds" :key="desId" class="app-badge-muted">
                {{ designationLabelById.get(desId) ?? desId }}
                <button
                  type="button"
                  class="ml-2 text-inherit"
                  @click="removeFlowDesignation(flow.key, desId)"
                >
                  ×
                </button>
              </span>
            </div>
          </div>

          <AppActionButton
            label="Add Step"
            variant="secondary"
            :disabled="flow.steps.length >= maxApprovalStepCount"
            @click="addStep(flow.key)"
          />
        </div>

        <div class="grid gap-5 lg:grid-cols-3">
          <div
            v-for="(step, stepIndex) in flow.steps"
            :key="step.local_key"
            class="app-surface-card app-surface-card-muted space-y-4 p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="app-fieldset-label">Step {{ step.step_order }}</p>
                <p class="app-card-title mt-1">
                  {{ step.approval_role_label || `Approval Step ${step.step_order}` }}
                </p>
              </div>

              <div class="flex gap-2">
                <button
                  type="button"
                  class="app-button app-button-secondary !min-h-0 !px-3 !py-2 !text-xs"
                  :disabled="stepIndex === 0"
                  @click="moveStep(flow.key, step.local_key, -1)"
                >
                  Up
                </button>
                <button
                  type="button"
                  class="app-button app-button-secondary !min-h-0 !px-3 !py-2 !text-xs"
                  :disabled="stepIndex === flow.steps.length - 1"
                  @click="moveStep(flow.key, step.local_key, 1)"
                >
                  Down
                </button>
                <button
                  type="button"
                  class="app-button app-button-danger-subtle !min-h-0 !px-3 !py-2 !text-xs"
                  :disabled="flow.steps.length === 1"
                  @click="removeStep(flow.key, step.local_key)"
                >
                  Delete
                </button>
              </div>
            </div>

            <label class="block space-y-2">
              <span class="app-fieldset-label"> Step Label </span>
              <input
                v-model.trim="step.approval_role_label"
                type="text"
                class="app-field"
                maxlength="80"
                required
              />
            </label>

            <label class="block space-y-2">
              <span class="app-fieldset-label"> Approver </span>
              <SearchableSelect
                :model-value="step.profile_id"
                :options="employeeOptions"
                placeholder="Search approver"
                show-empty-option
                empty-label="Select approver"
                class="w-full"
                @update:model-value="step.profile_id = String($event ?? '')"
              />
            </label>

            <p class="app-helper-text">
              {{ getSelectedEmployee(step.profile_id)?.email || 'No email selected.' }}
            </p>
          </div>
        </div>
      </section>

      <div class="sticky bottom-4 flex justify-end gap-4">
        <AppActionButton
          label="Cancel"
          class="!px-8 !py-4"
          variant="secondary"
          :disabled="saving"
          @click="router.back()"
        />
        <AppActionButton
          label="Save All Configuration"
          loading-label="Saving Changes..."
          class="!px-6 !py-4"
          type="submit"
          variant="primary"
          :disabled="saving"
          :loading="saving"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from '#imports'

import {
  createApproverFormState,
  type ApproverFormState,
} from '@/features/approvals/ApproverMasterFormPage.state'
import type { EmployeeOption } from '@/features/approvals/types/ApproverMasterFormPage.type'
import {
  type ApprovalFlowKey,
  type ApprovalFlowStepTemplate,
  buildDesignationApprovalFlowKey,
  formatApprovalFlowTitle,
  parseDesignationApprovalFlowKey,
} from '@/domain/utils/approvalFlowConfig'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import SearchableSelect from '@/presentation/components/forms/SearchableSelect.vue'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import { useApproverMasterViewModel } from '@/viewmodels/useApproverMasterViewModel'
import { supabase } from '@/infrastructure/supabase/client'

type EditableApproverFormState = ApproverFormState & {
  local_key: string
  source_flow_key?: string
}

const maxApprovalStepCount = 3

const router = useRouter()
const appToast = useAppToast()
const { approvers, loading, error, saving, create, update, refresh, remove } =
  useApproverMasterViewModel()
const employees = ref<EmployeeOption[]>([])
const designations = ref<Array<{ id: string; label: string }>>([])
const pendingDesignationId = ref('')
const pendingFlowDesignationIds = ref<string[]>([])
const deletedFlowSourceKeys = ref<string[]>([])
const flowStateByKey = reactive<Record<string, EditableApproverFormState[]>>({})

let localStepSequence = 0

const designationLabelById = computed(() => new Map(designations.value.map((d) => [d.id, d.label])))
const assignedCustomDesignationIds = computed(
  () =>
    new Set(
      Object.keys(flowStateByKey).flatMap((flowKey) => parseDesignationApprovalFlowKey(flowKey)),
    ),
)
const employeeOptions = computed(() =>
  employees.value.map((employee) => ({
    value: employee.id,
    label: employee.label,
  })),
)
const coveredDesignationIds = computed(
  () => new Set(Array.from(assignedCustomDesignationIds.value)),
)
const designationOptions = computed(() =>
  designations.value
    .filter(
      (d) =>
        !coveredDesignationIds.value.has(d.id) || pendingFlowDesignationIds.value.includes(d.id),
    )
    .map((d) => ({ value: d.id, label: d.label })),
)
const pendingFlowDesignations = computed(() =>
  pendingFlowDesignationIds.value
    .map((id) => designations.value.find((d) => d.id === id))
    .filter((d): d is { id: string; label: string } => Boolean(d)),
)

const formFlows = computed(() => {
  return Object.keys(flowStateByKey).map((flowKey) => {
    const designationIds = parseDesignationApprovalFlowKey(flowKey)
    return {
      designationIds,
      key: flowKey,
      title:
        designationIds.map((id) => designationLabelById.value.get(id) ?? id).join(' / ') ||
        formatApprovalFlowTitle(flowKey),
      steps: flowStateByKey[flowKey] ?? [],
    }
  })
})

function nextLocalKey(prefix: string) {
  localStepSequence += 1
  return `${prefix}:${localStepSequence}`
}

function normalizeRoleKeySegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function buildGeneratedRoleKey(flowKey: ApprovalFlowKey, localKey: string) {
  const normalizedLocalKey = normalizeRoleKeySegment(localKey) || 'step'
  return `${flowKey}_${normalizedLocalKey}`
}

function buildDefaultStepLabel(stepOrder: number) {
  return `Approval Step ${stepOrder}`
}

function ensureFlowState(flowKey: string) {
  if (!Array.isArray(flowStateByKey[flowKey])) {
    flowStateByKey[flowKey] = []
  }
}

function createEditableFormState(
  flowKey: ApprovalFlowKey,
  step: ApprovalFlowStepTemplate,
  overrides?: Partial<EditableApproverFormState>,
): EditableApproverFormState {
  const localKey = overrides?.local_key || nextLocalKey(flowKey)
  const base = createApproverFormState(flowKey, {
    stepOrder: step.stepOrder,
    roleKey: overrides?.approval_role_key || buildGeneratedRoleKey(flowKey, localKey),
    label: overrides?.approval_role_label || step.label,
  })

  return {
    ...base,
    ...overrides,
    approval_role_key: overrides?.approval_role_key || base.approval_role_key,
    approval_role_label: overrides?.approval_role_label || base.approval_role_label,
    local_key: localKey,
    source_flow_key: overrides?.source_flow_key || flowKey,
  }
}

function normalizeFlowStepOrders(flowKey: ApprovalFlowKey) {
  ensureFlowState(flowKey)
  const steps = flowStateByKey[flowKey] ?? []
  steps.forEach((step, index) => {
    step.step_order = index + 1
  })
}

function createCustomStep(flowKey: ApprovalFlowKey, stepOrder: number) {
  const localKey = nextLocalKey(`${flowKey}-custom`)

  return createEditableFormState(
    flowKey,
    {
      stepOrder,
      roleKey: buildGeneratedRoleKey(flowKey, localKey),
      label: buildDefaultStepLabel(stepOrder),
    },
    {
      local_key: localKey,
      profile_id: '',
    },
  )
}

function initializeFlowState() {
  const customFlowKeys = Array.from(
    new Set(
      approvers.value
        .map((item) => String(item.approval_flow_key ?? '').trim())
        .filter(Boolean)
        .filter((flowKey) => parseDesignationApprovalFlowKey(flowKey).length > 0),
    ),
  )

  for (const flowKey of customFlowKeys) {
    ensureFlowState(flowKey)
    const existingSteps = approvers.value
      .filter((item) => item.approval_flow_key === flowKey)
      .sort((left, right) => left.step_order - right.step_order)

    flowStateByKey[flowKey] = existingSteps.map((item, index) =>
      createEditableFormState(
        flowKey,
        {
          stepOrder: index + 1,
          roleKey: item.approval_role_key,
          label: item.approval_role_label || buildDefaultStepLabel(index + 1),
        },
        {
          id: item.id,
          local_key: `saved:${item.id}`,
          profile_id: item.profile_id,
          step_order: index + 1,
          approval_flow_key: flowKey,
          source_flow_key: flowKey,
          approval_role_key: item.approval_role_key,
          approval_role_label: item.approval_role_label || buildDefaultStepLabel(index + 1),
        },
      ),
    )
  }
}

function addDesignationFlow() {
  const flowKey = buildDesignationApprovalFlowKey(pendingFlowDesignationIds.value)
  if (!flowKey) {
    appToast.error('Select at least one designation first.')
    return
  }

  if (Array.isArray(flowStateByKey[flowKey])) {
    appToast.error('Approval flow for this designation already exists.')
    return
  }

  flowStateByKey[flowKey] = [createCustomStep(flowKey, 1)]
  pendingFlowDesignationIds.value = []
  pendingDesignationId.value = ''
}

function addPendingDesignation() {
  const id = String(pendingDesignationId.value ?? '').trim()
  if (!id) {
    appToast.error('Select a designation first.')
    return
  }

  if (pendingFlowDesignationIds.value.includes(id)) {
    pendingDesignationId.value = ''
    return
  }

  if (coveredDesignationIds.value.has(id)) {
    appToast.error('This designation already has an approval flow.')
    return
  }

  pendingFlowDesignationIds.value = [...pendingFlowDesignationIds.value, id]
  pendingDesignationId.value = ''
}

function removePendingDesignation(id: string) {
  pendingFlowDesignationIds.value = pendingFlowDesignationIds.value.filter((item) => item !== id)
}

function removeFlowDesignation(flowKey: string, designationId: string) {
  const currentDesignationIds = parseDesignationApprovalFlowKey(flowKey)
  if (!currentDesignationIds.includes(designationId)) return

  const nextDesignationIds = currentDesignationIds.filter((item) => item !== designationId)
  if (nextDesignationIds.length === 0) {
    deleteCustomFlow(flowKey)
    appToast.success('Approval flow removed from draft. Save changes to apply.')
    return
  }

  const nextFlowKey = buildDesignationApprovalFlowKey(nextDesignationIds)
  if (!nextFlowKey) return

  if (nextFlowKey !== flowKey && Array.isArray(flowStateByKey[nextFlowKey])) {
    appToast.error('Another approval flow already uses that designation combination.')
    return
  }

  const nextSteps = (flowStateByKey[flowKey] ?? []).map((step) => ({
    ...step,
    approval_flow_key: nextFlowKey,
    source_flow_key: step.source_flow_key || flowKey,
  }))

  flowStateByKey[nextFlowKey] = nextSteps
  Reflect.deleteProperty(flowStateByKey, flowKey)
}

function deleteCustomFlow(flowKey: string) {
  const sourceFlowKeys = Array.from(
    new Set(
      (flowStateByKey[flowKey] ?? [])
        .map((step) => String(step.source_flow_key ?? flowKey).trim())
        .filter(Boolean),
    ),
  )
  deletedFlowSourceKeys.value = Array.from(
    new Set([...deletedFlowSourceKeys.value, ...sourceFlowKeys]),
  )
  Reflect.deleteProperty(flowStateByKey, flowKey)
}

async function loadEmployees() {
  const { data, error: loadError } = await supabase
    .from('profiles')
    .select(
      `
      id, full_name, username, email, main_position,
      master_designation_ref:master_designation(name)
    `,
    )
    .order('full_name', { ascending: true })

  if (loadError) {
    return
  }

  employees.value = (data ?? []).map((employee: any) => {
    const fullName = String(employee.full_name ?? employee.username ?? '').trim() || 'Unnamed'
    const position = String(
      employee.main_position ?? employee.master_designation_ref?.name ?? employee.username ?? '',
    ).trim()

    return {
      id: employee.id,
      label: position ? `${fullName} - ${position}` : fullName,
      rawName: fullName,
      rawPosition: position,
      email: employee.email ?? null,
    }
  })
}

async function loadDesignations() {
  const { data, error: loadError } = await supabase
    .from('master_designation')
    .select('id, name')
    .order('name', { ascending: true })

  if (loadError) {
    return
  }

  designations.value = (data ?? [])
    .map((d: any) => ({
      id: String(d.id ?? '').trim(),
      label: String(d.name ?? '').trim(),
    }))
    .filter((d: { id: string; label: string }) => d.id && d.label)
}

function getSelectedEmployee(profileId?: string) {
  return employees.value.find((employee) => employee.id === profileId) ?? null
}

function addStep(flowKey: ApprovalFlowKey) {
  const steps = flowStateByKey[flowKey] ?? []
  if (steps.length >= maxApprovalStepCount) {
    appToast.error(`Maximum ${maxApprovalStepCount} approval steps per flow.`)
    return
  }

  steps.push(createCustomStep(flowKey, steps.length + 1))
  flowStateByKey[flowKey] = steps
  normalizeFlowStepOrders(flowKey)
}

function moveStep(flowKey: ApprovalFlowKey, localKey: string, direction: -1 | 1) {
  const steps = flowStateByKey[flowKey] ?? []
  const index = steps.findIndex((step) => step.local_key === localKey)
  const targetIndex = index + direction

  if (index < 0 || targetIndex < 0 || targetIndex >= steps.length) {
    return
  }

  ;[steps[index], steps[targetIndex]] = [
    steps[targetIndex] as EditableApproverFormState,
    steps[index] as EditableApproverFormState,
  ]
  normalizeFlowStepOrders(flowKey)
}

function removeStep(flowKey: ApprovalFlowKey, localKey: string) {
  const steps = flowStateByKey[flowKey] ?? []
  if (steps.length === 1) {
    appToast.error('Each flow must keep at least one approval step.')
    return
  }

  flowStateByKey[flowKey] = steps.filter((step) => step.local_key !== localKey)
  normalizeFlowStepOrders(flowKey)
}

function buildPayload(form: EditableApproverFormState, stepOrder: number): ApproverFormState {
  return {
    profile_id: form.profile_id,
    step_order: stepOrder,
    approval_flow_key: form.approval_flow_key,
    approval_role_key:
      String(form.approval_role_key ?? '').trim() ||
      buildGeneratedRoleKey(form.approval_flow_key, form.local_key),
    approval_role_label:
      String(form.approval_role_label ?? '').trim() || buildDefaultStepLabel(stepOrder),
  }
}

async function persistFlow(flowKey: ApprovalFlowKey) {
  const currentFlowSteps = flowStateByKey[flowKey] ?? []
  const currentForms = currentFlowSteps.map((form, index) => ({
    ...form,
    step_order: index + 1,
  }))
  const sourceFlowKeys = Array.from(
    new Set(
      currentForms.map((form) => String(form.source_flow_key ?? flowKey).trim()).filter(Boolean),
    ),
  )
  const existingApprovers = approvers.value.filter((item) =>
    sourceFlowKeys.includes(String(item.approval_flow_key ?? '').trim()),
  )
  const keptIds = new Set(currentForms.map((form) => form.id).filter(Boolean))
  const removedApprovers = existingApprovers.filter((item) => !keptIds.has(item.id))
  const persistedForms = currentForms.filter((form) => Boolean(form.id))
  let tempStepOrder = 1000

  for (const form of persistedForms) {
    await update(form.id as string, buildPayload(form, tempStepOrder), { refresh: false })
    tempStepOrder += 1
  }

  for (const approver of removedApprovers) {
    await remove(approver.id, { refresh: false })
  }

  for (const form of currentForms) {
    const payload = buildPayload(form, form.step_order)

    if (form.id) {
      await update(form.id, payload, { refresh: false })
      continue
    }

    await create(payload, { refresh: false })
  }
}

async function persistDeletedFlows(activeSourceFlowKeys: Set<string>) {
  const flowKeysToDelete = deletedFlowSourceKeys.value.filter(
    (flowKey) => !activeSourceFlowKeys.has(flowKey),
  )
  if (flowKeysToDelete.length === 0) {
    return
  }

  const approversToDelete = approvers.value.filter((item) =>
    flowKeysToDelete.includes(String(item.approval_flow_key ?? '').trim()),
  )

  for (const approver of approversToDelete) {
    await remove(approver.id, { refresh: false })
  }
}

function validateForms() {
  for (const flow of formFlows.value) {
    const steps = flow.steps

    if (steps.length === 0) {
      return 'Each flow must have at least one approval step.'
    }

    if (steps.length > maxApprovalStepCount) {
      return `Maximum ${maxApprovalStepCount} approval steps per flow.`
    }

    if (steps.some((step) => !String(step.approval_role_label ?? '').trim())) {
      return 'Every approval step must have a label.'
    }

    if (steps.some((step) => !step.profile_id)) {
      return 'All approval steps must be configured first.'
    }
  }

  return ''
}

async function handleSubmit() {
  const validationError = validateForms()
  if (validationError) {
    appToast.error(validationError)
    return
  }

  try {
    for (const flow of formFlows.value) {
      await persistFlow(flow.key)
    }

    const activeSourceFlowKeys = new Set(
      formFlows.value.flatMap((flow) =>
        flow.steps.map((step) => String(step.source_flow_key ?? flow.key).trim()).filter(Boolean),
      ),
    )
    await persistDeletedFlows(activeSourceFlowKeys)

    await refresh()
    deletedFlowSourceKeys.value = []
    appToast.success('Configuration updated successfully.')
    router.push('/approver-master')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save configuration.'
    appToast.error(message)
  }
}

onMounted(async () => {
  if (approvers.value.length === 0) {
    await refresh()
  }

  await loadDesignations()
  await loadEmployees()
  initializeFlowState()
})
</script>
