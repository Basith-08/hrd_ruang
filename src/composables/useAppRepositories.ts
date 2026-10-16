import { useNuxtApp } from '#imports'

import { getInfrastructureRepositories } from '@/infrastructure/repositories'

export function useAppRepositories() {
  try {
    const repositories = useNuxtApp().$repositories
    return repositories ?? getInfrastructureRepositories()
  } catch {
    return getInfrastructureRepositories()
  }
}
