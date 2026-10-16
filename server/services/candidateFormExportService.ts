import XLSXStyle from 'xlsx-js-style'

import type { CandidateForm } from '@/domain/entities/CandidateForm'
import { appendCandidateFormCollectionSheets } from '@/presentation/utils/candidateFormExcelExport'

function sanitizeFilenamePart(value: string) {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildFilename(candidates: CandidateForm[]) {
  if (candidates.length === 1) {
    const candidate = candidates[0]!
    const fullName =
      candidate.full_name
      || [candidate.first_name, candidate.middle_name, candidate.last_name].filter(Boolean).join(' ')
      || candidate.id

    return `candidate-form-${sanitizeFilenamePart(fullName) || candidate.id}.xlsx`
  }

  return `candidate-forms-all-${new Date().toISOString().slice(0, 10)}.xlsx`
}

export async function createCandidateFormsExcelExport(candidates: CandidateForm[]) {
  const workbook = XLSXStyle.utils.book_new()
  appendCandidateFormCollectionSheets(workbook, XLSXStyle.utils, candidates)

  const buffer = XLSXStyle.write(workbook, {
    bookType: 'xlsx',
    type: 'buffer',
  }) as Buffer

  return {
    buffer,
    contentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename: buildFilename(candidates),
  }
}
