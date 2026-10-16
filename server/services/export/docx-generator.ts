import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'

import { createHttpError } from '~~/server/lib/errors.js'
import { normalizeDocxPlaceholderMarkup } from './docx-placeholder-normalizer'

function normalizePayloadValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizePayloadValue(item)).join(', ')
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

function normalizePayload(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, normalizePayloadValue(value)]),
  )
}

function buildDocxErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Failed to generate DOCX document.'
  }

  const docxError = error as Error & {
    properties?: {
      errors?: Array<{ properties?: { explanation?: string }; message?: string }>
      explanation?: string
    }
  }

  const explanations = Array.isArray(docxError.properties?.errors)
    ? docxError.properties?.errors
        .map((item) => item?.properties?.explanation || item?.message || '')
        .filter(Boolean)
    : []

  if (explanations.length > 0) {
    return `Failed to generate DOCX document: ${explanations.join('; ')}`
  }

  if (docxError.properties?.explanation) {
    return `Failed to generate DOCX document: ${docxError.properties.explanation}`
  }

  return `Failed to generate DOCX document: ${error.message}`
}

export function generateDocxFromTemplate(templateBuffer: Buffer, payload: Record<string, unknown>) {
  try {
    const zip = normalizeDocxPlaceholderMarkup(new PizZip(templateBuffer))
    const document = new Docxtemplater(zip, {
      delimiters: {
        start: '{{',
        end: '}}',
      },
      paragraphLoop: true,
      linebreaks: true,
    })

    document.render(normalizePayload(payload))

    return document.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }) as Buffer
  } catch (error) {
    throw createHttpError(400, buildDocxErrorMessage(error))
  }
}
