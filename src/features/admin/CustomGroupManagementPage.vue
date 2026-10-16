<template>
  <div class="flex w-full flex-col gap-4">
    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-8">
        <div class="max-w-3xl">
          <p class="app-dashboard-eyebrow">
            {{ text('customGroups.page.eyebrow') }}
          </p>
          <h1 class="app-dashboard-title mt-3">
            {{ text('customGroups.page.title') }}
          </h1>
          <p class="app-dashboard-copy mt-3 max-w-2xl">
            {{ text('customGroups.page.description') }}
          </p>
        </div>
      </div>
    </section>

    <AppTabs
      :model-value="activeTab"
      :tabs="customGroupTabs"
      @update:model-value="activeTab = Number($event)"
    />

    <section class="app-dashboard-panel">
      <div class="p-5">
        <div class="flex flex-col gap-5">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between xl:gap-8">
            <div class="min-w-0 max-w-2xl flex-1">
              <h2 class="app-dashboard-title !mt-0 !text-[1.15rem]">
                {{ text('customGroups.page.listTitle', { index: activeTab }) }}
              </h2>
            </div>

            <div class="flex flex-col gap-2 sm:flex-row xl:flex-none">
              <AppActionButton
                :label="text('common.actions.refresh')"
                variant="secondary"
                :disabled="loading"
                @click="handleRefresh"
              />
              <AppActionButton
                :label="text('customGroups.page.addItem')"
                variant="primary"
                @click="openCreateModal"
              />
            </div>
          </div>

          <AppLoadingState
            v-if="loading"
            :message="text('customGroups.page.loading')"
          />

          <CustomGroupTable
            v-else
            :items="pagedItems"
            :page="page"
            :page-size="pageSize"
            :total-items="items.length"
            :empty-message="text('customGroups.page.empty', { index: activeTab })"
            :edit-label="text('customGroups.page.edit')"
            :delete-label="text('customGroups.page.delete')"
            @update:page="page = $event"
            @edit="openEditModal"
            @delete="handleDelete"
          />
        </div>
      </div>
    </section>

    <CustomGroupFormModal
      :open="showModal"
      :title="editingItem ? text('customGroups.modal.editTitle') : text('customGroups.modal.createTitle')"
      :name="form.name"
      :description="form.description"
      :saving="saving"
      :name-label="text('customGroups.modal.name')"
      :name-placeholder="text('customGroups.modal.namePlaceholder')"
      :description-label="text('customGroups.modal.description')"
      :description-placeholder="text('customGroups.modal.descriptionPlaceholder')"
      :cancel-label="text('customGroups.modal.cancel')"
      :save-label="text('customGroups.modal.save')"
      :saving-label="text('customGroups.modal.saving')"
      @update:name="form.name = $event"
      @update:description="form.description = $event"
      @cancel="showModal = false"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch, reactive } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { customGroupRepo } from '@/infrastructure/supabase/repositories/CustomGroupRepositoryImpl'
import type { CustomGroup } from '@/domain/entities/CustomGroup'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppLoadingState from '@/presentation/components/feedback/AppLoadingState.vue'
import { useAppConfirm } from '@/presentation/components/feedback/useAppConfirm'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import CustomGroupFormModal from './components/CustomGroupFormModal.vue'
import CustomGroupTable from './components/CustomGroupTable.vue'
import AppTabs from '@/presentation/components/navigation/AppTabs.vue'

const activeTab = ref(1)
const items = ref<CustomGroup[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingItem = ref<CustomGroup | null>(null)
const appToast = useAppToast()
const appConfirm = useAppConfirm()
const { text } = useLocale()
const page = ref(1)
const pageSize = 10
const customGroupTabs = computed(() =>
  Array.from({ length: 6 }, (_, index) => {
    const tabIndex = index + 1

    return {
      value: tabIndex,
      label: text('customGroups.page.tabLabel', { index: tabIndex }),
    }
  }),
)

const form = reactive({
  name: '',
  description: ''
})

const totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / pageSize)))
const pagedItems = computed(() => {
  const safePage = Math.min(Math.max(page.value, 1), totalPages.value)
  const start = (safePage - 1) * pageSize
  return items.value.slice(start, start + pageSize)
})

async function fetchItems() {
  loading.value = true
  try {
    items.value = await customGroupRepo.getAll(activeTab.value)
  } catch (err) {
    appToast.error(text('customGroups.toast.loadFailed'))
  } finally {
    loading.value = false
  }
}

async function handleRefresh() {
  await fetchItems()
}

watch(activeTab, () => {
  page.value = 1
  fetchItems()
})
watch(
  () => items.value.length,
  () => {
    if (page.value > totalPages.value) page.value = totalPages.value
  },
)

onMounted(fetchItems)

function openCreateModal() {
  editingItem.value = null
  form.name = ''
  form.description = ''
  showModal.value = true
}

function openEditModal(item: CustomGroup) {
  editingItem.value = item
  form.name = item.name
  form.description = item.description || ''
  showModal.value = true
}

async function handleSubmit() {
  saving.value = true
  try {
    if (editingItem.value) {
      await customGroupRepo.update(activeTab.value, editingItem.value.id, {
        name: form.name,
        description: form.description
      })
      appToast.updated(text('customGroups.toast.entryLabel', { index: activeTab.value }))
    } else {
      await customGroupRepo.create(activeTab.value, {
        name: form.name,
        description: form.description
      })
      appToast.created(text('customGroups.toast.entryLabel', { index: activeTab.value }))
    }
    showModal.value = false
    page.value = 1
    fetchItems()
  } catch (err) {
    appToast.error(text('customGroups.toast.saveFailed'))
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: string) {
  const confirmed = await appConfirm.confirm({
    title: text('common.actions.confirm'),
    message: text('customGroups.confirmDelete'),
    confirmLabel: text('common.actions.delete'),
    cancelLabel: text('common.actions.cancel'),
    tone: 'danger',
  })
  if (!confirmed) return
  try {
    await customGroupRepo.delete(activeTab.value, id)
    appToast.deleted(text('customGroups.toast.deletedLabel'))
    fetchItems()
  } catch (err) {
    appToast.error(text('customGroups.toast.deleteFailed'))
  }
}
</script>
