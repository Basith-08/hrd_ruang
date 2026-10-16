import { toast } from "vue-sonner"

export function useAppToast() {
  function success(message: string) {
    toast.success(message)
  }

  function error(message: string) {
    toast.error(message)
  }

  function created(subject: string) {
    success(`${subject} created successfully.`)
  }

  function updated(subject: string) {
    success(`${subject} updated successfully.`)
  }

  function deleted(subject: string) {
    success(`${subject} deleted successfully.`)
  }

  return {
    created,
    deleted,
    error,
    success,
    updated,
  }
}
