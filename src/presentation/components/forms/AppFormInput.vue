<template>
  <input
    ref="inputRef"
    :value="modelValue ?? ''"
    class="app-field"
    :type="type"
    :required="required"
    :min="min"
    :minlength="minlength"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :autocomplete="autocomplete"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
  <p v-if="helperText" class="app-helper-text">
    {{ helperText }}
  </p>
  <p v-if="warningText" class="app-warning-text">
    {{ warningText }}
  </p>
  <p v-if="errorText" class="app-error-text">
    {{ errorText }}
  </p>
</template>

<script setup lang="ts">
import { ref } from 'vue'

type AppFormInputType = 'text' | 'number' | 'date' | 'datetime-local' | 'time' | 'email' | 'password' | 'search' | 'tel' | 'url'
type AppFormInputValue = string | number | null

withDefaults(
  defineProps<{
    modelValue?: AppFormInputValue
    type?: AppFormInputType
    required?: boolean
    disabled?: boolean
    readonly?: boolean
    min?: string | number
    minlength?: string | number
    placeholder?: string
    autocomplete?: string
    helperText?: string
    warningText?: string
    errorText?: string
  }>(),
  {
    modelValue: '',
    type: 'text',
    required: false,
    disabled: false,
    readonly: false,
    min: undefined,
    minlength: undefined,
    placeholder: '',
    autocomplete: '',
    helperText: '',
    warningText: '',
    errorText: '',
  },
)

defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)

defineExpose({
  showPicker: () => inputRef.value?.showPicker?.(),
})
</script>
