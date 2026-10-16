import { onMounted, ref } from "vue"

import { useAppRepositories } from "@/composables/useAppRepositories"
import type { RecruitmentTracking } from "@/domain/entities/RecruitmentTracking"
import { getRecruitmentTrackings } from "@/application/usecases/getRecruitmentTrackings"
import { translateText } from "@/composables/useLocale"

type RecruitmentTrackingViewModelOptions = {
  autoLoad?: boolean
}

export function useRecruitmentTrackingViewModel(
  options: RecruitmentTrackingViewModelOptions = {},
) {
  const { autoLoad = true } = options
  const { recruitmentTrackingRepo } = useAppRepositories()
  const trackings = ref<RecruitmentTracking[]>([])
  const loading = ref(autoLoad)
  const error = ref("")

  async function refreshTrackings() {
    loading.value = true
    error.value = ""
    try {
      trackings.value = await getRecruitmentTrackings(recruitmentTrackingRepo)
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText("recruitment.loadTrackingFailed")
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    if (autoLoad) {
      void refreshTrackings()
    }
  })

  return {
    error,
    loading,
    refreshTrackings,
    trackings,
  }
}
