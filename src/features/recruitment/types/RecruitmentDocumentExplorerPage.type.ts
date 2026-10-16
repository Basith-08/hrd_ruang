export type FinderNodeType = 'group' | 'candidate' | 'category' | 'file'
export type FinderFileKind = 'image' | 'pdf' | 'file'

export interface FinderNode {
  id: string
  label: string
  nodeType: FinderNodeType
  children?: FinderNode[]
  bucket?: string
  candidateFormId?: string
  path?: string
  fileKind?: FinderFileKind
  storageSource?: 'dashboard' | 'candidate_service' | null
}
