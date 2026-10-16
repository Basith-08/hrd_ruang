import type { CandidateForm } from '@/domain/entities/CandidateForm'
import { callBackendApi } from '@/infrastructure/http/backendApi'
import { getPublicAppConfig } from '@/infrastructure/runtime/publicConfig'
import { formatDateDisplay, formatDateTimeDisplay } from '@/presentation/utils/dateFormat'
import {
  closePdfPreviewWindow,
  openPdfPreviewWindow,
  renderPdfPreviewWindow,
} from '@/presentation/utils/pdfPreviewWindow'

const { candidatePhotographBucket } = getPublicAppConfig()

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function lineValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  return escapeHtml(value)
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-'
  }

  return escapeHtml(
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value),
  )
}

function buildRow(label: string, value: string, multiline = false) {
  return `
    <div class="field-row">
      <div class="field-label">${escapeHtml(label)}</div>
      <div class="field-separator">:</div>
      <div class="field-value${multiline ? ' multiline' : ''}">${value}</div>
    </div>
  `
}

function buildPairedFieldRow(
  leftLabel: string,
  leftValue: string,
  rightLabel: string,
  rightValue: string,
) {
  return `
    <div class="paired-row">
      <div class="field-label">${escapeHtml(leftLabel)}</div>
      <div class="field-separator">:</div>
      <div class="paired-field-value">${leftValue}</div>
      <div class="field-label">${escapeHtml(rightLabel)}</div>
      <div class="field-separator">:</div>
      <div class="paired-field-value">${rightValue}</div>
    </div>
  `
}

function buildCompactRow(label: string, value: string) {
  return `
    <div class="field-row compact-row">
      <div class="field-label">${escapeHtml(label)}</div>
      <div class="field-separator">:</div>
      <div class="field-value">${value}</div>
    </div>
  `
}

function buildCompactPairedFieldRow(
  leftLabel: string,
  leftValue: string,
  rightLabel: string,
  rightValue: string,
) {
  return `
    <div class="paired-row compact-paired-row">
      <div class="field-label">${escapeHtml(leftLabel)}</div>
      <div class="field-separator">:</div>
      <div class="paired-field-value">${leftValue}</div>
      <div class="field-label">${escapeHtml(rightLabel)}</div>
      <div class="field-separator">:</div>
      <div class="paired-field-value">${rightValue}</div>
    </div>
  `
}

function buildTable(
  headers: string[],
  rows: string[][],
  options: {
    className?: string
    widths?: string[]
  } = {},
) {
  const bodyRows = rows.length > 0
    ? rows
        .map(
          (row) => `
            <tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>
          `,
        )
        .join('')
    : `<tr><td colspan="${headers.length}" class="empty-cell">No data available</td></tr>`

  const colgroup =
    options.widths && options.widths.length === headers.length
      ? `
      <colgroup>
        ${options.widths.map((width) => `<col style="width:${escapeHtml(width)}" />`).join('')}
      </colgroup>`
      : ''

  return `
    <table class="data-table ${escapeHtml(options.className ?? '').trim()}">
      ${colgroup}
      <thead>
        <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>
  `
}

function buildPhotographSection(photoUrl: string) {
  if (!photoUrl) {
    return `
      <div class="photo-frame photo-empty">
        <span>No Photo</span>
      </div>
    `
  }

  return `
    <div class="photo-frame">
      <img src="${escapeHtml(photoUrl)}" alt="Candidate photograph" class="candidate-photo" />
    </div>
  `
}

async function resolvePhotographUrl(candidate: CandidateForm) {
  const photographPath = String(candidate.photograph ?? '').trim()
  if (!photographPath) {
    return ''
  }

  if (/^https?:\/\//i.test(photographPath)) {
    return photographPath
  }

  try {
    const payload = await callBackendApi<{ signed_url?: string }>(
      '/api/candidate-forms/photograph/sign-url',
      {
        method: 'POST',
        body: JSON.stringify({
          bucket: candidatePhotographBucket,
          candidate_form_id: candidate.id ?? '',
          path: photographPath,
          storage_source:
            candidate.candidate_source === 'candidate_service'
            || Boolean(candidate.candidate_service_form_id)
              ? 'candidate_service'
              : 'dashboard',
        }),
      },
    )

    return String(payload.signed_url ?? '').trim()
  } catch {
    return ''
  }
}

function buildTemplate(candidate: CandidateForm, photographUrl: string) {
  const fullName = candidate.full_name ||
    [candidate.first_name, candidate.middle_name, candidate.last_name].filter(Boolean).join(' ') ||
    '-'

  const familyRows = candidate.family_and_emergency.map((item) => [
    lineValue(item.category),
    lineValue(item.name),
    lineValue(item.relationship),
    lineValue(item.gender),
    lineValue(item.place_and_date_of_birth),
    lineValue(item.occupation),
    lineValue(item.education),
    lineValue(item.remarks),
  ])

  const educationRows = candidate.education.map((item) => [
    lineValue(item.category),
    lineValue(item.level),
    lineValue(item.institution),
    lineValue(item.city),
    lineValue(item.major),
    lineValue(item.from_year),
    lineValue(item.to_year),
    lineValue(item.description),
  ])

  const languageRows = candidate.candidate_languages.map((item) => [
    lineValue(item.language_name),
    lineValue(item.speaking),
    lineValue(item.reading),
    lineValue(item.listening),
    lineValue(item.writing),
  ])

  const skillRows = candidate.candidate_skills.map((item) => [
    lineValue(item.skill_name),
    lineValue(item.description),
  ])

  const workRows = candidate.work_history.map((item) => [
    lineValue(item.company),
    lineValue(item.position),
    lineValue(item.company_phone),
    lineValue(item.direct_superior_title),
    lineValue(item.from_year),
    lineValue(item.to_year),
    formatCurrency(item.last_salary),
    lineValue(item.benefit),
    lineValue(item.reason_to_quitting),
  ])

  const referenceRows = candidate.candidate_references.map((item) => [
    lineValue(item.name),
    lineValue(item.phone_number),
    lineValue(item.relationship),
    lineValue(item.position),
  ])

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Candidate Form</title>
      <style>
        @page { size: A4; margin: 10mm; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          color: #111827;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.45;
          background: #ffffff;
        }
        .sheet {
          width: 100%;
          border: 1px solid #111827;
          background: #ffffff;
        }
        .header {
          padding: 16px 22px 14px;
          border-bottom: 2px solid #111827;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 18px;
          letter-spacing: 0.04em;
        }
        .intro-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 120px;
          gap: 16px;
          align-items: start;
        }
        .content {
          padding: 18px 22px 22px;
        }
        .section {
          margin-top: 20px;
        }
        .table-section {
          break-inside: auto;
          page-break-inside: auto;
        }
        .section:first-child {
          margin-top: 0;
        }
        .section-title {
          margin: 0 0 10px;
          padding-bottom: 6px;
          border-bottom: 1px solid #94a3b8;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          break-after: avoid-page;
          page-break-after: avoid;
        }
        .field-row {
          display: grid;
          grid-template-columns: 165px 12px 1fr;
          gap: 6px;
          align-items: start;
          margin-top: 8px;
        }
        .paired-row {
          display: grid;
          grid-template-columns: 165px 12px minmax(120px, 1fr) 165px 12px minmax(120px, 1fr);
          gap: 6px;
          align-items: start;
          margin-top: 8px;
        }
        .field-label {
          font-weight: 700;
          color: #334155;
        }
        .field-separator {
          text-align: center;
          color: #334155;
        }
        .field-value,
        .paired-field-value {
          min-height: 20px;
          padding: 0 2px 3px;
          border-bottom: 1px solid #cbd5e1;
          color: #111827;
          word-break: break-word;
        }
        .field-value.multiline {
          min-height: 64px;
        }
        .compact-row {
          grid-template-columns: 130px 10px 1fr;
        }
        .compact-paired-row {
          grid-template-columns: 120px 10px minmax(0, 1fr) 110px 10px minmax(0, 1fr);
        }
        .compact-row .field-label,
        .compact-paired-row .field-label,
        .compact-row .field-value,
        .compact-paired-row .paired-field-value {
          white-space: nowrap;
        }
        .photo-frame {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 120px;
          height: 150px;
          overflow: hidden;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          background: #f8fafc;
        }
        .photo-empty {
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .candidate-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          page-break-inside: auto;
          table-layout: fixed;
          font-size: 11px;
        }
        .data-table thead {
          display: table-header-group;
          break-after: avoid-page;
          page-break-after: avoid;
        }
        .data-table th,
        .data-table td {
          border: 1px solid #cbd5e1;
          padding: 8px;
          text-align: left;
          vertical-align: top;
          white-space: normal;
        }
        .data-table tr,
        .data-table th,
        .data-table td {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .data-table th {
          background: #f8fafc;
          font-size: 9px;
          line-height: 1.35;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #334155;
        }
        .data-table td {
          overflow-wrap: anywhere;
          line-height: 1.45;
        }
        .empty-cell {
          text-align: center;
          color: #64748b;
        }
        .footer-note {
          margin-top: 18px;
          font-size: 10px;
          color: #475569;
          text-align: right;
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="header">
          <h1>Candidate Form</h1>
        </div>

        <div class="content">
          <div class="section">
            <p class="section-title">Application Information</p>
            <div class="intro-grid">
              <div>
                ${buildCompactRow('Candidate Name', lineValue(fullName))}
                ${buildCompactRow('Main Position', lineValue(candidate.employee_request_form?.main_position))}
                ${buildCompactPairedFieldRow('Application Date', escapeHtml(formatDateDisplay(candidate.date_application)), 'Notice Period', lineValue(candidate.notice_period))}
                ${buildCompactRow('Available Start', escapeHtml(formatDateDisplay(candidate.available_start_date)))}
                ${buildCompactRow('Hire Location', lineValue(candidate.hire_location))}
              </div>
              <div>
                ${buildPhotographSection(photographUrl)}
              </div>
            </div>
          </div>

          <div class="section">
            <p class="section-title">Personal Information</p>
            ${buildPairedFieldRow('Full Name', lineValue(fullName), 'Gender', lineValue(candidate.gender))}
            ${buildPairedFieldRow('Date of Birth', escapeHtml(formatDateDisplay(candidate.date_of_birth)), 'Place of Birth', lineValue(candidate.place_of_birth))}
            ${buildPairedFieldRow('Nationality', lineValue(candidate.nationality), 'Religion', lineValue(candidate.religion))}
            ${buildPairedFieldRow('Marital Status', lineValue(candidate.marital_status), 'Blood Type', lineValue(candidate.blood_type))}
            ${buildRow('Ethnic', lineValue(candidate.ethnic))}
          </div>

          <div class="section">
            <p class="section-title">Contact and Identity</p>
            ${buildPairedFieldRow('Email', lineValue(candidate.personal_email), 'Phone/Home Number', lineValue(candidate.phone_number))}
            ${buildPairedFieldRow('Instagram', lineValue(candidate.instagram), 'LinkedIn', lineValue(candidate.linkedin))}
            ${buildPairedFieldRow('ID Type', lineValue(candidate.id_type), 'Identity Card Number (KTP/SIM)', lineValue(candidate.id_no))}
            ${buildRow('ID Card Address', lineValue(candidate.id_card_address), true)}
            ${buildRow('Residential Address', lineValue(candidate.residential_address), true)}
          </div>

          <div class="section">
            <p class="section-title">Mobility and Residence</p>
            ${buildPairedFieldRow('Transportation Type', lineValue(candidate.transportation_type), 'Transportation Ownership', lineValue(candidate.transportation_ownership))}
            ${buildRow('Residence Ownership', lineValue(candidate.residence_ownership))}
          </div>

          <div class="section table-section">
            <p class="section-title">Family and Emergency</p>
            ${buildTable(
              ['Category', 'Name', 'Relationship', 'Gender', 'Birth Info', 'Occupation', 'Education', 'Remarks'],
              familyRows,
              { widths: ['12%', '14%', '12%', '8%', '18%', '12%', '12%', '12%'] },
            )}
          </div>

          <div class="section table-section">
            <p class="section-title">Education and Training</p>
            ${buildTable(
              ['Category', 'Level', 'Institution', 'City', 'Major', 'From', 'To', 'Description'],
              educationRows,
              { widths: ['14%', '12%', '20%', '10%', '14%', '7%', '7%', '16%'] },
            )}
          </div>

          <div class="section table-section">
            <p class="section-title">Language Skills</p>
            ${buildTable(
              ['Language', 'Speaking', 'Reading', 'Listening', 'Writing'],
              languageRows,
              { widths: ['28%', '18%', '18%', '18%', '18%'] },
            )}
          </div>

          <div class="section table-section">
            <p class="section-title">Other Skills</p>
            ${buildTable(['Skill', 'Description'], skillRows, {
              widths: ['28%', '72%'],
            })}
          </div>

          <div class="section table-section">
            <p class="section-title">Work History</p>
            ${buildTable(
              ['Company', 'Position', 'Phone', 'Direct Supervisor', 'From', 'To', 'Latest Salary', 'Benefits / Facilities', 'Reason for Leaving'],
              workRows,
              { widths: ['14%', '14%', '9%', '13%', '7%', '7%', '12%', '13%', '11%'] },
            )}
          </div>

          <div class="section table-section">
            <p class="section-title">References</p>
            ${buildTable(
              ['Name', 'Phone', 'Relationship', 'Position'],
              referenceRows,
              { widths: ['28%', '20%', '24%', '28%'] },
            )}
          </div>

          <div class="section">
            <p class="section-title">Personal Statement</p>
            ${buildRow('Currently Under Contract', lineValue(candidate.personal_statement?.contract))}
            ${buildRow('Contract Period', lineValue(candidate.personal_statement?.contract_period))}
            ${buildRow('Legal Issue with Previous Company', lineValue(candidate.personal_statement?.company_legal_issue))}
            ${buildRow('Legal Issue Details', lineValue(candidate.personal_statement?.company_legal_issue_details), true)}
            ${buildRow('Reference Check Permitted', lineValue(candidate.personal_statement?.reference_check_allowed))}
            ${buildRow('Reason Reference Check Is Not Allowed', lineValue(candidate.personal_statement?.reference_check_reason), true)}
            ${buildRow('Family or Friends in Company', lineValue(candidate.personal_statement?.family_or_friend_in_company))}
            ${buildRow('Family or Friend Details', lineValue(candidate.personal_statement?.family_or_friend_details), true)}
            ${buildRow('History of Serious Illness', lineValue(candidate.personal_statement?.serious_illness))}
            ${buildRow('Serious Illness Details', lineValue(candidate.personal_statement?.serious_illness_details), true)}
            ${buildRow('History of Serious Accident', lineValue(candidate.personal_statement?.serious_accident_boolean))}
            ${buildRow('Serious Accident Details', lineValue(candidate.personal_statement?.serious_accident_details), true)}
            ${buildRow('Psychological Test Taken', lineValue(candidate.personal_statement?.psychological_test))}
            ${buildRow('Psychological Test Location', lineValue(candidate.personal_statement?.psychological_test_location))}
            ${buildRow('Psychological Test Purpose', lineValue(candidate.personal_statement?.psychological_test_purpose))}
            ${buildRow('Civil or Criminal Case', lineValue(candidate.personal_statement?.civil_or_criminal_case))}
            ${buildRow('Civil or Criminal Case Details', lineValue(candidate.personal_statement?.civil_or_criminal_case_details), true)}
            ${buildRow('Willing to Travel for Work', lineValue(candidate.personal_statement?.business_trip))}
            ${buildRow('Applied Here Before', lineValue(candidate.personal_statement?.previous_application))}
            ${buildRow('Previous Application Details', lineValue(candidate.personal_statement?.previous_application_details), true)}
            ${buildRow('Expected Salary', formatCurrency(candidate.personal_statement?.expected_salary))}
          </div>
        </div>
      </div>
      <script>
        window.addEventListener('load', () => {
          const images = Array.from(document.images)
          const waitForImages = images.length === 0
            ? Promise.resolve()
            : Promise.all(
                images.map((image) =>
                  image.complete
                    ? Promise.resolve()
                    : new Promise((resolve) => {
                        image.addEventListener('load', resolve, { once: true })
                        image.addEventListener('error', resolve, { once: true })
                      }),
                ),
              )

          waitForImages.finally(() => {
            setTimeout(() => window.print(), 300)
          })
        })
      </script>
    </body>
  </html>`
}

export async function exportCandidateFormPdf(
  candidate: CandidateForm,
  options: {
    previewWindow?: Window | null
  } = {},
) {
  const printWindow = openPdfPreviewWindow(
    'The PDF preview window could not be opened.',
    options.previewWindow,
  )

  try {
    const photographUrl = await resolvePhotographUrl(candidate)
    renderPdfPreviewWindow(printWindow, buildTemplate(candidate, photographUrl))
  } catch (error) {
    closePdfPreviewWindow(printWindow)
    throw error
  }
}
