export type ErfTemplateFieldKey =
  | 'requested_date'
  | 'required_date'
  | 'pt_pembebanan'
  | 'bu_category'
  | 'department'
  | 'designation'
  | 'main_position'
  | 'employment_status'
  | 'position_status'
  | 'periode_probation'
  | 'direct_manager'
  | 'site'
  | 'working_location'

export type ParsedErfDocumentFields = Partial<Record<ErfTemplateFieldKey, string>>

type TemplateLabelEntry = {
  key: ErfTemplateFieldKey
  labels: string[]
}

// Order matches the row order of the official ERF template so the scanner can
// find the boundary of one field's value by knowing which label comes next.
const templateLabelEntries: TemplateLabelEntry[] = [
  { key: 'requested_date', labels: ['requested date'] },
  { key: 'required_date', labels: ['required date'] },
  { key: 'pt_pembebanan', labels: ['cost center pt'] },
  { key: 'bu_category', labels: ['bu category'] },
  { key: 'department', labels: ['bu department'] },
  { key: 'designation', labels: ['designation'] },
  { key: 'main_position', labels: ['main position'] },
  { key: 'employment_status', labels: ['employment status'] },
  { key: 'position_status', labels: ['position status'] },
  { key: 'periode_probation', labels: ['probation/contract period', 'probation contract period'] },
  { key: 'direct_manager', labels: ['direct head'] },
  { key: 'site', labels: ['site'] },
  { key: 'working_location', labels: ['working location'] },
]

// Labels that exist below the data table (e.g. the free-text "Catatan" notes
// and the signature block) — recognized only as a stop boundary so they never
// get swallowed into the last data field's value, but never auto-filled themselves.
const boundaryOnlyLabels = ['catatan', 'diajukan oleh', 'disetujui oleh']

export class ErfDocumentParseError extends Error {}

function normalizeLine(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeLabel(value: string) {
  return normalizeLine(value).toLowerCase().replace(/[:\s]+$/, '')
}

// DOCX raw text (from mammoth) puts each table cell on its own line, so a
// label always sits alone on its line with the value following on later
// lines. PDF text extraction instead reads left-to-right per row, so a
// label and its value often land on the *same* line (e.g. "Requested Date
// : 01/07/2026"). Matching only a label-only line — as an earlier version
// of this scanner did — silently skipped every row in that case. Matching
// a label at the *start* of a line (optionally followed by ":" and an
// inline value) handles both layouts.
function matchLabelAtLineStart(line: string | undefined) {
  const normalized = normalizeLine(line ?? '')
  if (!normalized) return null

  const lowerLine = normalized.toLowerCase()

  for (const entry of templateLabelEntries) {
    for (const label of entry.labels) {
      if (!lowerLine.startsWith(label)) continue

      const nextChar = lowerLine.charAt(label.length)
      if (nextChar && /[a-z0-9]/i.test(nextChar)) continue

      const remainder = normalized.slice(label.length).replace(/^[\s:]+/, '').trim()
      return { entry, remainder }
    }
  }

  return null
}

function isBoundaryLine(line: string | undefined) {
  const normalized = normalizeLabel(line ?? '')
  if (!normalized) return false

  return boundaryOnlyLabels.some((label) => normalized.startsWith(label))
}

export function extractErfFieldsFromText(rawText: string): ParsedErfDocumentFields {
  const lines = rawText
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter((line) => line.length > 0 && line !== ':')

  const result: ParsedErfDocumentFields = {}
  let index = 0

  while (index < lines.length) {
    const labelMatch = matchLabelAtLineStart(lines[index])

    if (!labelMatch) {
      index += 1
      continue
    }

    const { entry, remainder } = labelMatch
    const valueParts: string[] = remainder ? [remainder] : []
    let cursor = index + 1

    while (
      cursor < lines.length
      && !matchLabelAtLineStart(lines[cursor])
      && !isBoundaryLine(lines[cursor])
    ) {
      valueParts.push(lines[cursor] ?? '')
      cursor += 1
    }

    const value = normalizeLine(valueParts.join(' '))
    if (value) {
      result[entry.key] = value
    }

    index = cursor
  }

  return result
}

async function extractTextFromDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const { value } = await mammoth.extractRawText({ arrayBuffer })
  return value
}

async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const workerUrl = (await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')).default
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdfDocument = await loadingTask.promise

  const pageTexts: string[] = []
  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber)
    const textContent = await page.getTextContent()
    const pageLines: string[] = []
    let currentLine: string[] = []
    let lastY: number | null = null

    for (const item of textContent.items as Array<{ str: string; transform: number[] }>) {
      const y = item.transform?.[5] ?? 0
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        pageLines.push(currentLine.join(' '))
        currentLine = []
      }
      currentLine.push(item.str)
      lastY = y
    }
    if (currentLine.length > 0) {
      pageLines.push(currentLine.join(' '))
    }

    pageTexts.push(pageLines.join('\n'))
  }

  return pageTexts.join('\n')
}

function isDocxFile(file: File) {
  return (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    || file.name.toLowerCase().endsWith('.docx')
  )
}

function isPdfFile(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

export async function extractErfDocumentFields(file: File): Promise<ParsedErfDocumentFields> {
  let rawText: string

  if (isDocxFile(file)) {
    rawText = await extractTextFromDocx(file)
  } else if (isPdfFile(file)) {
    rawText = await extractTextFromPdf(file)
  } else {
    throw new ErfDocumentParseError('Unsupported file type. Please upload a PDF or DOCX file.')
  }

  return extractErfFieldsFromText(rawText)
}

const dateSeparatorPattern = /^(\d{1,4})[\/\-.](\d{1,2})[\/\-.](\d{1,4})$/

export function parseErfDateValue(value: string): string | null {
  const trimmed = normalizeLine(value)
  const match = trimmed.match(dateSeparatorPattern)
  if (!match) return null

  const [, first, second, third] = match as unknown as [string, string, string, string]

  // YYYY-MM-DD (ISO, unambiguous)
  if (first.length === 4) {
    const year = Number(first)
    const month = Number(second)
    const day = Number(third)
    return isValidDateParts(year, month, day) ? toIsoDateKey(year, month, day) : null
  }

  // DD/MM/YYYY (assumed for ambiguous day/month ordering)
  const day = Number(first)
  const month = Number(second)
  const year = Number(third.length === 2 ? `20${third}` : third)
  return isValidDateParts(year, month, day) ? toIsoDateKey(year, month, day) : null
}

function isValidDateParts(year: number, month: number, day: number) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  return true
}

function toIsoDateKey(year: number, month: number, day: number) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function parseErfProbationMonths(value: string): number | null {
  const match = normalizeLine(value).match(/\d+/)
  if (!match) return null

  const parsed = Number(match[0])
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}
