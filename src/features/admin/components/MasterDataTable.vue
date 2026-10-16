<template>
  <AppTable
    :columns="columns"
    :items="items"
    :loading="false"
    :empty-message="emptyMessage"
    table-class="w-full text-left text-sm [table-layout:fixed]"
  >
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

import type { MasterDataItem } from '@/domain/entities/MasterData'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppTable, { type AppTableColumn } from '@/presentation/components/tables/AppTable.vue'
import TablePagination from '@/presentation/components/tables/TablePagination.vue'

const props = defineProps<{
  items: MasterDataItem[]
  page: number
  pageSize: number
  totalItems: number
  emptyMessage: string
  editLabel: string
  deleteLabel: string
  showParentColumn: boolean
  parentLabel: string
  showAddressColumn: boolean
  addressLabel: string
  showRequiredDateLeadTimeColumn: boolean
  requiredDateLeadTimeLabel: string
  formatRequiredDateLeadTime: (value: number | null | undefined) => string
}>()

defineEmits<{
  (event: 'update:page', value: number): void
  (event: 'edit', item: MasterDataItem): void
  (event: 'delete', id: string): void
}>()

const columns = computed<AppTableColumn[]>(() => {
  const baseColumns: AppTableColumn[] = [
    {
      key: 'number',
      label: 'No',
      width: 'w-16',
      formatter: (_item, index) => pageOffset.value + index + 1,
      valueClass: 'app-table-muted',
    },
    {
      key: 'name',
      label: 'Name',
      formatter: (item) => item.name,
      valueClass: 'app-copy-strong',
    },
  ]

  if (props.showParentColumn) {
    baseColumns.push({
      key: 'parent',
      label: props.parentLabel,
      formatter: (item) => item.parent_name || '-',
    })
  }

  if (props.showAddressColumn) {
    baseColumns.push({
      key: 'address',
      label: props.addressLabel,
      formatter: (item) => item.address || '-',
      valueClass: 'break-words',
    })
  }

  if (props.showRequiredDateLeadTimeColumn) {
    baseColumns.push({
      key: 'requiredDateLeadTime',
      label: props.requiredDateLeadTimeLabel,
      formatter: (item) => props.formatRequiredDateLeadTime(item.required_date_min_months),
    })
  }

  baseColumns.push(
    {
      key: 'description',
      label: 'Description',
      formatter: (item) => item.description || '-',
      valueClass: 'break-words',
    },
    { key: 'actions', label: 'Actions', align: 'right' },
  )

  return baseColumns
})

const pageOffset = computed(() => (props.page - 1) * props.pageSize)
</script>
