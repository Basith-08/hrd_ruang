import type { CandidateForm } from '@/domain/entities/CandidateForm'
import { formatDateDisplay } from '@/presentation/utils/dateFormat'

type WorkbookUtils = {
  json_to_sheet: (data: Record<string, unknown>[]) => Record<string, unknown>
  book_append_sheet: (
    workbook: any,
    sheet: Record<string, unknown>,
    name?: string,
    roll?: boolean,
  ) => void
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

function boolDisplay(v: boolean | null | undefined): string {
  return v === true ? 'Ya' : v === false ? 'Tidak' : '-'
}

function colLetter(index: number): string {
  return index < 26
    ? String.fromCharCode(65 + index)
    : `A${String.fromCharCode(65 + index - 26)}`
}

function applyHeaderStyle(sheet: Record<string, unknown>, count: number) {
  const style = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { patternType: 'solid', fgColor: { rgb: '1D4ED8' } },
    alignment: { horizontal: 'center', wrapText: true },
  }
  for (let i = 0; i < count; i++) {
    const cell = `${colLetter(i)}1`
    const cellData = sheet[cell] as { s?: unknown } | undefined
    if (cellData) cellData.s = style
  }
}

function buildSheets(candidate: CandidateForm) {
  const fullName =
    candidate.full_name
    || [candidate.first_name, candidate.middle_name, candidate.last_name].filter(Boolean).join(' ')
    || '-'
  const payroll = candidate.employee_payroll_profile ?? null
  const ps = candidate.personal_statement

  const main = {
    'Nama Lengkap': fullName,
    'Email': displayValue(candidate.personal_email),
    'No. Telepon': displayValue(candidate.phone_number),
    'No. Telepon Rumah': displayValue(candidate.home_phone),
    'Instagram': displayValue(candidate.instagram),
    'LinkedIn': displayValue(candidate.linkedin),
    'Sumber Kandidat': displayValue(candidate.candidate_source),
    'Kode Karyawan': displayValue(candidate.employee_code),
    'ID Kandidat': displayValue(candidate.candidate_id),
    'Tanggal Lamaran': formatDateDisplay(candidate.date_application),
    'Notice Period': displayValue(candidate.notice_period),
    'Lokasi Penempatan': displayValue(candidate.hire_location),
    'Tanggal Mulai Tersedia': formatDateDisplay(candidate.available_start_date),
    'Tanggal Bergabung': formatDateDisplay(candidate.join_date),
    'Tanggal Lahir': formatDateDisplay(candidate.date_of_birth),
    'Tempat Lahir': displayValue(candidate.place_of_birth),
    'Jenis Kelamin': displayValue(candidate.gender),
    'Kewarganegaraan': displayValue(candidate.nationality),
    'Agama': displayValue(candidate.religion),
    'Status Pernikahan': displayValue(candidate.marital_status),
    'Suku': displayValue(candidate.ethnic),
    'Golongan Darah': displayValue(candidate.blood_type),
    'Jenis Identitas': displayValue(candidate.id_type),
    'No. Identitas': displayValue(candidate.id_no),
    'Alamat KTP': displayValue(candidate.id_card_address),
    'Alamat Domisili': displayValue(candidate.residential_address),
    'Jenis Transportasi': displayValue(candidate.transportation_type),
    'Kepemilikan Transportasi': displayValue(candidate.transportation_ownership),
    'Status Kepemilikan Rumah': displayValue(candidate.residence_ownership),
    'PT (ERF)': displayValue(candidate.employee_request_form?.pt_name),
    'Departemen (ERF)': displayValue(candidate.employee_request_form?.department),
    'Posisi (ERF)': displayValue(candidate.employee_request_form?.main_position),
    'Site (ERF)': displayValue(candidate.employee_request_form?.site),
    'Bank': displayValue(payroll?.bank_name),
    'No. Rekening': displayValue(payroll?.bank_account_number),
    'Nama Pemilik Rekening': displayValue(payroll?.account_holder_name),
    'Cabang Bank': displayValue(payroll?.branch_name),
    'NPWP': displayValue(payroll?.tax_identification_number),
    'Preferensi BPJS Kesehatan': displayValue(payroll?.bpjs_health_enrollment_preference),
    'Alasan Tolak BPJS Kesehatan': displayValue(payroll?.bpjs_health_decline_reason),
    'Keterangan Tolak BPJS Kesehatan': displayValue(payroll?.bpjs_health_decline_reason_other),
    'Status BPJS Ketenagakerjaan': displayValue(payroll?.bpjs_employment_status),
  }

  const family = candidate.family_and_emergency.map((item, idx) => ({
    'No': idx + 1,
    'Nama': displayValue(item.name),
    'Kategori': displayValue(item.category),
    'Hubungan': displayValue(item.relationship),
    'Jenis Kelamin': displayValue(item.gender),
    'Tempat & Tanggal Lahir': displayValue(item.place_and_date_of_birth),
    'Pendidikan': displayValue(item.education),
    'Pekerjaan': displayValue(item.occupation),
    'Keterangan': displayValue(item.description),
    'Catatan': displayValue(item.remarks),
  }))

  const education = candidate.education.map((item, idx) => ({
    'No': idx + 1,
    'Kategori': displayValue(item.category),
    'Jenjang': displayValue(item.level),
    'Institusi': displayValue(item.institution),
    'Kota': displayValue(item.city),
    'Jurusan': displayValue(item.major),
    'Tahun Masuk': displayValue(item.from_year),
    'Tahun Lulus': displayValue(item.to_year),
    'Keterangan': displayValue(item.description),
  }))

  const workHistory = candidate.work_history.map((item, idx) => ({
    'No': idx + 1,
    'Perusahaan': displayValue(item.company),
    'Alamat Perusahaan': displayValue(item.company_address),
    'No. Telepon Perusahaan': displayValue(item.company_phone),
    'Posisi': displayValue(item.position),
    'Atasan Langsung': displayValue(item.direct_superior_title),
    'Struktur Organisasi': displayValue(item.organization_structure),
    'Tahun Masuk': displayValue(item.from_year),
    'Tahun Keluar': displayValue(item.to_year),
    'Alasan Keluar': displayValue(item.reason_to_quitting),
    'Gaji Terakhir': displayValue(item.last_salary),
    'Benefit': displayValue(item.benefit),
    'Keterangan': displayValue(item.description),
  }))

  const languages = candidate.candidate_languages.map((item, idx) => ({
    'No': idx + 1,
    'Bahasa': displayValue(item.language_name),
    'Berbicara': displayValue(item.speaking),
    'Membaca': displayValue(item.reading),
    'Mendengarkan': displayValue(item.listening),
    'Menulis': displayValue(item.writing),
  }))

  const skills = candidate.candidate_skills.map((item, idx) => ({
    'No': idx + 1,
    'Keahlian': displayValue(item.skill_name),
    'Keterangan': displayValue(item.description),
  }))

  const references = candidate.candidate_references.map((item, idx) => ({
    'No': idx + 1,
    'Nama': displayValue(item.name),
    'No. Telepon': displayValue(item.phone_number),
    'Hubungan': displayValue(item.relationship),
    'Jabatan': displayValue(item.position),
  }))

  const personalStatement = ps
    ? [{
        'Bersedia Kontrak': boolDisplay(ps.contract),
        'Periode Kontrak': displayValue(ps.contract_period),
        'Bersedia Perjalanan Dinas': boolDisplay(ps.business_trip),
        'Gaji yang Diharapkan': displayValue(ps.expected_salary),
        'Pernah Melamar Sebelumnya': boolDisplay(ps.previous_application),
        'Detail Lamaran Sebelumnya': displayValue(ps.previous_application_details),
        'Izin Reference Check': boolDisplay(ps.reference_check_allowed),
        'Alasan Reference Check': displayValue(ps.reference_check_reason),
        'Keluarga / Teman di Perusahaan': boolDisplay(ps.family_or_friend_in_company),
        'Detail Keluarga / Teman': displayValue(ps.family_or_friend_details),
        'Pernah Sakit Serius': boolDisplay(ps.serious_illness),
        'Detail Sakit Serius': displayValue(ps.serious_illness_details),
        'Pernah Kecelakaan Serius': boolDisplay(ps.serious_accident_boolean),
        'Detail Kecelakaan Serius': displayValue(ps.serious_accident_details),
        'Pernah Tes Psikologi': boolDisplay(ps.psychological_test),
        'Lokasi Tes Psikologi': displayValue(ps.psychological_test_location),
        'Tujuan Tes Psikologi': displayValue(ps.psychological_test_purpose),
        'Masalah Hukum Perusahaan': boolDisplay(ps.company_legal_issue),
        'Detail Masalah Hukum Perusahaan': displayValue(ps.company_legal_issue_details),
        'Kasus Perdata / Pidana': boolDisplay(ps.civil_or_criminal_case),
        'Detail Kasus Perdata / Pidana': displayValue(ps.civil_or_criminal_case_details),
      }]
    : []

  const docs = candidate.employee_documents ?? {}
  const documents = (Object.keys(docs) as (keyof typeof docs)[])
    .filter((key) => Array.isArray(docs[key]) && (docs[key] as string[]).length > 0)
    .flatMap((key) =>
      (docs[key] as string[]).map((url, idx) => ({
        'Jenis Dokumen': key,
        'No': idx + 1,
        'URL / Path': url,
      })),
    )

  return { main, family, education, workHistory, languages, skills, references, personalStatement, documents }
}

export async function exportCandidateFormExcel(candidate: CandidateForm) {
  const XLSXStyle = await import('xlsx-js-style')
  const { utils, writeFile } = XLSXStyle
  const sheets = buildSheets(candidate)
  const workbook = utils.book_new()

  function addSheet(name: string, data: Record<string, unknown>[]) {
    if (data.length === 0) return
    const sheet = utils.json_to_sheet(data)
    const headers = Object.keys(data[0]!)
    applyHeaderStyle(sheet as Record<string, unknown>, headers.length)
    sheet['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 2, 14) }))
    utils.book_append_sheet(workbook, sheet, name)
  }

  addSheet('Data Utama', [sheets.main])
  addSheet('Keluarga & Darurat', sheets.family)
  addSheet('Pendidikan', sheets.education)
  addSheet('Riwayat Kerja', sheets.workHistory)
  addSheet('Bahasa', sheets.languages)
  addSheet('Keahlian', sheets.skills)
  addSheet('Referensi', sheets.references)
  addSheet('Pernyataan Pribadi', sheets.personalStatement)
  addSheet('Dokumen', sheets.documents)

  const fullName =
    candidate.full_name
    || [candidate.first_name, candidate.last_name].filter(Boolean).join(' ')
    || candidate.id
  writeFile(workbook, `candidate-form-${fullName}.xlsx`)
}

export async function exportAllCandidateFormsExcel(candidates: CandidateForm[], filename = 'candidate-forms-all.xlsx') {
  const XLSXStyle = await import('xlsx-js-style')
  const { utils, writeFile } = XLSXStyle
  const workbook = utils.book_new()

  appendCandidateFormCollectionSheets(workbook, utils, candidates)
  writeFile(workbook, filename)
}

export function appendCandidateFormCollectionSheets(
  workbook: any,
  utils: WorkbookUtils,
  candidates: CandidateForm[],
) {
  const addSheet = (name: string, data: Record<string, unknown>[]) => {
    if (data.length === 0) return
    const sheet = utils.json_to_sheet(data)
    const headers = Object.keys(data[0]!)
    applyHeaderStyle(sheet as Record<string, unknown>, headers.length)
    sheet['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 2, 14) }))
    utils.book_append_sheet(workbook, sheet, name)
  }

  const allMain: Record<string, unknown>[] = []
  const allFamily: Record<string, unknown>[] = []
  const allEducation: Record<string, unknown>[] = []
  const allWorkHistory: Record<string, unknown>[] = []
  const allLanguages: Record<string, unknown>[] = []
  const allSkills: Record<string, unknown>[] = []
  const allReferences: Record<string, unknown>[] = []
  const allPersonalStatement: Record<string, unknown>[] = []
  const allDocuments: Record<string, unknown>[] = []

  candidates.forEach((candidate, idx) => {
    const no = idx + 1
    const name =
      candidate.full_name
      || [candidate.first_name, candidate.middle_name, candidate.last_name].filter(Boolean).join(' ')
      || '-'
    const sheets = buildSheets(candidate)

    allMain.push({ 'No': no, 'Nama': name, ...sheets.main })

    const withRef = (rows: Record<string, unknown>[]) =>
      rows.map((row) => ({ 'No Kandidat': no, 'Nama Kandidat': name, ...row }))

    allFamily.push(...withRef(sheets.family))
    allEducation.push(...withRef(sheets.education))
    allWorkHistory.push(...withRef(sheets.workHistory))
    allLanguages.push(...withRef(sheets.languages))
    allSkills.push(...withRef(sheets.skills))
    allReferences.push(...withRef(sheets.references))
    allPersonalStatement.push(...withRef(sheets.personalStatement))
    allDocuments.push(...withRef(sheets.documents))
  })

  addSheet('Data Utama', allMain)
  addSheet('Keluarga & Darurat', allFamily)
  addSheet('Pendidikan', allEducation)
  addSheet('Riwayat Kerja', allWorkHistory)
  addSheet('Bahasa', allLanguages)
  addSheet('Keahlian', allSkills)
  addSheet('Referensi', allReferences)
  addSheet('Pernyataan Pribadi', allPersonalStatement)
  addSheet('Dokumen', allDocuments)
}
