import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

const callBackendApiMock = vi.fn()
const refreshItemsMock = vi.fn()
const toastErrorMock = vi.fn()

vi.mock('@/viewmodels/useCandidateDocumentExplorerViewModel', () => ({
  useCandidateDocumentExplorerViewModel: () => ({
    items: ref([
      {
        id: 'form-portal-1',
        storage_source: 'candidate_service',
        role: 'candidate',
        candidate_id: 'candidate-1',
        candidate_name: 'Basith Ko',
        candidate_email: 'basith@example.com',
        personal_email: 'basith@example.com',
        phone_number: '08123',
        photograph: null,
        pt_name: '22. Legal',
        department_name: '02. Staff',
        designation_name: 'Staff Legal',
        main_position: 'Basith Ko',
        created_at: null,
        updated_at: null,
        documents: [
          {
            key: 'academic_transcript',
            label: 'Academic Transcript',
            bucket: 'candidate-documents',
            files: ['candidate-documents/legal/basith-transcript.pdf'],
            storage_source: 'candidate_service',
          },
        ],
      },
    ]),
    loading: ref(false),
    error: ref(''),
    refreshItems: refreshItemsMock,
  }),
}))

vi.mock('@/infrastructure/http/backendApi', () => ({
  callBackendApi: callBackendApiMock,
}))

vi.mock('@/presentation/components/feedback/useAppToast', () => ({
  useAppToast: () => ({
    error: toastErrorMock,
    success: vi.fn(),
  }),
}))

vi.mock('../components/RecruitmentDocumentExplorerFinderSection.vue', () => ({
  default: defineComponent({
    props: ['openFile'],
    setup(props) {
      return {
        triggerOpen() {
          void props.openFile({
            id: 'form-portal-1:academic_transcript:candidate-documents/legal/basith-transcript.pdf',
            label: 'basith-transcript.pdf',
            nodeType: 'file',
            bucket: 'candidate-documents',
            candidateFormId: 'form-portal-1',
            path: 'candidate-documents/legal/basith-transcript.pdf',
            fileKind: 'pdf',
            storageSource: 'candidate_service',
            children: [],
          })
        },
        triggerOpenWithoutCandidateFormId() {
          void props.openFile({
            id: 'form-portal-1:academic_transcript:candidate-documents/legal/basith-transcript.pdf',
            label: 'basith-transcript.pdf',
            nodeType: 'file',
            bucket: 'candidate-documents',
            path: 'candidate-documents/legal/basith-transcript.pdf',
            fileKind: 'pdf',
            storageSource: 'candidate_service',
            children: [],
          })
        },
      }
    },
    template: `
      <div>
        <button type="button" @click="triggerOpen">Open File</button>
        <button type="button" @click="triggerOpenWithoutCandidateFormId">Open File Without Candidate Form Id</button>
      </div>
    `,
  }),
}))

describe('RecruitmentDocumentExplorerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    callBackendApiMock.mockResolvedValue({
      signed_url: 'https://signed.example/document',
    })
    vi.stubGlobal('open', vi.fn())
  })

  it('sends candidate_form_id when opening a candidate document explorer file', async () => {
    const { default: Page } = await import('../RecruitmentDocumentExplorerPage.vue')
    const wrapper = mount(Page)

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === 'Open File')!.trigger('click')
    await flushPromises()

    expect(callBackendApiMock).toHaveBeenCalledWith(
      '/api/recruitment/candidate-document-explorer/sign-url',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          bucket: 'candidate-documents',
          candidate_form_id: 'form-portal-1',
          path: 'candidate-documents/legal/basith-transcript.pdf',
          storage_source: 'candidate_service',
        }),
      }),
    )
  })

  it('falls back to the finder node id when candidateFormId is missing', async () => {
    const { default: Page } = await import('../RecruitmentDocumentExplorerPage.vue')
    const wrapper = mount(Page)

    await flushPromises()
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Open File Without Candidate Form Id')!
      .trigger('click')
    await flushPromises()

    expect(callBackendApiMock).toHaveBeenCalledWith(
      '/api/recruitment/candidate-document-explorer/sign-url',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          bucket: 'candidate-documents',
          candidate_form_id: 'form-portal-1',
          path: 'candidate-documents/legal/basith-transcript.pdf',
          storage_source: 'candidate_service',
        }),
      }),
    )
  })
})
