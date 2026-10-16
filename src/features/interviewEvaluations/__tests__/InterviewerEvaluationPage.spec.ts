import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

import type { InterviewEvaluation } from '@/domain/entities/InterviewEvaluation'

const fetchAssignedEvaluationMock = vi.fn()
const saveEvaluationMock = vi.fn()
const hasPermissionMock = vi.fn()
const callBackendApiMock = vi.fn()
const toastErrorMock = vi.fn()
const routerPushMock = vi.fn()

const errorRef = ref('')
const loadingRef = ref(false)
const savingRef = ref(false)
const candidateOptionsRef = ref([])
const routeState = {
  params: { id: 'evaluation-1' },
  query: {},
}

vi.mock('#imports', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    push: routerPushMock,
  }),
}))

vi.mock('@/composables/useLocale', () => ({
  useLocale: () => ({
    text: (key: string, params?: Record<string, string>) => {
      if (params?.name) {
        return `${key}:${params.name}`
      }

      return key
    },
  }),
}))

vi.mock('@/infrastructure/runtime/publicConfig', () => ({
  getPublicAppConfig: () => ({
    employeeDocumentBucket: 'candidate-documents',
  }),
}))

vi.mock('@/infrastructure/http/backendApi', () => ({
  callBackendApi: callBackendApiMock,
}))

vi.mock('@/presentation/components/feedback/useAppToast', () => ({
  useAppToast: () => ({
    error: toastErrorMock,
  }),
}))

vi.mock('@/viewmodels/useAuthViewModel', () => ({
  useAuthViewModel: () => ({
    hasPermission: hasPermissionMock,
  }),
}))

vi.mock('@/viewmodels/useInterviewerFormViewModel', () => ({
  useInterviewerFormViewModel: () => ({
    candidateOptions: candidateOptionsRef,
    error: errorRef,
    fetchAssignedEvaluation: fetchAssignedEvaluationMock,
    loading: loadingRef,
    saveEvaluation: saveEvaluationMock,
    saving: savingRef,
  }),
}))

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void

  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve
  })

  return { promise, resolve }
}

function createAssignedEvaluation(): InterviewEvaluation {
  return {
    id: 'evaluation-1',
    employee_request_form_id: 'erf-1',
    candidate_service_candidate_id: 'candidate-service-1',
    candidate_service_application_id: 'application-1',
    candidate_name: 'Yono Koh',
    applied_position: 'Staff Admin',
    interviewer_name: 'Rina',
    interviewer_recipients: [],
    interview_date: '2026-04-06',
    notes: null,
    comments: '',
    recommendation: null,
    created_by: 'user-1',
    updated_by: 'user-1',
    created_at: '2026-04-06T08:00:00',
    updated_at: '2026-04-06T08:00:00',
    scores: [],
    candidate_form: {
      id: 'candidate-form-1',
      employee_documents: {
        cv: ['candidate-documents/user-1/cv.pdf'],
      },
      family_and_emergency: [],
      education: [],
      work_history: [],
      candidate_languages: [],
      candidate_skills: [],
      candidate_references: [],
    },
  } as unknown as InterviewEvaluation
}

const CandidateFormDocumentSectionStub = defineComponent({
  props: {
    entries: {
      type: Array,
      default: () => [],
    },
    onOpenFile: {
      type: Function,
      default: undefined,
    },
    openingDocumentKeys: {
      type: Array,
      default: () => [],
    },
  },
  template: `
    <div>
      <button
        data-test="open-document"
        type="button"
        @click="onOpenFile?.(entries[0].documentType, entries[0].files[0])"
      >
        Open
      </button>
      <p data-test="opening-keys">{{ (openingDocumentKeys ?? []).join(',') }}</p>
    </div>
  `,
})

describe('InterviewerEvaluationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    errorRef.value = ''
    loadingRef.value = false
    savingRef.value = false
    candidateOptionsRef.value = []
    hasPermissionMock.mockReturnValue(true)
    saveEvaluationMock.mockResolvedValue(undefined)
    fetchAssignedEvaluationMock.mockResolvedValue(createAssignedEvaluation())
    routerPushMock.mockResolvedValue(undefined)
  })

  it('does not show not-found state before assigned evaluation loading finishes', async () => {
    const deferredEvaluation = createDeferred<InterviewEvaluation>()
    fetchAssignedEvaluationMock.mockReturnValueOnce(deferredEvaluation.promise)

    const { default: InterviewerEvaluationPage } = await import('../InterviewerEvaluationPage.vue')
    const wrapper = mount(InterviewerEvaluationPage, {
      global: {
        stubs: {
          AppActionButton: true,
          AppAlert: true,
          AppFieldLabel: true,
          AppInfoGrid: true,
          AppLoadingState: {
            props: ['message'],
            template: '<div>{{ message }}</div>',
          },
          AppPageHeader: true,
          AppTabs: true,
          AppTextarea: true,
          CandidateFormDocumentSection: CandidateFormDocumentSectionStub,
          InterviewEvaluationScoreGrid: true,
          SearchableSelect: true,
        },
      },
    })

    await nextTick()

    expect(wrapper.text()).toContain('common.loading')
    expect(wrapper.text()).not.toContain('interviewEvaluations.interviewer.notFound')

    deferredEvaluation.resolve(createAssignedEvaluation())
    await flushPromises()

    expect(wrapper.text()).not.toContain('interviewEvaluations.interviewer.notFound')
  })

  it('shows per-file loading state while preparing a document', async () => {
    const signedUrlRequest = createDeferred<{ signed_url: string }>()
    const windowOpenMock = vi.spyOn(window, 'open').mockImplementation(() => null)

    callBackendApiMock.mockReturnValue(signedUrlRequest.promise)

    const { default: InterviewerEvaluationPage } = await import('../InterviewerEvaluationPage.vue')
    const wrapper = mount(InterviewerEvaluationPage, {
      global: {
        stubs: {
          AppActionButton: true,
          AppAlert: true,
          AppFieldLabel: true,
          AppInfoGrid: true,
          AppLoadingState: true,
          AppPageHeader: true,
          AppTabs: true,
          AppTextarea: true,
          CandidateFormDocumentSection: CandidateFormDocumentSectionStub,
          InterviewEvaluationScoreGrid: true,
          SearchableSelect: true,
        },
      },
    })

    await flushPromises()

    await wrapper.get('[data-test="open-document"]').trigger('click')
    await nextTick()

    expect(callBackendApiMock).toHaveBeenCalledWith(
      '/api/interview-evaluations/assigned/evaluation-1/documents/sign-url',
      expect.objectContaining({
        method: 'POST',
      }),
    )
    expect(wrapper.get('[data-test="opening-keys"]').text()).toBe(
      'cv:candidate-documents/user-1/cv.pdf',
    )

    signedUrlRequest.resolve({ signed_url: 'https://example.test/cv.pdf' })
    await flushPromises()

    expect(windowOpenMock).toHaveBeenCalledWith(
      'https://example.test/cv.pdf',
      '_blank',
      'noopener,noreferrer',
    )
    expect(wrapper.get('[data-test="opening-keys"]').text()).toBe('')

    windowOpenMock.mockRestore()
  })
})
