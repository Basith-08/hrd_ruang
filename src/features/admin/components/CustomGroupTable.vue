<template>
  <AppTable
    :columns="columns"
    :items="items"
    :loading="false"
    :empty-message="emptyMessage"
  >
    <template #cell-number="{ index }">
      <span class="app-table-muted">{{ pageOffset + index + 1 }}</span>
    </template>

    <template #cell-name="{ item }">
      <p class="app-copy-strong">{{ item.name }}</p>
    </template>

    <template #cell-description="{ item }">
      <span>{{ item.description || '-' }}</span>
    </template>

    <template #cell-actions="{ item }">
      <div class="flex justify-end gap-2">
        <AppActionButton :label="editLabel" variant="ghost" @click="$emit('edit', item)" />
        <AppActionButton :label="deleteLabel" variant="ghost" @click="$emit('delete', item.id)" />
      </div>
    </template>

    <template v-if="items.length > 0" #pagination>
      <TablePagination
        :page="page"
        :page-size="pageSize"
        :total-items="totalItems"
        @update:page="$emit('update:page', $event)"
      />
    </template>
  </AppTable>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { CustomGroup } from '@/domain/entities/CustomGroup'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppTable, { type AppTableColumn } from '@/presentation/components/tables/AppTable.vue'
import TablePagination from '@/presentation/components/tables/TablePagination.vue'

const props = defineProps<{
  items: CustomGroup[]
  page: number
  pageSize: number
  totalItems: number
  emptyMessage: string
  editLabel: string
  deleteLabel: string
}>()

defineEmits<{
  (event: 'update:page', value: number): void
  (event: 'edit', item: CustomGroup): void
  (event: 'delete', id: string): void
}>()

const columns = computed<AppTableColumn[]>(() => [
  { key: 'number', label: 'No', width: 'w-16' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'actions', label: 'Actions', align: 'right' },
])

const pageOffset = computed(() => (props.page - 1) * props.pageSize)
</script>
