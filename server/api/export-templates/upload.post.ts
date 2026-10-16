import { readMultipartFormData } from 'h3'

import { requireAnyPermission } from '~~/server/lib/context.js'
import { createHttpError } from '~~/server/lib/errors.js'
import { scanDocxPlaceholders } from '~~/server/services/export/docx-placeholder-scanner'
import {
  createExportTemplate,
  createExportTemplateFields,
  deleteExportTemplate,
  deleteExportTemplateFile,
  uploadExportTemplateFile,
} from '~~/server/services/export/export-template-service'
import { normalizeText } from '~~/server/services/export/export-utils'
import { defineJsonHandler } from '~~/server/utils/api'
import { requireRequestContext } from '~~/server/utils/requestContext'

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  requireAnyPermission(context, ['export_configuration:manage'])

  const parts = await readMultipartFormData(event)
  const filePart = parts?.find((part) => part.name === 'file')
  const name = normalizeText(parts?.find((part) => part.name === 'name')?.data?.toString('utf8'))
  const description = normalizeText(parts?.find((part) => part.name === 'description')?.data?.toString('utf8'))
  const code = normalizeText(parts?.find((part) => part.name === 'code')?.data?.toString('utf8'))

  if (!filePart?.data || !filePart.filename) {
    throw createHttpError(400, 'DOCX file is required.')
  }

  if (!name) {
    throw createHttpError(400, 'Template name is required.')
  }

  if (!filePart.filename.toLowerCase().endsWith('.docx')) {
    throw createHttpError(400, 'Only .docx files are allowed.')
  }

  const fileBuffer = Buffer.from(filePart.data)
  const detectedFields = scanDocxPlaceholders(fileBuffer)

  if (!detectedFields.length) {
    throw createHttpError(400, 'No {{...}} placeholders were found in the uploaded DOCX template.')
  }

  const uploadedFile = await uploadExportTemplateFile(context.supabase, filePart.filename, fileBuffer)
  let createdTemplateId = ''

  try {
    const template = await createExportTemplate(context.supabase, {
      name,
      code: code || null,
      description: description || null,
      fileName: filePart.filename,
      filePath: uploadedFile.filePath,
      storageBucket: uploadedFile.bucketName,
      detectedFields,
      createdBy: context.userId,
    })
    createdTemplateId = template.id

    await createExportTemplateFields(context.supabase, template.id, detectedFields)

    return {
      template,
    }
  } catch (error) {
    await Promise.allSettled([
      deleteExportTemplateFile(context.supabase, {
        bucketName: uploadedFile.bucketName,
        filePath: uploadedFile.filePath,
      }),
      createdTemplateId ? deleteExportTemplate(context.supabase, createdTemplateId) : Promise.resolve(),
    ])

    throw error
  }
})
