<template>
  <th
    ref="elRef"
    :data-column-key="columnKey"
    :style="widthStyle"
    :class="['relative', { 'opacity-40': isDragging }]"
  >
    <slot :is-dragging="isDragging" />
    <span
      class="group absolute right-0 top-0 z-10 flex h-full w-3 -translate-x-1/2 cursor-col-resize touch-none select-none items-center justify-center"
      @pointerdown="onResizeStart"
    >
      <span
        class="absolute inset-y-1.5 left-1/2 w-px -translate-x-1/2 bg-slate-300 transition group-hover:bg-sky-400"
      />
      <ChevronsLeftRight
        class="relative h-3 w-3 text-slate-300 transition group-hover:text-sky-500"
      />
    </span>
  </th>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { ChevronsLeftRight } from 'lucide-vue-next'
import { makeDraggable } from '@vue-dnd-kit/core'

const MIN_WIDTH_PX = 80

const props = defineProps<{
  /** Stable identifier of this column within `order`. */
  columnKey: string
  /** Full, live list of column keys (in current order) shared by every header cell. */
  order: string[]
  /** Current width in pixels. Undefined means natural (auto) width. */
  width?: number
  /** CSS selector (scoped to this cell) that activates dragging. Defaults to the grip handle. */
  dragHandle?: string
}>()

const emit = defineEmits<{
  (event: 'reorder', order: string[]): void
  (event: 'resize', width: number): void
}>()

const elRef = ref<HTMLElement | null>(null)

const widthStyle = computed(() => {
  if (props.width === undefined) return undefined
  return { width: `${props.width}px`, minWidth: `${props.width}px`, maxWidth: `${props.width}px` }
})

const { isDragging } = makeDraggable(
  elRef,
  {
    dragHandle: props.dragHandle ?? '[data-column-drag-handle]',
    events: {
      onSelfDragEnd(event) {
        const point = event.provider.pointer.value?.current
        if (!point) return

        const targetKey = document
          .elementFromPoint(point.x, point.y)
          ?.closest<HTMLElement>('[data-column-key]')?.dataset.columnKey

        if (!targetKey || targetKey === props.columnKey) return

        const next = [...props.order]
        const fromIndex = next.indexOf(props.columnKey)
        const toIndex = next.indexOf(targetKey)
        if (fromIndex === -1 || toIndex === -1) return

        const fromValue = next[fromIndex]
        const toValue = next[toIndex]
        if (fromValue === undefined || toValue === undefined) return

        next[fromIndex] = toValue
        next[toIndex] = fromValue
        emit('reorder', next)
      },
    },
  },
  () => [props.order.indexOf(props.columnKey), props.order],
)

let resizeStartX = 0
let resizeStartWidth = 0

function onResizeStart(event: PointerEvent) {
  event.preventDefault()
  event.stopPropagation()

  resizeStartX = event.clientX
  resizeStartWidth = props.width ?? elRef.value?.getBoundingClientRect().width ?? MIN_WIDTH_PX

  document.addEventListener('pointermove', onResizeMove)
  document.addEventListener('pointerup', onResizeEnd)
}

function onResizeMove(event: PointerEvent) {
  const next = Math.max(MIN_WIDTH_PX, Math.round(resizeStartWidth + (event.clientX - resizeStartX)))
  emit('resize', next)
}

function onResizeEnd() {
  document.removeEventListener('pointermove', onResizeMove)
  document.removeEventListener('pointerup', onResizeEnd)
}

onBeforeUnmount(onResizeEnd)
</script>
