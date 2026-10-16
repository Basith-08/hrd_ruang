import { reactive } from 'vue'

type AppConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'primary' | 'danger'
}

type AppConfirmRequest = Required<Omit<AppConfirmOptions, 'tone'>> & {
  tone: 'primary' | 'danger'
  resolve: (confirmed: boolean) => void
}

const state = reactive<{
  request: AppConfirmRequest | null
}>({
  request: null,
})

function confirm(options: AppConfirmOptions | string) {
  const normalizedOptions = typeof options === 'string'
    ? { message: options }
    : options

  return new Promise<boolean>((resolve) => {
    state.request = {
      title: normalizedOptions.title ?? 'Confirmation',
      message: normalizedOptions.message,
      confirmLabel: normalizedOptions.confirmLabel ?? 'Yes',
      cancelLabel: normalizedOptions.cancelLabel ?? 'No',
      tone: normalizedOptions.tone ?? 'primary',
      resolve,
    }
  })
}

function close(confirmed: boolean) {
  const activeRequest = state.request
  if (!activeRequest) return

  state.request = null
  activeRequest.resolve(confirmed)
}

export function useAppConfirm() {
  return {
    state,
    confirm,
    close,
  }
}
