import type { EmployeeRequestForm } from '@/domain/entities/EmployeeRequestForm'
import { formatDateDisplay, formatDateTimeDisplay } from '@/presentation/utils/dateFormat'
import { openPdfPreviewWindow, renderPdfPreviewWindow } from '@/presentation/utils/pdfPreviewWindow'
import { stripLeadingNumberCode } from '@/presentation/utils/textFormat'

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function lineValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return escapeHtml(value)
}

function nameOnly(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  const normalizedValue = String(value).trim()
  const name = normalizedValue.split(/\s+[—-]\s+/)[0]?.trim() || normalizedValue

  return escapeHtml(name)
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

function buildApprovalItem(
  label: string,
  name: string | number | null | undefined,
  date: string | null | undefined,
) {
  return `
    <div class="approval-row">
      <div class="field-label">${escapeHtml(label)}</div>
      <div class="field-separator">:</div>
      <div class="approval-field-value">${nameOnly(name)}</div>
      <div class="field-label approval-date-title">Date</div>
      <div class="field-separator">:</div>
      <div class="approval-date-value">${escapeHtml(formatDateDisplay(date))}</div>
    </div>
  `
}

function normalizeApprovalLabel(label: string | null | undefined) {
  const normalized = String(label ?? '')
    .trim()
    .toLowerCase()

  if (
    normalized === 'gm approval' ||
    normalized === 'gm hrd' ||
    normalized === 'gm hrd approval' ||
    normalized === 'gm hrd' ||
    normalized === 'gm hrd approval' ||
    normalized === 'gm'
  ) {
    return 'GM HRD'
  }

  if (
    normalized === 'director approval' ||
    normalized === 'bu director' ||
    normalized === 'director bu'
  ) {
    return 'Director BU'
  }

  if (
    normalized === 'director hrd approval' ||
    normalized === 'director hrd' ||
    normalized === 'director hrd' ||
    normalized === 'director hrd approval' ||
    normalized === 'hr director' ||
    normalized === 'deputy ceo hrd' ||
    normalized === 'deputy ceo hrd approval' ||
    normalized === 'deputi ceo hrd'
  ) {
    return 'Deputi CEO HRD'
  }

  return String(label ?? '').trim()
}

function getApprovalSortOrder(label: string) {
  switch (normalizeApprovalLabel(label).toLowerCase()) {
    case 'manager bu':
      return 10
    case 'director bu':
      return 20
    case 'gm hrd':
      return 30
    case 'manager hcdr':
      return 40
    case 'deputy ceo':
      return 40
    case 'deputi ceo hrd':
      return 40
    default:
      return 999
  }
}

function buildApprovalItems(job: EmployeeRequestForm) {
  const dynamicApprovalSteps = Array.isArray(job.approval_steps)
    ? [...job.approval_steps]
        .filter((step) => Number(step?.step_order ?? 0) > 0)
        .sort((left, right) => {
          const orderDiff =
            getApprovalSortOrder(left?.approval_role_label ?? '') -
            getApprovalSortOrder(right?.approval_role_label ?? '')

          if (orderDiff !== 0) {
            return orderDiff
          }

          return Number(left?.step_order ?? 0) - Number(right?.step_order ?? 0)
        })
    : []

  if (dynamicApprovalSteps.length > 0) {
    return dynamicApprovalSteps
      .map((step) =>
        buildApprovalItem(
          normalizeApprovalLabel(step.approval_role_label || `Approval Step ${step.step_order}`),
          step.approver_name,
          step.status === 'approved' ? step.approved_at : null,
        ),
      )
      .join('')
  }

  return [
    buildApprovalItem('Director BU', job.approval_director_bu, job.approval_director_bu_date),
    buildApprovalItem('GM HRD', job.approval_gm_hrd, job.approval_gm_hrd_date),
    buildApprovalItem('Deputi CEO HRD', job.approval_director_hrd, job.approval_director_hrd_date),
  ].join('')
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

function buildTemplate(job: EmployeeRequestForm) {
  const requestedDate = job.requested_date || job.created_at
  const dynamicApprovalSteps = Array.isArray(job.approval_steps)
    ? job.approval_steps.filter((step) => Number(step?.step_order ?? 0) > 0)
    : []
  const isFullyApproved =
    dynamicApprovalSteps.length > 0
      ? dynamicApprovalSteps.every(
          (step) => step.status === 'approved' && Boolean(step.approved_at),
        )
      : Boolean(
          job.approval_director_bu_date &&
          job.approval_gm_hrd_date &&
          job.approval_director_hrd_date,
        )

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Employee Request Form (ERF)</title>
      <style>
        @page { size: A4; margin: 12mm; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          color: #111827;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.5;
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
        .header-top {
          display: flex;
          justify-content: center;
        }
        .header h1 {
          margin: 0;
          font-size: 18px;
          letter-spacing: 0.04em;
        }
        .header p {
          margin: 4px 0 0;
          font-size: 11px;
          color: #475569;
        }
        .content {
          padding: 18px 22px 22px;
        }
        .section {
          margin-top: 20px;
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
        }
        .field-row {
          display: grid;
          grid-template-columns: 165px 12px 1fr;
          gap: 6px;
          align-items: start;
          margin-top: 8px;
        }
        .approval-row {
          display: grid;
          grid-template-columns: 165px 12px minmax(180px, 260px) 42px 12px 1fr;
          gap: 6px;
          align-items: start;
          margin-top: 8px;
        }
        .paired-row {
          display: grid;
          grid-template-columns: 165px 12px minmax(140px, 1fr) 165px 12px minmax(140px, 1fr);
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
        .field-value {
          min-height: 20px;
          padding: 0 2px 3px;
          border-bottom: 1px solid #cbd5e1;
          color: #111827;
          word-break: break-word;
        }
        .approval-field-value,
        .approval-date-value,
        .paired-field-value {
          min-height: 20px;
          padding: 0 2px 3px;
          border-bottom: 1px solid #cbd5e1;
          color: #111827;
          word-break: break-word;
        }
        .approval-date-title {
          text-align: right;
        }
        .field-value.multiline {
          min-height: 60px;
        }
        .full-width {
          margin-top: 8px;
        }
        .full-width .field-row {
          grid-template-columns: 165px 12px 1fr;
        }
        .closing-box {
          padding: 12px 14px;
          border: 1px solid #cbd5e1;
        }
        .approval-note {
          margin-top: 10px;
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          font-size: 10px;
          color: #334155;
          text-align: center;
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
          <div class="header-top">
            <div>
              <h1>Employee Request Form (ERF)</h1>
              <p>Recruitment request document</p>
            </div>
          </div>
        </div>

        <div class="content">
          <div class="section">
            <p class="section-title">Request Information</p>
            ${buildRow('Request Date', formatDateDisplay(requestedDate))}
            ${buildRow('Main Position', lineValue(job.main_position))}
            ${buildRow('Business Unit Category', lineValue(stripLeadingNumberCode(job.business_unit)))}
            ${buildRow('Department', lineValue(stripLeadingNumberCode(job.department)))}
            ${buildRow('Designation', lineValue(stripLeadingNumberCode(job.designation)))}
            ${buildRow('Site', lineValue(job.site))}
            ${buildRow('Working Location', lineValue(job.working_location))}
            ${buildRow('Required Date', formatDateDisplay(job.required_date))}
            ${buildRow('Employment Status', lineValue(job.employment_status))}
            ${buildRow('Cost Center PT', lineValue(job.pt_pembebanan))}
            ${buildRow(
              'Probation/Contract Period',
              job.periode_probation ? `${escapeHtml(job.periode_probation)} months` : '-',
            )}
            ${buildRow('Direct Head', nameOnly(job.direct_manager))}
            ${buildRow('Position Status', lineValue(job.position_status))}
          </div>

          <div class="section">
            <p class="section-title">Sistem Approval</p>
            ${buildApprovalItem('Requester', job.created_by_name, formatDateDisplay(requestedDate))}
            ${buildApprovalItems(job)}
            ${
              isFullyApproved
                ? `
            <div class="approval-note">
              This document has been electronically approved through the HRD system by the designated approvers.
            </div>`
                : ''
            }
          </div>
        </div>
      </div>
      <script>
        window.addEventListener('load', () => {
          setTimeout(() => window.print(), 250)
        })
      </script>
    </body>
  </html>`
}

export function exportEmployeeRequestFormPdf(
  job: EmployeeRequestForm,
  options: {
    previewWindow?: Window | null
  } = {},
) {
  const printWindow = openPdfPreviewWindow(
    'The PDF preview window could not be opened.',
    options.previewWindow,
  )

  renderPdfPreviewWindow(printWindow, buildTemplate(job))
}
