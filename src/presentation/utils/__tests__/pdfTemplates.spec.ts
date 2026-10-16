import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const callBackendApiMock = vi.fn()

vi.mock('@/infrastructure/http/backendApi', () => ({
  callBackendApi: callBackendApiMock,
}))

describe('PDF template exporters', () => {
  let printWindowMock: {
    document: {
      open: ReturnType<typeof vi.fn>
      write: ReturnType<typeof vi.fn>
      close: ReturnType<typeof vi.fn>
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    printWindowMock = {
      document: {
        open: vi.fn(),
        write: vi.fn(),
        close: vi.fn(),
      },
    }
    vi.spyOn(window, 'open').mockReturnValue(printWindowMock as any)
    callBackendApiMock.mockResolvedValue({
      signed_url: 'https://cdn.example.com/photo.jpg',
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('exports candidate form PDF with escaped content and resolved photograph URL', async () => {
    const { exportCandidateFormPdf } = await import('../candidateFormPdfTemplate')

    await exportCandidateFormPdf({
      id: 'candidate-1',
      employee_request_form_id: 'erf-1',
      candidate_id: 'cand-1',
      completion_status: 'completed',
      photograph: 'photo/path.jpg',
      date_application: '2026-03-01',
      notice_period: '2 weeks',
      first_name: '<Jane>',
      middle_name: null,
      last_name: 'Doe',
      hire_location: 'Jakarta',
      date_of_birth: '1995-01-01',
      place_of_birth: 'Bandung',
      nationality: 'ID',
      marital_status: 'Single',
      religion: 'Islam',
      gender: 'Female',
      ethnic: 'Sunda',
      blood_type: 'O',
      id_card_address: 'Address',
      residential_address: 'Residence',
      personal_email: 'jane@example.com',
      instagram: '@jane',
      linkedin: 'jane-linkedin',
      phone_number: '08123',
      home_phone: '021123',
      id_type: 'KTP',
      id_no: '123',
      available_start_date: '2026-03-10',
      join_date: '2026-03-20',
      transportation_type: 'Car',
      transportation_ownership: 'Personal',
      residence_ownership: 'Personal',
      created_at: '2026-03-01T08:00:00Z',
      updated_at: '2026-03-01T08:00:00Z',
      employee_request_form: {
        id: 'erf-1',
        main_position: 'Engineer',
        site: 'Jakarta',
      },
      family_and_emergency: [],
      education: [],
      work_history: [],
      candidate_languages: [],
      candidate_skills: [],
      candidate_references: [],
      personal_statement: {
        id: 'ps-1',
        candidate_form_id: 'candidate-1',
        contract: true,
        contract_period: '12 months',
        reference_check_reason: '',
        business_trip: false,
        expected_salary: 10000000,
        previous_application: false,
        previous_application_details: '',
        reference_check_allowed: true,
        family_or_friend_in_company: false,
        serious_illness: false,
        serious_illness_details: '',
        serious_accident_boolean: false,
        psychological_test: false,
        psychological_test_location: '',
        psychological_test_purpose: '',
        company_legal_issue: false,
        company_legal_issue_details: '',
        family_or_friend_details: '',
        serious_accident_details: '',
        civil_or_criminal_case: false,
        civil_or_criminal_case_details: '',
      },
    } as any)

    const html = printWindowMock.document.write.mock.calls[0]?.[0] as string

    expect(callBackendApiMock).toHaveBeenCalled()
    expect(html).toContain('&lt;Jane&gt; Doe')
    expect(html).toContain('https://cdn.example.com/photo.jpg')
    expect(html).toContain('No data available')
    expect(html).toContain('.table-section {')
    expect(html).toContain('display: table-header-group')
    expect(html).toContain('<div class="section table-section">')
  })

  it('exports employee request form PDF and shows approval note when fully approved', async () => {
    const { exportEmployeeRequestFormPdf } = await import('../employeeRequestFormPdfTemplate')

    exportEmployeeRequestFormPdf({
      id: 'erf-1',
      pt_pembebanan: 'PT One',
      business_unit: 'Corporate BU',
      department: '19. Human Capital',
      designation: '02. Staff',
      employment_status: 'Contract',
      direct_manager: 'Boss — ENG',
      approval_director_bu: 'BU Director',
      approval_director_bu_date: '2026-03-01',
      approval_gm_hrd: 'GM HRD',
      approval_gm_hrd_date: '2026-03-02',
      approval_director_hrd: 'HR Director',
      approval_director_hrd_date: '2026-03-03',
      site: 'Jakarta',
      working_location: 'Jakarta',
      custom_grup_1_id: null,
      custom_grup_2_id: null,
      custom_grup_3_id: null,
      custom_grup_4_id: null,
      custom_grup_5_id: null,
      custom_grup_6_id: null,
      custom_grup_1: null,
      custom_grup_2: null,
      custom_grup_3: null,
      custom_grup_4: null,
      custom_grup_5: null,
      custom_grup_6: null,
      required_date: '2026-04-01',
      position_status: 'Replacement',
      periode_probation: 3,
      main_position: 'Backend Engineer',
      requested_date: '2026-03-01',
      created_by: 'user-1',
      created_by_name: 'Requester',
      status: 'open',
      closed_date: null,
      closed_category: null,
      reason: null,
      created_at: '2026-03-01T08:00:00Z',
      updated_at: '2026-03-01T08:00:00Z',
    } as any)

    const html = printWindowMock.document.write.mock.calls[0]?.[0] as string

    expect(html).toContain('Employee Request Form (ERF)')
    expect(html).toContain('Backend Engineer')
    expect(html).toContain('Corporate BU')
    expect(html).toContain('Human Capital')
    expect(html).toContain('Staff')
    expect(html).not.toContain('19. Human Capital')
    expect(html).not.toContain('02. Staff')
    expect(html).not.toContain('Custom Group 1')
    expect(html).toContain('This document has been electronically approved')
    expect(html).toContain('Boss')
    expect(html).not.toContain('Boss — ENG')
    expect(html).toContain('Director BU')
    expect(html).toContain('GM HRD')
    expect(html).toContain('Deputi CEO HRD')
    expect(html.indexOf('Director BU')).toBeLessThan(html.indexOf('GM HRD'))
    expect(html.indexOf('GM HRD')).toBeLessThan(html.indexOf('Deputi CEO HRD'))
  })

  it('exports employee request form PDF with normalized dynamic approval labels in display order', async () => {
    const { exportEmployeeRequestFormPdf } = await import('../employeeRequestFormPdfTemplate')

    exportEmployeeRequestFormPdf({
      id: 'erf-2',
      pt_pembebanan: 'PT One',
      department: '19. Human Capital',
      designation: '02. Staff',
      employment_status: 'Contract',
      direct_manager: 'Boss — ENG',
      approval_director_bu: 'Legacy BU Director',
      approval_director_bu_date: '2026-03-01',
      approval_gm_hrd: 'Legacy GM HRD',
      approval_gm_hrd_date: '2026-03-02',
      approval_director_hrd: 'Legacy HR Director',
      approval_director_hrd_date: '2026-03-03',
      approval_steps: [
        {
          step_order: 1,
          approval_role_label: 'GM HRD Approval',
          approver_name: 'Adine S Marliah',
          approved_at: '2026-05-06',
          status: 'approved',
        },
        {
          step_order: 2,
          approval_role_label: 'Director Approval',
          approver_name: 'Anniza Widhytia',
          approved_at: '2026-05-07',
          status: 'approved',
        },
        {
          step_order: 3,
          approval_role_label: 'Director HRD Approval',
          approver_name: 'Budi Hartono',
          approved_at: '2026-05-08',
          status: 'approved',
        },
      ],
      site: 'Jakarta',
      working_location: 'Jakarta',
      custom_grup_1_id: null,
      custom_grup_2_id: null,
      custom_grup_3_id: null,
      custom_grup_4_id: null,
      custom_grup_5_id: null,
      custom_grup_6_id: null,
      custom_grup_1: null,
      custom_grup_2: null,
      custom_grup_3: null,
      custom_grup_4: null,
      custom_grup_5: null,
      custom_grup_6: null,
      required_date: '2026-04-01',
      position_status: 'Replacement',
      periode_probation: 3,
      main_position: 'Backend Engineer',
      requested_date: '2026-03-01',
      created_by: 'user-1',
      created_by_name: 'Requester',
      status: 'open',
      closed_date: null,
      closed_category: null,
      reason: null,
      created_at: '2026-03-01T08:00:00Z',
      updated_at: '2026-03-01T08:00:00Z',
    } as any)

    const html = printWindowMock.document.write.mock.calls[0]?.[0] as string

    expect(html).toContain('Director BU')
    expect(html).toContain('GM HRD')
    expect(html).toContain('Deputi CEO HRD')
    expect(html).not.toContain('GM HRD Approval')
    expect(html).not.toContain('Director Approval')
    expect(html).not.toContain('Director HRD Approval')
    expect(html.indexOf('Director BU')).toBeLessThan(html.indexOf('GM HRD'))
    expect(html.indexOf('GM HRD')).toBeLessThan(html.indexOf('Deputi CEO HRD'))
  })

  it('throws when the browser blocks the preview window', async () => {
    const { exportEmployeeRequestFormPdf } = await import('../employeeRequestFormPdfTemplate')
    vi.spyOn(window, 'open').mockReturnValue(null)

    expect(() => exportEmployeeRequestFormPdf({ id: 'erf-1' } as any)).toThrow(
      'The PDF preview window could not be opened.',
    )
  })

})
