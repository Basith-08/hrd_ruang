<template>
  <AppPanelCard container-class="overflow-hidden p-0">
    <template #header>
      <div
        class="finder-header flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <p class="app-fieldset-label">{{ finderViewLabel }}</p>
          <p class="app-section-title-compact mt-2 text-lg">
            {{ statsLabel }}
          </p>
        </div>
        <p class="app-copy-body max-w-2xl">
          {{ description }}
        </p>
      </div>
    </template>

    <div class="finder-shell">
      <div
        v-if="loading"
        class="app-copy-body flex min-h-[420px] items-center justify-center"
      >
        {{ loadingLabel }}
      </div>

      <div
        v-else-if="!(tree.children?.length ?? 0)"
        class="app-copy-body flex min-h-[420px] items-center justify-center px-6 text-center"
      >
        {{ emptyLabel }}
      </div>

      <Finder v-else :key="finderResetKey" :tree="tree" :scroll-animation-duration="150">
        <template #item="{ item }">
          <button
            v-if="isFileNode(item)"
            type="button"
            class="finder-file-row flex w-full items-center gap-2 text-left"
            :disabled="openingFileIds.includes(item.id)"
            @click.stop="openFile(item)"
          >
            <span
              v-if="openingFileIds.includes(item.id)"
              class="finder-file-overlay"
            >
              <span class="finder-file-overlay__content">
                <LoaderCircle class="h-3.5 w-3.5 animate-spin" />
                <span>{{ openingFileLabel }}</span>
              </span>
            </span>
            <component
              :is="item.fileKind === 'image' ? ImageIcon : FileText"
              class="finder-node-icon h-4 w-4 shrink-0"
            />
            <span class="truncate">{{ item.label }}</span>
          </button>

          <div v-else class="flex items-center gap-2">
            <Folder class="finder-node-icon-muted h-4 w-4 shrink-0" />
            <span class="truncate">{{ item.label }}</span>
          </div>
        </template>
      </Finder>
    </div>
  </AppPanelCard>
</template>

<script setup lang="ts">
import { Finder } from '@jledentu/vue-finder'
import '@jledentu/vue-finder/dist/vue-finder.css'
import { FileText, Folder, Image as ImageIcon, LoaderCircle } from 'lucide-vue-next'

import type { FinderNode } from '@/features/recruitment/types/RecruitmentDocumentExplorerPage.type'
import AppPanelCard from '@/presentation/components/cards/AppPanelCard.vue'

defineProps<{
  tree: FinderNode
  finderResetKey: number
  loading: boolean
  openingFileIds: string[]
  statsLabel: string
  finderViewLabel: string
  description: string
  loadingLabel: string
  emptyLabel: string
  openingFileLabel: string
  isFileNode: (node: FinderNode) => boolean
  openFile: (node: FinderNode) => void | Promise<void>
}>()
</script>

<style scoped>
.finder-header {
  border-bottom: 1px solid var(--app-color-border-soft);
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--app-color-surface-muted) 78%, white),
    white 45%,
    color-mix(in srgb, var(--app-color-accent-soft) 48%, white)
  );
}

.finder-shell {
  min-height: 640px;
  overflow: hidden;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--app-color-canvas) 95%, white), var(--app-color-surface)),
    linear-gradient(90deg, color-mix(in srgb, var(--app-color-border) 35%, transparent), transparent 30%);
}

.finder-shell :deep(.tree-container) {
  min-height: 640px;
  height: 100%;
  background: transparent;
}

.finder-shell :deep(.list-container) {
  min-height: 640px;
  height: 100%;
}

.finder-shell :deep(.list) {
  min-width: 172px;
  background: transparent;
  border-right: 1px solid var(--app-color-border-soft);
}

.finder-shell :deep(.item) {
  min-height: 34px;
  padding-right: 4px;
  font-size: 0.92rem;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.finder-shell :deep(.item:hover) {
  background: color-mix(in srgb, var(--app-color-accent-soft) 70%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--app-color-accent-border) 68%, transparent);
}

.finder-shell :deep(.item .inner-item) {
  padding: 5px 6px;
}

.finder-shell :deep(.arrow) {
  width: 5px;
  height: 5px;
  border-right-width: 2px;
  border-bottom-width: 2px;
}

.finder-shell :deep(.item:hover .arrow) {
  border-color: var(--app-color-accent);
}

.finder-shell :deep(.item.expanded) {
  background: linear-gradient(
    135deg,
    var(--app-color-accent),
    color-mix(in srgb, var(--app-color-accent) 72%, var(--app-color-accent-border))
  );
  box-shadow: none;
}

.finder-shell :deep(.item.expanded:hover) {
  background: linear-gradient(
    135deg,
    var(--app-color-accent-strong),
    color-mix(in srgb, var(--app-color-accent-strong) 72%, var(--app-color-accent))
  );
}

.finder-shell :deep(.item.expanded:hover .arrow) {
  border-color: var(--app-color-text-inverse);
}

.finder-shell :deep(.inner-item) {
  overflow: hidden;
}

.finder-file-row {
  position: relative;
  font: inherit;
  border-radius: var(--app-radius-sm);
  padding: 1px 3px;
  cursor: pointer;
  transition:
    background-color 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.finder-file-row:disabled {
  cursor: not-allowed;
  opacity: 1;
}

.finder-file-row :deep(svg) {
  flex-shrink: 0;
}

.finder-file-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--app-radius-sm);
  background: color-mix(in srgb, var(--app-color-surface) 82%, transparent);
  backdrop-filter: blur(1.5px);
}

.finder-file-overlay__content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-color-accent-soft) 92%, var(--app-color-surface));
  color: var(--app-color-accent-strong);
  font-size: 11px;
  font-weight: 600;
}

.finder-file-row:hover:not(:disabled) {
  background: color-mix(in srgb, var(--app-color-accent-soft) 70%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--app-color-accent-border) 72%, transparent);
}

.finder-file-row:hover:not(:disabled) :deep(svg) {
  color: var(--app-color-accent);
}

.finder-node-icon {
  color: var(--app-color-text-muted);
}

.finder-node-icon-muted {
  color: var(--app-color-text-soft);
}

@media (max-width: 1279px) {
  .finder-shell {
    min-height: 420px;
  }

  .finder-shell :deep(.tree-container),
  .finder-shell :deep(.list-container) {
    min-height: 420px;
  }
}
</style>
