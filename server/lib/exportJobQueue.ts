type ExportJobStatus = 'queued' | 'processing' | 'completed' | 'failed'

type ExportJobResult = {
  buffer: Buffer
  contentType: string
  filename: string
}

type ExportJobExecutor = () => Promise<ExportJobResult>

type ExportJobRecord = {
  id: string
  status: ExportJobStatus
  requestedByUserId: string
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  expiresAt: string | null
  error: string | null
  result: ExportJobResult | null
  executor: ExportJobExecutor
}

const JOB_TTL_MS = 15 * 60 * 1000
const exportJobs = new Map<string, ExportJobRecord>()
const pendingJobIds: string[] = []
let workerRunning = false

function nowIso() {
  return new Date().toISOString()
}

function buildJobId() {
  return `export-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function computeExpiresAt() {
  return new Date(Date.now() + JOB_TTL_MS).toISOString()
}

function cleanupExpiredJobs() {
  const now = Date.now()

  for (const [jobId, job] of exportJobs.entries()) {
    if (!job.expiresAt) {
      continue
    }

    if (new Date(job.expiresAt).getTime() <= now) {
      exportJobs.delete(jobId)
    }
  }
}

async function runWorker() {
  if (workerRunning) {
    return
  }

  workerRunning = true

  try {
    while (pendingJobIds.length > 0) {
      const jobId = pendingJobIds.shift()
      if (!jobId) {
        continue
      }

      const job = exportJobs.get(jobId)
      if (!job || job.status !== 'queued') {
        continue
      }

      job.status = 'processing'
      job.startedAt = nowIso()

      try {
        job.result = await job.executor()
        job.status = 'completed'
        job.completedAt = nowIso()
        job.expiresAt = computeExpiresAt()
      } catch (error) {
        job.status = 'failed'
        job.error = error instanceof Error ? error.message : 'Failed to process export job.'
        job.completedAt = nowIso()
        job.expiresAt = computeExpiresAt()
      }
    }
  } finally {
    workerRunning = false
  }
}

export function enqueueExportJob(requestedByUserId: string, executor: ExportJobExecutor) {
  cleanupExpiredJobs()

  const job: ExportJobRecord = {
    id: buildJobId(),
    status: 'queued',
    requestedByUserId,
    createdAt: nowIso(),
    startedAt: null,
    completedAt: null,
    expiresAt: null,
    error: null,
    result: null,
    executor,
  }

  exportJobs.set(job.id, job)
  pendingJobIds.push(job.id)
  void runWorker()

  return job
}

export function getExportJob(jobId: string) {
  cleanupExpiredJobs()
  return exportJobs.get(jobId) ?? null
}

export function serializeExportJob(job: ExportJobRecord) {
  return {
    id: job.id,
    status: job.status,
    created_at: job.createdAt,
    started_at: job.startedAt,
    completed_at: job.completedAt,
    expires_at: job.expiresAt,
    error: job.error,
    filename: job.result?.filename ?? null,
  }
}
