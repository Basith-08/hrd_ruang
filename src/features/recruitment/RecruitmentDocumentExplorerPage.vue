<template>
  <div class="flex w-full flex-col gap-4">
    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div class="max-w-3xl">
          <p class="app-dashboard-eyebrow">
            {{ text('portalDocumentExplorer.page.eyebrow') }}
          </p>
          <h1 class="app-dashboard-title mt-3">
            {{ text('page.portalDocumentExplorer') }}
          </h1>
          <p class="app-dashboard-copy mt-3 max-w-2xl">
            {{ text('portalDocumentExplorer.page.description') }}
          </p>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row xl:flex-none">
          <AppActionButton
            class="inline-flex min-h-11 min-w-[120px] items-center justify-center"
            :label="text('portalDocumentExplorer.page.actions.collapseAll')"
            variant="secondary"
            :disabled="loading"
            @click="handleCollapseAll"
          />
          <AppActionButton
            class="inline-flex min-h-11 min-w-[120px] items-center justify-center"
            :label="text('common.actions.refresh')"
            :loading-label="text('common.loading')"
            :loading="loading"
            variant="secondary"
            @click="handleRefresh"
          />
        </div>
      </div>
    </section>

    <AppAlert :message="error" />

    <RecruitmentDocumentExplorerFinderSection
      :tree="finderTree"
      :finder-reset-key="finderResetKey"
      :loading="loading"
      :opening-file-ids="openingFileIds"
      :stats-label="explorerStatsLabel"
      :finder-view-label="text('portalDocumentExplorer.page.finderView')"
      :description="text('portalDocumentExplorer.page.finderDescription')"
      :loading-label="text('portalDocumentExplorer.page.loadingDocuments')"
      :empty-label="text('portalDocumentExplorer.page.empty')"
      :opening-file-label="text('portalDocumentExplorer.page.preparingDocument')"
      :is-file-node="isFileNode"
      :open-file="openFinderFile"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { useLocale } from '@/composables/useLocale'
import type { CandidateDocumentExplorerItem } from '@/domain/entities/CandidateDocumentExplorer'
import type {
  FinderFileKind,
  FinderNode,
} from '@/features/recruitment/types/RecruitmentDocumentExplorerPage.type'
import { callBackendApi } from '@/infrastructure/http/backendApi'
import { getPublicAppConfig } from '@/infrastructure/runtime/publicConfig'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import { useCandidateDocumentExplorerViewModel } from '@/viewmodels/useCandidateDocumentExplorerViewModel'
import RecruitmentDocumentExplorerFinderSection from './components/RecruitmentDocumentExplorerFinderSection.vue'

const { candidatePhotographBucket } = getPublicAppConfig()

const { items, loading, error, refreshItems } = useCandidateDocumentExplorerViewModel()
const appToast = useAppToast()
const { text } = useLocale()

const finderResetKey = ref(0)
const openingFileIds = ref<string[]>([])

const explorerStatsLabel = computed(() => {
  const totalCandidates = items.value.length
  const totalFiles = items.value.reduce((sum, item) => {
    const documentCount = item.documents.reduce((count, group) => count + group.files.length, 0)

    return sum + documentCount + (item.photograph ? 1 : 0)
  }, 0)

  const candidateLabel =
    totalCandidates === 1
      ? text('portalDocumentExplorer.page.stats.candidate.single', { count: totalCandidates })
      : text('portalDocumentExplorer.page.stats.candidate.multiple', { count: totalCandidates })
  const assetLabel =
    totalFiles === 1
      ? text('portalDocumentExplorer.page.stats.asset.single', { count: totalFiles })
      : text('portalDocumentExplorer.page.stats.asset.multiple', { count: totalFiles })

  return `${candidateLabel} • ${assetLabel}`
})

const finderTree = computed<FinderNode>(() => {
  const root: FinderNode = {
    id: 'root',
    label: text('portalDocumentExplorer.tree.root'),
    nodeType: 'group',
    children: [],
  }

  const ptMap = new Map<string, FinderNode>()

  for (const item of items.value) {
    const ptName = item.pt_name || text('portalDocumentExplorer.tree.empty.pt')
    const departmentName = item.department_name || text('portalDocumentExplorer.tree.empty.department')
    const designationName = item.designation_name || text('portalDocumentExplorer.tree.empty.designation')
    const mainPosition = item.main_position || text('portalDocumentExplorer.tree.empty.mainPosition')

    let ptNode = ptMap.get(ptName)
    if (!ptNode) {
      ptNode = createGroupNode(`pt:${ptName}`, ptName)
      ptMap.set(ptName, ptNode)
      root.children?.push(ptNode)
    }

    let departmentNode = ptNode.children?.find(
      (child) => child.id === `dept:${ptName}:${departmentName}`,
    )
    if (!departmentNode) {
      departmentNode = createGroupNode(`dept:${ptName}:${departmentName}`, departmentName)
      ptNode.children?.push(departmentNode)
    }

    let designationNode = departmentNode.children?.find(
      (child) => child.id === `designation:${ptName}:${departmentName}:${designationName}`,
    )
    if (!designationNode) {
      designationNode = createGroupNode(
        `designation:${ptName}:${departmentName}:${designationName}`,
        designationName,
      )
      departmentNode.children?.push(designationNode)
    }

    let mainPositionNode = designationNode.children?.find(
      (child) =>
        child.id === `position:${ptName}:${departmentName}:${designationName}:${mainPosition}`,
    )
    if (!mainPositionNode) {
      mainPositionNode = createGroupNode(
        `position:${ptName}:${departmentName}:${designationName}:${mainPosition}`,
        mainPosition,
      )
      designationNode.children?.push(mainPositionNode)
    }

    mainPositionNode.children?.push(createCandidateNode(item))
  }

  return root
})

function createGroupNode(id: string, label: string): FinderNode {
  return {
    id,
    label,
    nodeType: 'group',
    children: [],
  }
}

function createCandidateNode(item: CandidateDocumentExplorerItem): FinderNode {
  return {
    id: item.id,
    label: item.candidate_name,
    nodeType: 'candidate',
    children: buildCandidateFileNodes(item),
  }
}

function buildCandidateFileNodes(item: CandidateDocumentExplorerItem): FinderNode[] {
  const categories: FinderNode[] = []
  const photographPath = String(item.photograph ?? '').trim()

  if (photographPath) {
    categories.push(
      createCategoryNode({
        candidateId: item.id,
        groupKey: 'photograph',
        categoryLabel: getDocumentLabel('photograph'),
        files: [
          createFileNode({
            candidateId: item.id,
            candidateFormId: item.id,
            bucket: candidatePhotographBucket,
            groupKey: 'photograph',
            path: photographPath,
            storageSource: item.storage_source ?? 'dashboard',
          }),
        ],
      }),
    )
  }

  for (const documentGroup of item.documents) {
    const files = documentGroup.files.map((path) =>
      createFileNode({
        candidateId: item.id,
        candidateFormId: item.id,
        bucket: documentGroup.bucket,
        groupKey: documentGroup.key,
        path,
        storageSource: documentGroup.storage_source ?? item.storage_source ?? 'dashboard',
      }),
    )

    if (files.length === 0) {
      continue
    }

    categories.push(
      createCategoryNode({
        candidateId: item.id,
        groupKey: documentGroup.key,
        categoryLabel: getDocumentLabel(documentGroup.key),
        files,
      }),
    )
  }

  return categories.sort((left, right) => left.label.localeCompare(right.label))
}

function createCategoryNode({
  candidateId,
  groupKey,
  categoryLabel,
  files,
}: {
  candidateId: string
  groupKey: string
  categoryLabel: string
  files: FinderNode[]
}): FinderNode {
  return {
    id: `${candidateId}:category:${groupKey}`,
    label: categoryLabel,
    nodeType: 'category',
    children: files,
  }
}

function createFileNode({
  candidateId,
  candidateFormId,
  bucket,
  groupKey,
  path,
  storageSource,
}: {
  candidateId: string
  candidateFormId: string
  bucket: string
  groupKey: string
  path: string
  storageSource: 'dashboard' | 'candidate_service' | null
}): FinderNode {
  const normalizedPath = String(path).trim()
  const fileKind = getFileKind(normalizedPath)

  return {
    id: `${candidateId}:${groupKey}:${normalizedPath}`,
    label: getFileLabel(groupKey, normalizedPath),
    nodeType: 'file',
    bucket,
    candidateFormId,
    path: normalizedPath,
    fileKind,
    storageSource,
    children: [],
  }
}

function isFileNode(node: FinderNode) {
  return node.nodeType === 'file' && !!node.bucket && !!node.path
}

function resolveCandidateFormId(node: FinderNode) {
  const directCandidateFormId = String(node.candidateFormId ?? '').trim()
  if (directCandidateFormId) {
    return directCandidateFormId
  }

  if (node.nodeType !== 'file') {
    return ''
  }

  const separatorIndex = String(node.id ?? '').indexOf(':')
  if (separatorIndex <= 0) {
    return ''
  }

  return node.id.slice(0, separatorIndex).trim()
}

async function openFinderFile(node: FinderNode) {
  if (!isFileNode(node)) {
    return
  }

  const candidateFormId = resolveCandidateFormId(node)
  if (!candidateFormId) {
    appToast.error(text('portalDocumentExplorer.errors.openFile'))
    return
  }

  const fileId = String(node.id ?? '').trim()
  if (fileId && openingFileIds.value.includes(fileId)) {
    return
  }

  if (fileId) {
    openingFileIds.value = [...openingFileIds.value, fileId]
  }

  try {
    const url = await createSignedUrl(
      node.bucket!,
      candidateFormId,
      node.path!,
      node.storageSource ?? 'dashboard',
    )
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch (err) {
    const message = err instanceof Error ? err.message : text('portalDocumentExplorer.errors.openFile')
    appToast.error(message)
  } finally {
    if (fileId) {
      openingFileIds.value = openingFileIds.value.filter((pendingFileId) => pendingFileId !== fileId)
    }
  }
}

function handleCollapseAll() {
  finderResetKey.value += 1
}

function handleRefresh() {
  void refreshExplorer()
}

async function refreshExplorer() {
  try {
    await refreshItems()
    handleCollapseAll()
  } catch (err) {
    const message = err instanceof Error ? err.message : text('portalDocumentExplorer.errors.refresh')
    appToast.error(message)
  }
}

async function createSignedUrl(
  bucket: string,
  candidateFormId: string,
  path: string,
  storageSource: 'dashboard' | 'candidate_service' | null,
) {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const payload = await callBackendApi<{ signed_url?: string }>(
    '/api/recruitment/candidate-document-explorer/sign-url',
    {
      method: 'POST',
      body: JSON.stringify({
        bucket,
        candidate_form_id: candidateFormId,
        path,
        storage_source: storageSource ?? 'dashboard',
      }),
    },
  )

  if (!payload.signed_url) {
    throw new Error(text('portalDocumentExplorer.errors.createSignedUrl'))
  }

  return payload.signed_url
}

function getDocumentLabel(groupKey: string) {
  const normalizedGroupKey = String(groupKey ?? '').trim().toLowerCase()
  const labelKeyMap: Record<string, string> = {
    photograph: 'portalDocumentExplorer.documents.photograph',
    cv: 'portalDocumentExplorer.documents.cv',
    integrity_pact: 'portalDocumentExplorer.documents.integrityPact',
    email_usage_policy: 'portalDocumentExplorer.documents.emailUsagePolicy',
    identity_card: 'portalDocumentExplorer.documents.identityCard',
    family_card: 'portalDocumentExplorer.documents.familyCard',
    latest_diploma: 'portalDocumentExplorer.documents.latestDegreeCertificate',
    academic_transcript: 'portalDocumentExplorer.documents.academicTranscript',
    certificate_of_employment: 'portalDocumentExplorer.documents.certificateOfEmployment',
    tax_id: 'portalDocumentExplorer.documents.taxId',
    bpjs_health_card: 'portalDocumentExplorer.documents.bpjsHealthCard',
    bpjs_health_statement: 'portalDocumentExplorer.documents.bpjsHealthStatement',
    bpjs_employment_card: 'portalDocumentExplorer.documents.bpjsEmploymentCard',
    bank_account_book: 'portalDocumentExplorer.documents.bankAccountBook',
    format_office: 'portalDocumentExplorer.documents.formatOffice',
    skb: 'portalDocumentExplorer.documents.skb',
    erf_document: 'portalDocumentExplorer.documents.erfDocument',
  }

  return text(labelKeyMap[normalizedGroupKey] ?? 'portalDocumentExplorer.documents.document')
}

function getFileLabel(groupKey: string, path: string) {
  const rawName = path.split('/').pop() || path
  const extensionMatch = rawName.match(/(\.[a-z0-9]+)$/i)
  const extension = extensionMatch?.[1] ?? ''
  const baseName = extension ? rawName.slice(0, -extension.length) : rawName

  const normalizedGroupKey = String(groupKey ?? '').trim().toLowerCase()
  const contextLabel = getDocumentLabel(normalizedGroupKey)
  const normalizedGroupKeyPattern = normalizedGroupKey
    .replace(/_/g, '[-_ ]*')
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\\[-_ \]\\\*/g, '[-_ ]*')

  let compactBaseName = baseName
    .replace(new RegExp(`^${normalizedGroupKeyPattern}[-_ ]*`, 'i'), '')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, '')
    .replace(/\bcandidate[-_ ]?form\b/gi, '')
    .replace(/\bemployee[-_ ]?forms?\b/gi, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (/^[a-z0-9]{5,14}$/i.test(compactBaseName)) {
    compactBaseName = ''
  }

  if (compactBaseName.length > 36) {
    compactBaseName = compactBaseName.slice(0, 36).trim()
  }

  const finalBaseName = compactBaseName || contextLabel
  return `${finalBaseName}${extension}`
}

function getFileKind(path: string): FinderFileKind {
  if (/\.(png|jpe?g|webp|gif|bmp|svg|heic|heif)$/i.test(path)) {
    return 'image'
  }

  if (/\.pdf$/i.test(path)) {
    return 'pdf'
  }

  return 'file'
}
</script>
