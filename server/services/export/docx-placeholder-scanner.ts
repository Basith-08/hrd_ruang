import PizZip from 'pizzip'

import { createHttpError } from '~~/server/lib/errors.js'
import { normalizeDocxPlaceholderMarkup } from './docx-placeholder-normalizer'

const placeholderPattern = /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g
const scannedXmlPattern = /^word\/(document|header\d+|footer\d+)\.xml$/

export function scanDocxPlaceholders(templateBuffer: Buffer) {
  let zip: PizZip

  try {
    zip = new PizZip(templateBuffer)
  } catch (error) {
    throw createHttpError(400, error instanceof Error ? error.message : 'Invalid DOCX file.')
  }

  normalizeDocxPlaceholderMarkup(zip)

  const uniqueFields = new Set<string>()
  const scannedFileNames = Object.keys(zip.files).filter((fileName) => scannedXmlPattern.test(fileName))

  for (const fileName of scannedFileNames) {
    const xmlContent = zip.file(fileName)?.asText() ?? ''
    let match: RegExpExecArray | null

    placeholderPattern.lastIndex = 0
    while ((match = placeholderPattern.exec(xmlContent)) !== null) {
      const fieldKey = String(match[1] ?? '').trim()
      if (fieldKey) {
        uniqueFields.add(fieldKey)
      }
    }
  }

  return [...uniqueFields]
}
