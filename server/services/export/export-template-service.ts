import { createHttpError } from '~~/server/lib/errors.js'
import { SUPABASE_EXPORT_BUCKET } from '~~/server/config/env.js'
import type {
  ExportTemplateFieldRecord,
  ExportTemplateRecord,
  GeneratedExportRecord,
} from '~~/types/export-template'
import { normalizeText, resolveExportFieldLabel, sanitizeFileName } from './export-utils'

const exportTemplateColumns = `
  id,
  name,
  code,
  description,
  file_name,
  file_path,
  storage_bucket,
  detected_fields,
  is_active,
  created_by,
  created_at,
  updated_at
`

const exportTemplateFieldColumns = `
  id,
  template_id,
  field_key,
  field_label,
  source_type,
  source_path,
  field_type,
  is_required,
  is_editable,
  default_value,
  created_at
`

function mapExportTemplate(record: any): ExportTemplateRecord {
  return {
    id: normalizeText(record?.id),
    name: normalizeText(record?.name),
    code: normalizeText(record?.code) || null,
    description: normalizeText(record?.description) || null,
    file_name: normalizeText(record?.file_name),
    file_path: normalizeText(record?.file_path),
    storage_bucket: normalizeText(record?.storage_bucket) || SUPABASE_EXPORT_BUCKET,
    detected_fields: Array.isArray(record?.detected_fields)
      ? record.detected_fields.map((item: unknown) => normalizeText(item)).filter(Boolean)
      : [],
    is_active: Boolean(record?.is_active),
    created_by: normalizeText(record?.created_by) || null,
    created_at: normalizeText(record?.created_at),
    updated_at: normalizeText(record?.updated_at),
  }
}

function mapExportTemplateField(record: any): ExportTemplateFieldRecord {
  return {
    id: normalizeText(record?.id),
    template_id: normalizeText(record?.template_id),
    field_key: normalizeText(record?.field_key),
    field_label: resolveExportFieldLabel(record?.field_key, record?.field_label) || null,
    source_type: normalizeText(record?.source_type) || 'auto',
    source_path: normalizeText(record?.source_path) || null,
    field_type: normalizeText(record?.field_type) || 'text',
    is_required: Boolean(record?.is_required),
    is_editable: record?.is_editable !== false,
    default_value: normalizeText(record?.default_value) || null,
    created_at: normalizeText(record?.created_at),
  }
}

function sortExportTemplateFieldsByTemplateOrder(
  fields: ExportTemplateFieldRecord[],
  detectedFields: string[],
) {
  const orderMap = new Map(
    detectedFields
      .map((fieldKey, index) => [normalizeText(fieldKey), index] as const)
      .filter(([fieldKey]) => fieldKey),
  )

  return [...fields].sort((left, right) => {
    const leftIndex = orderMap.get(normalizeText(left.field_key))
    const rightIndex = orderMap.get(normalizeText(right.field_key))

    if (leftIndex !== undefined && rightIndex !== undefined) {
      return leftIndex - rightIndex
    }

    if (leftIndex !== undefined) {
      return -1
    }

    if (rightIndex !== undefined) {
      return 1
    }

    return left.field_key.localeCompare(right.field_key)
  })
}

function ensureDocxExtension(fileName: string) {
  if (!fileName.toLowerCase().endsWith('.docx')) {
    throw createHttpError(400, 'Only .docx files are allowed.')
  }
}

export async function uploadExportTemplateFile(
  supabase: any,
  fileName: string,
  fileBuffer: Buffer,
  bucketName = SUPABASE_EXPORT_BUCKET,
) {
  ensureDocxExtension(fileName)

  const timestamp = Date.now()
  const extension = '.docx'
  const baseName = fileName.slice(0, -extension.length)
  const safeFileName = `${timestamp}-${sanitizeFileName(baseName)}${extension}`
  const filePath = `templates/${safeFileName}`

  const { error } = await supabase.storage.from(bucketName).upload(filePath, fileBuffer, {
    cacheControl: '3600',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    upsert: false,
  })

  if (error) {
    throw createHttpError(500, `Failed to upload DOCX template: ${error.message}`)
  }

  return {
    bucketName,
    filePath,
  }
}

export async function createExportTemplate(
  supabase: any,
  input: {
    name: string
    code?: string | null
    description?: string | null
    fileName: string
    filePath: string
    storageBucket?: string | null
    detectedFields: string[]
    createdBy?: string | null
  },
) {
  const { data, error } = await supabase
    .from('export_templates')
    .insert({
      name: normalizeText(input.name),
      code: normalizeText(input.code) || null,
      description: normalizeText(input.description) || null,
      file_name: normalizeText(input.fileName),
      file_path: normalizeText(input.filePath),
      storage_bucket: normalizeText(input.storageBucket) || SUPABASE_EXPORT_BUCKET,
      detected_fields: input.detectedFields,
      created_by: normalizeText(input.createdBy) || null,
    })
    .select(exportTemplateColumns)
    .single()

  if (error) {
    throw createHttpError(500, `Failed to save export template metadata: ${error.message}`)
  }

  return mapExportTemplate(data)
}

export async function deleteExportTemplate(supabase: any, templateId: string) {
  const normalizedTemplateId = normalizeText(templateId)
  if (!normalizedTemplateId) {
    return
  }

  const { error } = await supabase
    .from('export_templates')
    .delete()
    .eq('id', normalizedTemplateId)

  if (error) {
    throw createHttpError(500, `Failed to rollback export template metadata: ${error.message}`)
  }
}

export async function createExportTemplateFields(
  supabase: any,
  templateId: string,
  detectedFields: string[],
) {
  const rows = detectedFields.map((fieldKey) => ({
    template_id: templateId,
    field_key: fieldKey,
    field_label: resolveExportFieldLabel(fieldKey),
    source_type: 'auto',
    source_path: fieldKey,
    field_type: 'text',
    is_required: false,
    is_editable: true,
    default_value: null,
  }))

  const { data, error } = await supabase
    .from('export_template_fields')
    .insert(rows)
    .select(exportTemplateFieldColumns)

  if (error) {
    throw createHttpError(500, `Failed to save export template fields: ${error.message}`)
  }

  return Array.isArray(data) ? data.map(mapExportTemplateField) : []
}

export async function listActiveExportTemplates(supabase: any) {
  const { data, error } = await supabase
    .from('export_templates')
    .select(exportTemplateColumns)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    throw createHttpError(500, `Failed to load export templates: ${error.message}`)
  }

  return Array.isArray(data) ? data.map(mapExportTemplate) : []
}

export async function getExportTemplateById(supabase: any, templateId: string) {
  const normalizedTemplateId = normalizeText(templateId)
  if (!normalizedTemplateId) {
    throw createHttpError(400, 'Template id is required.')
  }

  const { data, error } = await supabase
    .from('export_templates')
    .select(exportTemplateColumns)
    .eq('id', normalizedTemplateId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    throw createHttpError(500, `Failed to load export template: ${error.message}`)
  }

  if (!data) {
    throw createHttpError(404, 'Export template was not found.')
  }

  return mapExportTemplate(data)
}

export async function listExportTemplateFields(supabase: any, templateId: string) {
  const normalizedTemplateId = normalizeText(templateId)
  if (!normalizedTemplateId) {
    throw createHttpError(400, 'Template id is required.')
  }

  const { data: templateData, error: templateError } = await supabase
    .from('export_templates')
    .select('detected_fields')
    .eq('id', normalizedTemplateId)
    .maybeSingle()

  if (templateError) {
    throw createHttpError(500, `Failed to load export template order: ${templateError.message}`)
  }

  const { data, error } = await supabase
    .from('export_template_fields')
    .select(exportTemplateFieldColumns)
    .eq('template_id', normalizedTemplateId)

  if (error) {
    throw createHttpError(500, `Failed to load export template fields: ${error.message}`)
  }

  const fields = Array.isArray(data) ? data.map(mapExportTemplateField) : []
  const detectedFields = Array.isArray(templateData?.detected_fields)
    ? templateData.detected_fields.map((item: unknown) => normalizeText(item)).filter(Boolean)
    : []

  return sortExportTemplateFieldsByTemplateOrder(fields, detectedFields)
}

export async function updateExportTemplateField(
  supabase: any,
  input: {
    templateId: string
    fieldId: string
    sourcePath?: string | null
    sourceType?: string | null
    fieldLabel?: string | null
    defaultValue?: string | null
    isEditable?: boolean
    isRequired?: boolean
  },
) {
  const templateId = normalizeText(input.templateId)
  const fieldId = normalizeText(input.fieldId)

  if (!templateId) {
    throw createHttpError(400, 'Template id is required.')
  }

  if (!fieldId) {
    throw createHttpError(400, 'Field id is required.')
  }

  const updatePayload: Record<string, unknown> = {
    source_path: normalizeText(input.sourcePath) || null,
  }

  if (input.sourceType !== undefined) {
    updatePayload.source_type = normalizeText(input.sourceType) || 'auto'
  }

  if (input.fieldLabel !== undefined) {
    updatePayload.field_label = normalizeText(input.fieldLabel) || null
  }

  if (input.defaultValue !== undefined) {
    updatePayload.default_value = normalizeText(input.defaultValue) || null
  }

  if (input.isEditable !== undefined) {
    updatePayload.is_editable = Boolean(input.isEditable)
  }

  if (input.isRequired !== undefined) {
    updatePayload.is_required = Boolean(input.isRequired)
  }

  const { data, error } = await supabase
    .from('export_template_fields')
    .update(updatePayload)
    .eq('id', fieldId)
    .eq('template_id', templateId)
    .select(exportTemplateFieldColumns)
    .maybeSingle()

  if (error) {
    throw createHttpError(500, `Failed to update export template field: ${error.message}`)
  }

  if (!data) {
    throw createHttpError(404, 'Export template field was not found.')
  }

  return mapExportTemplateField(data)
}

export async function downloadExportTemplateFile(
  supabase: any,
  template: Pick<ExportTemplateRecord, 'storage_bucket' | 'file_path'>,
) {
  const { data, error } = await supabase.storage
    .from(template.storage_bucket)
    .download(template.file_path)

  if (error) {
    throw createHttpError(404, `Template file was not found in storage: ${error.message}`)
  }

  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function deleteExportTemplateFile(
  supabase: any,
  input: {
    bucketName?: string | null
    filePath: string
  },
) {
  const bucketName = normalizeText(input.bucketName) || SUPABASE_EXPORT_BUCKET
  const filePath = normalizeText(input.filePath)

  if (!filePath) {
    return
  }

  const { error } = await supabase.storage.from(bucketName).remove([filePath])

  if (error) {
    throw createHttpError(500, `Failed to rollback uploaded DOCX template: ${error.message}`)
  }
}

export async function createGeneratedExportHistory(
  supabase: any,
  input: {
    templateId: string
    candidateId?: string | null
    fileName: string
    filePath?: string | null
    payload: Record<string, unknown>
    generatedBy?: string | null
  },
) {
  const { data, error } = await supabase
    .from('generated_exports')
    .insert({
      template_id: normalizeText(input.templateId) || null,
      candidate_id: normalizeText(input.candidateId) || null,
      file_name: normalizeText(input.fileName),
      file_path: normalizeText(input.filePath) || null,
      payload: input.payload,
      generated_by: normalizeText(input.generatedBy) || null,
    })
    .select('id, template_id, candidate_id, file_name, file_path, payload, generated_by, created_at')
    .maybeSingle()

  if (error) {
    throw createHttpError(500, `Failed to store generated export history: ${error.message}`)
  }

  return (data ?? null) as GeneratedExportRecord | null
}
