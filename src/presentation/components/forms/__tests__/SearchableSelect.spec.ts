import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SearchableSelect from '../SearchableSelect.vue'

const options = [
  { value: 'eng', label: 'Engineering' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'fin', label: 'Finance' },
]

const mountedWrappers: Array<{ unmount: () => void }> = []

afterEach(() => {
  while (mountedWrappers.length > 0) {
    mountedWrappers.pop()?.unmount()
  }

  document.body.innerHTML = ''
})

function mountSelect(props: Record<string, unknown> = {}) {
  const wrapper = mount(SearchableSelect, {
    attachTo: document.body,
    props: {
      modelValue: null,
      options,
      ...props,
    },
  })

  mountedWrappers.push(wrapper)

  return wrapper
}

function getInput(wrapper: ReturnType<typeof mountSelect>) {
  return wrapper.get('input')
}

function getItems(wrapper: ReturnType<typeof mountSelect>) {
  return wrapper.findAll('li')
}

describe('SearchableSelect', () => {
  it('renders the selected label from modelValue on mount', () => {
    const wrapper = mountSelect({ modelValue: 'hr' })

    expect((getInput(wrapper).element as HTMLInputElement).value).toBe('Human Resources')
  })

  it('uses placeholder and compact styling props', () => {
    const wrapper = mountSelect({
      placeholder: 'Cari departemen...',
      size: 'compact',
    })

    const input = getInput(wrapper)

    expect(input.attributes('placeholder')).toBe('Cari departemen...')
    expect(input.classes()).toContain('searchable-field--compact')
  })

  it('opens on focus and filters options case-insensitively with trimmed search text', async () => {
    const wrapper = mountSelect()
    const input = getInput(wrapper)

    await input.trigger('focus')
    await input.setValue('  ENg  ')

    expect(wrapper.get('ul').isVisible()).toBe(true)
    expect(getItems(wrapper).map((item) => item.text())).toEqual(['Engineering'])
  })

  it('emits the selected value, updates the input, and closes the dropdown', async () => {
    const wrapper = mountSelect()
    const input = getInput(wrapper)

    await input.setValue('eng')

    const items = getItems(wrapper)

    expect(items.length).toBe(1)

    await items[0]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['eng']])
    expect((input.element as HTMLInputElement).value).toBe('Engineering')
    expect(wrapper.get('ul').isVisible()).toBe(false)
  })

  it('shows the no-results label when nothing matches and empty option is disabled', async () => {
    const wrapper = mountSelect({
      noResultsLabel: 'Tidak ada data.',
    })

    await getInput(wrapper).setValue('zzz')

    expect(getItems(wrapper).map((item) => item.text())).toEqual(['Tidak ada data.'])
  })

  it('renders the empty option and emits the configured empty value when selected', async () => {
    const wrapper = mountSelect({
      showEmptyOption: true,
      emptyLabel: 'Pilih...',
      emptyValue: null,
    })

    const input = getInput(wrapper)

    await input.trigger('focus')

    expect(getItems(wrapper).map((item) => item.text())).toEqual([
      'Pilih...',
      'Engineering',
      'Human Resources',
      'Finance',
    ])

    await getItems(wrapper)[0]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[null]])
    expect((input.element as HTMLInputElement).value).toBe('')
    expect(wrapper.get('ul').isVisible()).toBe(false)
  })

  it('does not open the dropdown when disabled', async () => {
    const wrapper = mountSelect({ disabled: true })
    const input = getInput(wrapper)

    await input.trigger('focus')

    expect(input.attributes('disabled')).toBeDefined()
    expect(wrapper.get('ul').isVisible()).toBe(false)
  })

  it('closes on outside click and restores the selected label', async () => {
    const wrapper = mountSelect({ modelValue: 'hr' })
    const input = getInput(wrapper)

    await input.trigger('focus')
    await input.setValue('eng')

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect((input.element as HTMLInputElement).value).toBe('Human Resources')
    expect(wrapper.get('ul').isVisible()).toBe(false)
  })

  it('syncs the displayed label when parent modelValue changes while closed', async () => {
    const wrapper = mountSelect({ modelValue: 'eng' })

    await wrapper.setProps({ modelValue: 'fin' })

    expect((getInput(wrapper).element as HTMLInputElement).value).toBe('Finance')
  })

  it('keeps the active search text when props change while the dropdown is open', async () => {
    const wrapper = mountSelect({ modelValue: 'eng' })
    const input = getInput(wrapper)

    await input.trigger('focus')
    await input.setValue('hum')
    await wrapper.setProps({ modelValue: 'fin' })

    expect((input.element as HTMLInputElement).value).toBe('hum')
    expect(getItems(wrapper).map((item) => item.text())).toEqual(['Human Resources'])
  })
})
