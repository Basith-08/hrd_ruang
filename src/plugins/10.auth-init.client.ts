import { defineNuxtPlugin, usePinia } from "#imports"
import { useAuthStore } from "@/stores/authStore"

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore(usePinia())

  if (typeof authStore.initAuth !== "function") {
    console.error("Failed to initialize auth plugin: authStore.initAuth is not available.", {
      storeKeys: Object.keys(authStore),
    })
    return
  }

  void authStore.initAuth()
})
