import { defineNuxtPlugin } from '#imports'

import { getInfrastructureRepositories } from '@/infrastructure/repositories'

export default defineNuxtPlugin(() => ({
  provide: {
    repositories: getInfrastructureRepositories(),
  },
}))
