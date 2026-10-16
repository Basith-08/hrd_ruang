<template>
  <div class="flex w-full flex-col gap-4">
    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div class="max-w-3xl">
          <p class="app-dashboard-eyebrow">
            {{ text('masterDataErf.page.eyebrow') }}
          </p>
          <h1 class="app-dashboard-title mt-3">
            {{ text('masterDataErf.page.title') }}
          </h1>
          <p class="app-dashboard-copy mt-3 max-w-2xl">
            {{ text('masterDataErf.page.description') }}
          </p>
        </div>
      </div>
    </section>

    <AppTabs v-model="activeTab" :tabs="masterDataTabs" />

    <section class="app-dashboard-panel">
      <div class="p-5">
        <div class="flex flex-col gap-5">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between xl:gap-8">
            <div class="min-w-0 flex-1 max-w-2xl">
              <h2 class="app-dashboard-title !mt-0 !text-[1.15rem]">
                {{ text('masterDataErf.listTitle', { label: activeLabel }) }}
              </h2>
            </div>

            <div class="flex flex-col gap-2 sm:flex-row xl:flex-none">
              <AppActionButton
                :label="loading ? text('masterDataErf.loading') : 'Refresh'"
                variant="secondary"
                :disabled="loading"
                @click="handleRefresh"
              />
              <AppActionButton
                :label="text('masterDataErf.add', { label: activeLabel })"
                variant="primary"
                @click="openCreateModal"
              />
            </div>
          </div>

          <AppLoadingState
            v-if="loading"
            :message="text('masterDataErf.loading')"
          />

          <template v-else>
            <div class="max-w-xl">
              <label class="block flex-1">
                <span class="app-fieldset-label mb-1.5 block">
                  {{ text('common.labels.search') }}
                </span>
                <AppSearchInput
                  v-model="searchQuery"
                  :placeholder="text('masterDataErf.searchPlaceholder', { label: activeLabel.toLowerCase() })"
                />
              </label>
            </div>

            <MasterDataTable
              :items="pagedActiveItems"
              :page="page"
              :page-size="pageSize"
              :total-items="filteredActiveItems.length"
              :empty-message="text('masterDataErf.empty', { label: activeLabel.toLowerCase() })"
              :edit-label="text('masterDataErf.actions.edit')"
              :delete-label="text('masterDataErf.actions.delete')"
              :show-parent-column="showParentColumn"
              :parent-label="parentLabel"
              :show-address-column="showAddressColumn"
              :address-label="text('masterDataErf.address.column')"
              :show-required-date-lead-time-column="showRequiredDateLeadTimeColumn"
              :required-date-lead-time-label="text('masterDataErf.table.minRequiredDate')"
              :format-required-date-lead-time="formatRequiredDateLeadTime"
              @update:page="page = $event"
              @edit="openEditModal"
              @delete="handleDelete"
            />
          </template>
        </div>
      </div>
    </section>

    <MasterDataFormModal
      :open="showModal"
      :title="editingItem ? text('masterDataErf.edit', { label: activeLabel }) : text('masterDataErf.add', { label: activeLabel })"
      :name="form.name"
      :address="form.address"
      :description="form.description"
      :parent-id="form.parent_id"
      :required-date-min-months="form.required_date_min_months"
      :saving="saving"
      :show-parent-field="showParentField"
      :parent-label="parentLabel"
      :parent-placeholder="parentPlaceholder"
      :parent-options="parentSelectOptions"
      :show-address-field="showAddressField"
      :address-label="text('masterDataErf.address.label')"
      :address-placeholder="text('masterDataErf.address.placeholder')"
      :show-required-date-lead-time-field="showRequiredDateLeadTimeField"
      :required-date-lead-time-label="text('masterDataErf.requiredDate.label')"
      :required-date-lead-time-placeholder="text('masterDataErf.requiredDate.placeholder')"
      :required-date-lead-time-help="text('masterDataErf.requiredDate.help')"
      :name-label="text('masterDataErf.modal.name')"
      :name-placeholder="text('masterDataErf.modal.namePlaceholder', { label: activeLabel.toLowerCase() })"
      :description-label="text('masterDataErf.modal.description')"
      :description-placeholder="text('masterDataErf.modal.descriptionPlaceholder')"
      :cancel-label="text('masterDataErf.modal.cancel')"
      :save-label="text('masterDataErf.modal.save')"
      :saving-label="text('masterDataErf.modal.saving')"
      @update:name="form.name = $event"
      @update:address="form.address = $event"
      @update:description="form.description = $event"
      @update:parent-id="form.parent_id = $event"
      @update:required-date-min-months="form.required_date_min_months = $event"
      @cancel="showModal = false"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useLocale } from '@/composables/useLocale'
import type { MasterDataItem, MasterDataType } from '@/domain/entities/MasterData'
import { useMasterDataViewModel } from '@/viewmodels/useMasterDataViewModel'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppLoadingState from '@/presentation/components/feedback/AppLoadingState.vue'
import AppSearchInput from '@/presentation/components/forms/AppSearchInput.vue'
import { useAppConfirm } from '@/presentation/components/feedback/useAppConfirm'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import AppTabs from '@/presentation/components/navigation/AppTabs.vue'
import MasterDataFormModal from './components/MasterDataFormModal.vue'
import MasterDataTable from './components/MasterDataTable.vue'

const { text } = useLocale()
const masterDataTabs = computed<Array<{ label: string; value: MasterDataType }>>(() => [
  { label: text('masterDataErf.tabs.pt'), value: 'pt' },
  { label: text('masterDataErf.tabs.bu'), value: 'bu' },
  { label: text('masterDataErf.tabs.department'), value: 'department' },
  { label: text('masterDataErf.tabs.jobLevel'), value: 'job_level' },
  { label: text('masterDataErf.tabs.designation'), value: 'designation' },
])

const activeTab = ref<MasterDataType>('pt')
const showModal = ref(false)
const editingItem = ref<MasterDataItem | null>(null)
const searchQuery = ref('')
const page = ref(1)
const pageSize = 10
const form = reactive({
  name: '',
  address: '',
  description: '',
  parent_id: '',
  required_date_min_months: '',
})

const { loading, saving, optionsByType, refreshOptions, loadOptions, create, update, remove } =
  useMasterDataViewModel()
const appToast = useAppToast()
const appConfirm = useAppConfirm()

const activeItems = computed(() => optionsByType.value[activeTab.value])
const activeLabel = computed(() => masterDataTabs.value.find((tab) => tab.value === activeTab.value)?.label ?? 'Item')
const showParentField = computed(() => false)
const showParentColumn = computed(() => showParentField.value)
const showAddressField = computed(() => activeTab.value === 'pt')
const showAddressColumn = computed(() => activeTab.value === 'pt')
const showRequiredDateLeadTimeField = computed(() =>
  activeTab.value === 'job_level' || activeTab.value === 'designation',
)
const showRequiredDateLeadTimeColumn = computed(() =>
  activeTab.value === 'job_level' || activeTab.value === 'designation',
)
const parentLabel = computed(() => {
  if (activeTab.value === 'department') return text('masterDataErf.parent.bu')
  return text('masterDataErf.parent.generic')
})
const parentPlaceholder = computed(() => {
  if (activeTab.value === 'department') return text('masterDataErf.parent.selectBu')
  return text('masterDataErf.parent.selectParent')
})
const parentSelectOptions = computed<Array<{ value: string; label: string }>>(() => [])
const filteredActiveItems = computed(() => {
  const query = normalizeSearchValue(searchQuery.value)
  if (!query) return activeItems.value

  return activeItems.value.filter((item) => {
    const haystack = [
      item.name,
      item.address,
      item.description,
      item.parent_name,
      item.required_date_min_months,
    ]
      .map(normalizeSearchValue)
      .join(' ')

    return haystack.includes(query)
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredActiveItems.value.length / pageSize)))
const pagedActiveItems = computed(() => {
  const safePage = Math.min(Math.max(page.value, 1), totalPages.value)
  const start = (safePage - 1) * pageSize
  return filteredActiveItems.value.slice(start, start + pageSize)
})

function normalizeSearchValue(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
}

function getRequiredTypes(type: MasterDataType): MasterDataType[] {
  return [type]
}

async function handleRefresh() {
  try {
    await refreshOptions(activeTab.value)
  } catch {
    appToast.error(text('masterDataErf.errors.loadType', { label: activeLabel.value.toLowerCase() }))
  }
}

async function ensureActiveTabOptionsLoaded(type: MasterDataType) {
  const requiredTypes = getRequiredTypes(type).filter(
    (requiredType) => optionsByType.value[requiredType].length === 0,
  )

  if (requiredTypes.length === 0) {
    return
  }

  await loadOptions(requiredTypes)
}

watch(activeTab, async (type) => {
  page.value = 1
  searchQuery.value = ''
  try {
    await ensureActiveTabOptionsLoaded(type)
  } catch {
    appToast.error(text('masterDataErf.errors.loadType', { label: activeLabel.value.toLowerCase() }))
  }
})
watch(
  () => filteredActiveItems.value.length,
  () => {
    if (page.value > totalPages.value) page.value = totalPages.value
  },
)
watch(searchQuery, () => {
  page.value = 1
})

onMounted(async () => {
  try {
    await ensureActiveTabOptionsLoaded(activeTab.value)
  } catch {
    appToast.error(text('masterDataErf.errors.loadType', { label: activeLabel.value.toLowerCase() }))
  }
})

function openCreateModal() {
  editingItem.value = null
  form.name = ''
  form.address = ''
  form.description = ''
  form.parent_id = ''
  form.required_date_min_months = ''
  showModal.value = true
}

function openEditModal(item: MasterDataItem) {
  editingItem.value = item
  form.name = item.name
  form.address = item.address || ''
  form.description = item.description || ''
  form.parent_id = item.parent_id || ''
  form.required_date_min_months =
    item.required_date_min_months === null || item.required_date_min_months === undefined
      ? ''
      : String(item.required_date_min_months)
  showModal.value = true
}

function parseRequiredDateLeadTimeMonths() {
  const normalizedValue = String(form.required_date_min_months ?? '').trim()
  if (!normalizedValue) return undefined

  const parsedValue = Number(normalizedValue)
  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw new Error(text('masterDataErf.errors.requiredDateInvalid'))
  }

  return parsedValue
}

function formatRequiredDateLeadTime(value: number | null | undefined) {
  if (value === null || value === undefined) return '-'
  return value === 1
    ? text('masterDataErf.requiredDate.format.single', { value })
    : text('masterDataErf.requiredDate.format.multiple', { value })
}

function normalizeSaveErrorMessage(error: unknown) {
  const fallbackMessage = text('masterDataErf.errors.save', { label: activeLabel.value.toLowerCase() })
  const message = error instanceof Error ? error.message : String(error ?? '')
  const normalizedMessage = message.trim().toLowerCase()

  if (
    normalizedMessage.includes('master_pt_name_key') ||
    normalizedMessage.includes('master_bu_name_key') ||
    normalizedMessage.includes('master_job_level_name_key') ||
    normalizedMessage.includes('duplicate key value violates unique constraint')
  ) {
    return text('masterDataErf.errors.duplicateName', { label: activeLabel.value })
  }

  return message || fallbackMessage
}

async function handleSubmit() {
  try {
    const requiredDateMinMonths = parseRequiredDateLeadTimeMonths()

    if (editingItem.value) {
      await update(activeTab.value, editingItem.value.id, {
        name: form.name,
        address: activeTab.value === 'pt' ? form.address : undefined,
        description: form.description,
        parent_id: form.parent_id || undefined,
        required_date_min_months:
          activeTab.value === 'job_level' || activeTab.value === 'designation'
            ? requiredDateMinMonths ?? null
            : undefined,
      })
      appToast.updated(activeLabel.value)
    } else {
      await create(activeTab.value, {
        name: form.name,
        address: activeTab.value === 'pt' ? form.address : undefined,
        description: form.description,
        parent_id: form.parent_id || undefined,
        required_date_min_months:
          activeTab.value === 'job_level' || activeTab.value === 'designation'
            ? requiredDateMinMonths ?? null
            : undefined,
      })
      appToast.created(activeLabel.value)
    }

    showModal.value = false
    page.value = 1
  } catch (err) {
    appToast.error(normalizeSaveErrorMessage(err))
  }
}

async function handleDelete(id: string) {
  const confirmed = await appConfirm.confirm({
    title: text('common.actions.confirm'),
    message: text('masterDataErf.confirmDelete', { label: activeLabel.value.toLowerCase() }),
    confirmLabel: text('common.actions.delete'),
    cancelLabel: text('common.actions.cancel'),
    tone: 'danger',
  })
  if (!confirmed) return

  try {
    await remove(activeTab.value, id)
    appToast.deleted(activeLabel.value)
  } catch (err) {
    const message = err instanceof Error ? err.message : text('masterDataErf.errors.delete', { label: activeLabel.value.toLowerCase() })
    appToast.error(message)
  }
}
</script>
