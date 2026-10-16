<template>
  <div v-if="$slots.title || $slots.toolbar" class="mb-4 flex items-center justify-between gap-3">
    <div>
      <slot name="title" />
    </div>
    <div>
      <slot name="toolbar" />
    </div>
  </div>

  <div class="app-table-shell">
    <div class="overflow-x-auto">
      <table :class="tableClassName">
        <thead class="app-table-head">
          <tr>
            <th v-for="col in columns" :key="col.key" class="px-4 py-3 font-medium whitespace-nowrap" :class="[
              resolveWidthClass(col),
              resolveMinWidthClass(col),
              col.align === 'right'
                ? 'text-right'
                : col.align === 'center'
                  ? 'text-center'
                  : 'text-left',
            ]">
              <slot :name="`header-${col.key}`" :column="col">
                {{ col.label }}
              </slot>
            </th>
          </tr>
        </thead>

        <tbody class="app-table-body divide-y app-table-divider">
          <template v-if="!loading && items.length > 0">
            <tr v-for="(item, idx) in items" :key="item.id || idx" class="app-table-row">
              <td v-for="col in columns" :key="col.key" class="px-4 py-3 align-middle" :class="[
                col.align === 'right'
                  ? 'text-right'
                  : col.align === 'center'
                    ? 'text-center'
                    : 'text-left',
                resolveCellClass(col, item, idx),
              ]">
                <slot :name="`cell-${col.key}`" :item="item" :index="idx">
                  <span
                    v-if="col.badge"
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
                    :class="resolveBadgeClass(col, item, idx)"
                  >
                    {{ resolveCellValue(col, item, idx) }}
                  </span>
                  <span v-else :class="resolveValueClass(col, item, idx)">
                    {{ resolveCellValue(col, item, idx) }}
                  </span>
                </slot>
              </td>
            </tr>
          </template>

          <tr v-else-if="loading">
            <td :colspan="columns.length" class="px-6 py-20 text-center">
              <div class="app-table-muted flex flex-col items-center justify-center gap-3">
                <svg class="h-8 w-8 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p class="text-xs font-medium">
                  {{ loadingMessage || 'Loading data...' }}
                </p>
              </div>
            </td>
          </tr>

          <tr v-else>
            <td :colspan="columns.length" class="app-table-muted px-6 py-16 text-center text-sm">
              <div class="flex flex-col items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
                  class="opacity-20">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M3 15h18" />
                  <path d="M9 3v18" />
                  <path d="M15 3v18" />
                </svg>
                <p>{{ emptyMessage || 'No matching data found' }}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="$slots.pagination" class="app-table-pagination">
      <slot name="pagination" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { resolveAppTableColumnSizing, type AppTableColumnKind } from '@/presentation/utils/tableColumnSizing'
import { computed } from 'vue'

type AppTableClassResolver = string | ((item: any, index: number) => string)

export interface AppTableColumn {
  key: string
  label: string
  kind?: AppTableColumnKind
  width?: string
  minWidth?: string
  align?: 'left' | 'right' | 'center'
  formatter?: (item: any, index: number) => string | number | null | undefined
  cellClass?: AppTableClassResolver
  valueClass?: AppTableClassResolver
  badge?: boolean
  badgeClass?: AppTableClassResolver
}

const props = withDefaults(defineProps<{
  columns: AppTableColumn[]
  items: any[]
  loading?: boolean
  loadingMessage?: string
  emptyMessage?: string
  tableClass?: string
}>(), {
  loading: false,
  loadingMessage: '',
  emptyMessage: '',
  tableClass: 'min-w-max w-full text-left text-sm',
})

const tableClassName = computed(() => props.tableClass)

function resolveCellValue(col: AppTableColumn, item: any, index: number) {
  return col.formatter?.(item, index) ?? item?.[col.key] ?? '-'
}

function resolveWidthClass(col: AppTableColumn) {
  return resolveAppTableColumnSizing(col).width
}

function resolveMinWidthClass(col: AppTableColumn) {
  return resolveAppTableColumnSizing(col).minWidth
}

function resolveClass(className: AppTableClassResolver | undefined, item: any, index: number) {
  return typeof className === 'function' ? className(item, index) : className
}

function resolveCellClass(col: AppTableColumn, item: any, index: number) {
  return resolveClass(col.cellClass, item, index)
}

function resolveValueClass(col: AppTableColumn, item: any, index: number) {
  return resolveClass(col.valueClass, item, index)
}

function resolveBadgeClass(col: AppTableColumn, item: any, index: number) {
  return resolveClass(col.badgeClass, item, index)
}
</script>
