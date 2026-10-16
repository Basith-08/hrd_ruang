<template>
  <div ref="rootRef" class="relative">
    <input
      v-model="searchTerm"
      type="text"
      class="searchable-field"
      :class="{ 'searchable-field--compact': size === 'compact' }"
      :placeholder="effectivePlaceholder"
      :disabled="disabled"
      autocomplete="off"
      @click="openDropdown"
      @focus="openDropdown"
      @input="handleInput"
    />
  </div>

  <Teleport to="body" :disabled="disableTeleport">
    <ul v-show="isOpen" ref="dropdownRef" class="searchable-dropdown" :style="dropdownStyle">
      <li v-if="loading" class="searchable-dropdown__state">
        {{ effectiveLoadingLabel }}
      </li>
      <template v-else>
        <li
          v-if="showEmptyOption"
          class="searchable-dropdown__item searchable-dropdown__item--muted"
          @click="selectEmpty"
        >
          {{ effectiveEmptyLabel }}
        </li>
        <li
          v-for="option in visibleOptions"
          :key="String(option.value ?? option.label)"
          class="searchable-dropdown__item"
          @click="selectOption(option)"
        >
          {{ option.label }}
        </li>
      </template>
      <li
        v-if="!loading && !showEmptyOption && visibleOptions.length === 0"
        class="searchable-dropdown__state"
      >
        {{ effectiveNoResultsLabel }}
      </li>
    </ul>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { useLocale } from '@/composables/useLocale'

type SelectValue = string | number | null

type SearchableSelectOption = {
  value: SelectValue
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: SelectValue
    options: SearchableSelectOption[]
    placeholder?: string
    disabled?: boolean
    showEmptyOption?: boolean
    emptyLabel?: string
    emptyValue?: SelectValue
    noResultsLabel?: string
    loading?: boolean
    loadingLabel?: string
    size?: 'default' | 'compact'
  }>(),
  {
    disabled: false,
    showEmptyOption: false,
    loading: false,
    emptyValue: '',
    size: 'default',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: SelectValue]
}>()
const { text } = useLocale()
const disableTeleport = import.meta.env.MODE === 'test'

const rootRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const searchTerm = ref('')
const dropdownStyle = ref<Record<string, string>>({})

const selectedOption = computed(
  () => props.options.find((option) => isSameValue(option.value, props.modelValue)) ?? null,
)
const effectivePlaceholder = computed(() => props.placeholder ?? text('common.search.default'))
const effectiveEmptyLabel = computed(() => props.emptyLabel ?? text('common.select.default'))
const effectiveLoadingLabel = computed(() => props.loadingLabel ?? text('common.loading'))
const effectiveNoResultsLabel = computed(
  () => props.noResultsLabel ?? text('common.noMatchingData'),
)

const filteredOptions = computed(() => {
  const query = searchTerm.value.toLowerCase().trim()
  if (!query) return props.options

  return props.options.filter((option) => option.label.toLowerCase().includes(query))
})

const visibleOptions = computed(() => (props.loading ? [] : filteredOptions.value))

watch(
  () => [props.modelValue, props.options],
  () => {
    if (!isOpen.value) {
      searchTerm.value = selectedOption.value?.label ?? ''
    }
  },
  { immediate: true, deep: true },
)

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', updateDropdownPosition)
  window.addEventListener('scroll', updateDropdownPosition, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', updateDropdownPosition)
  window.removeEventListener('scroll', updateDropdownPosition, true)
})

function isSameValue(left: SelectValue, right: SelectValue) {
  return String(left ?? '') === String(right ?? '')
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node
  if (!rootRef.value?.contains(target) && !dropdownRef.value?.contains(target)) {
    closeDropdown()
  }
}

async function openDropdown() {
  if (props.disabled) return
  if (!isOpen.value) {
    searchTerm.value = ''
  }
  isOpen.value = true
  await nextTick()
  updateDropdownPosition()
}

function handleInput() {
  if (props.disabled) return

  isOpen.value = true
  void nextTick(updateDropdownPosition)
}

function closeDropdown() {
  isOpen.value = false
  searchTerm.value = selectedOption.value?.label ?? ''
}

function updateDropdownPosition() {
  if (!isOpen.value || !rootRef.value) return

  const rect = rootRef.value.getBoundingClientRect()
  dropdownStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  }
}

function selectOption(option: SearchableSelectOption) {
  emit('update:modelValue', option.value)
  searchTerm.value = option.label
  isOpen.value = false
}

function selectEmpty() {
  emit('update:modelValue', props.emptyValue)
  searchTerm.value = ''
  isOpen.value = false
}
</script>

<style scoped>
.searchable-field {
  width: 100%;
  border-radius: var(--app-radius-field);
  border: 1px solid var(--app-color-border-strong);
  background: var(--app-color-surface-muted);
  padding: 0.75rem 1rem;
  color: var(--app-color-text);
  font-size: var(--app-font-size-sm);
  line-height: 1.5rem;
  outline: none;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;
}

.searchable-field:focus {
  border-color: var(--app-color-accent);
  background: var(--app-color-surface);
  box-shadow: 0 0 0 3px var(--app-color-accent-ring);
}

.searchable-field:disabled {
  cursor: not-allowed;
  background: var(--app-color-surface-subtle);
  color: var(--app-color-text-soft);
}

.searchable-field--compact {
  border-radius: 0.375rem;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1.25rem;
}

.searchable-dropdown {
  position: fixed;
  z-index: 9999;
  max-height: 13rem;
  overflow: auto;
  border-radius: var(--app-radius-sm);
  border: 1px solid var(--app-color-border);
  background: var(--app-color-surface);
  box-shadow: var(--app-shadow-md);
}

.searchable-dropdown__item,
.searchable-dropdown__state {
  padding: 0.5rem 1rem;
  font-size: var(--app-font-size-sm);
}

.searchable-dropdown__item {
  cursor: pointer;
  color: var(--app-color-text);
  transition: background-color 0.2s ease;
}

.searchable-dropdown__item:hover {
  background: var(--app-color-accent-soft);
}

.searchable-dropdown__item--muted,
.searchable-dropdown__state {
  color: var(--app-color-text-muted);
}
</style>
