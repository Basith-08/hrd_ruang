import { describe, expect, it } from 'vitest'

import {
  extractErfFieldsFromText,
  parseErfDateValue,
  parseErfProbationMonths,
} from '../employeeRequestFormDocumentParser'

describe('extractErfFieldsFromText', () => {
  it('reads label/value rows from the official ERF template layout', () => {
    // Mirrors mammoth's raw-text output for the real ERF template docx
    // (a 3-column table: Label | ":" | value).
    const rawText = [
      'Employee Request Form',
      '',
      'Requested Date',
      '',
      ':',
      '',
      '01/07/2026',
      '',
      'Required Date',
      '',
      ':',
      '',
      '01/09/2026',
      '',
      'Cost Center PT',
      '',
      ':',
      '',
      'PT. Nusantara (Testing)',
      '',
      'BU Category',
      '',
      ':',
      '',
      '99. BU Category (Testing)',
      '',
      'BU Department',
      '',
      ':',
      '',
      '99. BU Departement (Testing)',
      '',
      'Designation',
      '',
      ':',
      '',
      'Staff',
      '',
      'Main Position',
      '',
      ':',
      '',
      'Software Engineer',
      '',
      'Employment Status',
      '',
      ':',
      '',
      'Daily',
      '',
      'Position Status',
      '',
      ':',
      '',
      'New Position MPP',
      '',
      'Probation/Contract Period',
      '',
      ':',
      '',
      '3 months',
      '',
      'Direct Head',
      '',
      ':',
      '',
      'Jane Manager',
      '',
      'Site',
      '',
      ':',
      '',
      'Head Office',
      '',
      'Working Location',
      '',
      ':',
      '',
      'Jakarta',
    ].join('\n')

    const result = extractErfFieldsFromText(rawText)

    expect(result).toEqual({
      requested_date: '01/07/2026',
      required_date: '01/09/2026',
      pt_pembebanan: 'PT. Nusantara (Testing)',
      bu_category: '99. BU Category (Testing)',
      department: '99. BU Departement (Testing)',
      designation: 'Staff',
      main_position: 'Software Engineer',
      employment_status: 'Daily',
      position_status: 'New Position MPP',
      periode_probation: '3 months',
      direct_manager: 'Jane Manager',
      site: 'Head Office',
      working_location: 'Jakarta',
    })
  })

  it('skips labels with no filled-in value', () => {
    const rawText = ['Cost Center PT', ':', '', 'BU Category', ':', 'Retail'].join('\n')

    const result = extractErfFieldsFromText(rawText)

    expect(result.pt_pembebanan).toBeUndefined()
    expect(result.bu_category).toBe('Retail')
  })

  it('does not merge the trailing Catatan notes and signature block into Working Location', () => {
    const rawText = [
      'Working Location',
      '',
      ':',
      '',
      'Jakarta',
      '',
      'Catatan : Segera dibutuhkan untuk proyek baru',
      '',
      'Diajukan oleh: ',
      '',
      'Disetujui oleh:',
      '',
      'Pemohon',
      '',
      'Direktur/Pres Dir ',
    ].join('\n')

    const result = extractErfFieldsFromText(rawText)

    expect(result.working_location).toBe('Jakarta')
  })

  it('reads label and value from the same line, as PDF table rows are commonly extracted', () => {
    // Unlike mammoth's docx raw text (each table cell on its own line), PDF
    // text extraction groups a whole table row — label, ":", and value — onto
    // a single line when they share the same vertical position on the page.
    const rawText = [
      'Employee Request Form',
      'Requested Date : 01/07/2026',
      'Required Date : 01/09/2026',
      'Cost Center PT : PT. Nusantara (Testing)',
      'BU Category : 99. BU Category (Testing)',
      'BU Department : 99. BU Departement (Testing)',
      'Designation : Staff',
      'Main Position : Software Engineer',
      'Employment Status : Daily',
      'Position Status : New Position MPP',
      'Probation/Contract Period : 3 months',
      'Direct Head : Jane Manager',
      'Site : Head Office',
      'Working Location : Jakarta',
    ].join('\n')

    const result = extractErfFieldsFromText(rawText)

    expect(result).toEqual({
      requested_date: '01/07/2026',
      required_date: '01/09/2026',
      pt_pembebanan: 'PT. Nusantara (Testing)',
      bu_category: '99. BU Category (Testing)',
      department: '99. BU Departement (Testing)',
      designation: 'Staff',
      main_position: 'Software Engineer',
      employment_status: 'Daily',
      position_status: 'New Position MPP',
      periode_probation: '3 months',
      direct_manager: 'Jane Manager',
      site: 'Head Office',
      working_location: 'Jakarta',
    })
  })

  it('reads a label whose value wraps onto the next line even when other labels share lines', () => {
    const rawText = [
      'Cost Center PT : PT. Nusantara',
      '(Testing)',
      'BU Category : Retail',
    ].join('\n')

    const result = extractErfFieldsFromText(rawText)

    expect(result.pt_pembebanan).toBe('PT. Nusantara (Testing)')
    expect(result.bu_category).toBe('Retail')
  })
})

describe('parseErfDateValue', () => {
  it('reads DD/MM/YYYY as day-first', () => {
    expect(parseErfDateValue('01/07/2026')).toBe('2026-07-01')
  })

  it('reads unambiguous ISO dates regardless of separator', () => {
    expect(parseErfDateValue('2026-07-01')).toBe('2026-07-01')
  })

  it('returns null for an unparseable value', () => {
    expect(parseErfDateValue('sometime next month')).toBeNull()
  })
})

describe('parseErfProbationMonths', () => {
  it('extracts the leading integer from a free-text period', () => {
    expect(parseErfProbationMonths('3 months')).toBe(3)
  })

  it('returns null when no number is present', () => {
    expect(parseErfProbationMonths('N/A')).toBeNull()
  })
})
