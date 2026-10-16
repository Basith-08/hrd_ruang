<template>
  <div ref="rootEl" class="relative inline-flex">
    <button
      type="button"
      class="row-actions-menu__trigger"
      :aria-expanded="open ? 'true' : 'false'"
      aria-haspopup="menu"
      :aria-label="text('common.openActionMenu')"
      @click="toggle"
      @keydown.esc.prevent.stop="close"
    >
      <MoreVertical class="h-4 w-4" />
    </button>

    <div
      v-if="open"
      ref="menuEl"
      class="row-actions-menu__panel"
      :style="menuStyle"
      role="menu"
      @keydown.esc.prevent.stop="close"
    >
      <button
        v-for="(action, idx) in actions"
        :key="idx"
        type="button"
        role="menuitem"
        class="row-actions-menu__item"
        :class="
          action.tone === 'danger'
            ? 'row-actions-menu__item--danger'
            : 'row-actions-menu__item--default'
        "
        :disabled="action.disabled"
        @click="handleAction(action)"
      >
        <span class="truncate">{{ action.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useEventListener } from '@vueuse/core'
import { MoreVertical } from 'lucide-vue-next'

import { useLocale } from '@/composables/useLocale'

export type RowAction = {
  label: string
  onClick: () => void | Promise<void>
  disabled?: boolean
  tone?: 'default' | 'danger'
}

const props = defineProps<{
  actions: RowAction[]
}>()
const { text } = useLocale()

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)
const menuEl = ref<HTMLElement | null>(null)
const menuStyle = ref<Record<string, string>>({})

const isAnyActionEnabled = computed(() => props.actions.some((a) => !a.disabled))

function close() {
  open.value = false
}

function toggle() {
  if (!isAnyActionEnabled.value) return
  open.value = !open.value
}

async function handleAction(action: RowAction) {
  if (action.disabled) return
  close()
  await action.onClick()
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

async function updatePosition() {
  if (!open.value) return
  await nextTick()
  const root = rootEl.value
  const menu = menuEl.value
  if (!root || !menu) return

  const button = root.querySelector('button')
  if (!button) return

  const rect = (button as HTMLElement).getBoundingClientRect()
  const menuRect = menu.getBoundingClientRect()
  const padding = 8
  const gap = 8

  const shouldOpenUp = rect.bottom + gap + menuRect.height > window.innerHeight - padding
  const top = shouldOpenUp ? rect.top - gap - menuRect.height : rect.bottom + gap
  const left = rect.right - menuRect.width

  menuStyle.value = {
    top: `${clamp(top, padding, window.innerHeight - padding - menuRect.height)}px`,
    left: `${clamp(left, padding, window.innerWidth - padding - menuRect.width)}px`,
  }
}

watch(open, async (value) => {
  if (!value) return
  await updatePosition()
})

useEventListener(window, 'resize', () => updatePosition())
useEventListener(window, 'scroll', () => updatePosition(), { capture: true })

useEventListener(
  document,
  'pointerdown',
  (event) => {
    if (!open.value) return
    const target = event.target as Node | null
    if (!target) return
    if (rootEl.value?.contains(target)) return
    if (menuEl.value?.contains(target)) return
    close()
  },
  { capture: true },
)

onBeforeUnmount(() => {
  close()
})
</script>

<style scoped>
.row-actions-menu__trigger {
  display: inline-flex;
  height: 2.25rem;
  width: 2.25rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-sm);
  background: var(--app-color-surface);
  color: var(--app-color-text-muted);
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}

.row-actions-menu__trigger:hover {
  background: var(--app-color-surface-muted);
  color: var(--app-color-text);
}

.row-actions-menu__panel {
  position: fixed;
  z-index: 9999;
  width: 14rem;
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-sm);
  background: var(--app-color-surface);
  padding: 0.25rem;
  box-shadow: var(--app-shadow-md);
}

.row-actions-menu__item {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-radius: var(--app-radius-sm);
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-size: var(--app-font-size-sm);
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    opacity 0.2s ease;
}

.row-actions-menu__item:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.row-actions-menu__item--default {
  color: var(--app-color-text-muted);
}

.row-actions-menu__item--default:hover:not(:disabled) {
  background: var(--app-color-surface-muted);
  color: var(--app-color-text);
}

.row-actions-menu__item--danger {
  color: var(--app-color-danger);
}

.row-actions-menu__item--danger:hover:not(:disabled) {
  background: var(--app-color-danger-soft);
}
</style>
