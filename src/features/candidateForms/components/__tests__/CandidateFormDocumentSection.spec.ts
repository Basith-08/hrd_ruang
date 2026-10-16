import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import CandidateFormDocumentSection from '@/features/candidateForms/components/CandidateFormDocumentSection.vue'

describe('CandidateFormDocumentSection', () => {
  it('hides storage placeholder entries from the rendered file list', () => {
    const wrapper = mount(CandidateFormDocumentSection, {
      props: {
        title: 'Candidate Documents',
        description: '',
        text: (key: string) => key,
        entries: [
          {
            documentType: 'cv',
            label: 'CV',
            files: [
              'candidate-documents/user-1/CV.emptyFolderPlaceholder',
              'candidate-documents/user-1/cv.pdf',
            ],
          },
        ],
        getReadableEmployeeDocumentFileName: (_documentType: string, path: string) =>
          String(path).split('/').pop() ?? String(path),
      },
    })

    expect(wrapper.text()).toContain('cv.pdf')
    expect(wrapper.text()).not.toContain('emptyFolderPlaceholder')
    expect(wrapper.find('.candidate-form-document-count').text()).toContain('1')
  })
})
