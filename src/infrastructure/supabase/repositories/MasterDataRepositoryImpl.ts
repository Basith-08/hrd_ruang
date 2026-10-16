import { supabase } from '@/infrastructure/supabase/client'
import type { MasterDataItem, MasterDataType } from '@/domain/entities/MasterData'
import type { MasterDataRequest } from '@/domain/requests/MasterDataRequest'

const tableNameByType: Record<MasterDataType, string> = {
  pt: 'master_pt',
  bu: 'master_bu',
  department: 'master_department',
  job_level: 'master_job_level',
  designation: 'master_designation',
}

export class MasterDataRepositoryImpl {
  private resolveTableName(type: MasterDataType) {
    return tableNameByType[type]
  }

  private resolveSelectQuery(type: MasterDataType) {
    if (type === 'pt') {
      return 'id, name, address, description, created_at, updated_at'
    }

    if (type === 'designation') {
      return 'id, name, description, required_date_min_months, created_at, updated_at'
    }

    if (type === 'job_level') {
      return 'id, name, description, required_date_min_months, created_at, updated_at'
    }

    return 'id, name, description, created_at, updated_at'
  }

  private resolveFallbackSelectQuery() {
    return 'id, name, description, created_at, updated_at'
  }

  private mapItem(type: MasterDataType, item: Record<string, any>): MasterDataItem {
    return {
      id: item.id,
      name: item.name,
      address: type === 'pt' ? item.address ?? null : null,
      description: item.description ?? null,
      required_date_min_months: item.required_date_min_months ?? null,
      created_at: item.created_at ?? null,
      updated_at: item.updated_at ?? null,
      parent_id: null,
      parent_name: null,
    }
  }

  private buildPayload(type: MasterDataType, input: MasterDataRequest) {
    const payload: Record<string, string | number | null> = {
      name: input.name.trim(),
      description: input.description?.trim() || null,
    }

    if (type === 'pt') {
      payload.address = input.address?.trim() || null
    }

    if (type === 'job_level' || type === 'designation') {
      payload.required_date_min_months = input.required_date_min_months ?? null
    }

    return payload
  }

  private mapItems(type: MasterDataType, data: Array<Record<string, any>>): MasterDataItem[] {
    return data.map((item) => this.mapItem(type, item))
  }

  async getAll(type: MasterDataType): Promise<MasterDataItem[]> {
    const { data, error } = await supabase
      .from(this.resolveTableName(type))
      .select(this.resolveSelectQuery(type))
      .order('name', { ascending: true })

    if (error) {
      if (type !== 'pt' && type !== 'department' && type !== 'job_level' && type !== 'designation') {
        throw new Error(error.message)
      }

      const { data: fallbackData, error: fallbackError } = await supabase
        .from(this.resolveTableName(type))
        .select(this.resolveFallbackSelectQuery())
        .order('name', { ascending: true })

      if (fallbackError) {
        throw new Error(error.message)
      }

      return this.mapItems(type, fallbackData ?? [])
    }

    return this.mapItems(type, data ?? [])
  }

  async create(type: MasterDataType, input: MasterDataRequest): Promise<MasterDataItem> {
    const { data, error } = await supabase
      .from(this.resolveTableName(type))
      .insert(this.buildPayload(type, input))
      .select(this.resolveSelectQuery(type))
      .single()

    if (error) throw new Error(error.message)
    const [item] = this.mapItems(type, data ? [data] : [])
    if (!item) throw new Error('Master data was not created.')
    return item
  }

  async update(type: MasterDataType, id: string, input: MasterDataRequest): Promise<MasterDataItem> {
    const payload = {
      ...this.buildPayload(type, input),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from(this.resolveTableName(type))
      .update(payload)
      .eq('id', id)
      .select(this.resolveSelectQuery(type))
      .single()

    if (error) throw new Error(error.message)
    const [item] = this.mapItems(type, data ? [data] : [])
    if (!item) throw new Error('Master data was not updated.')
    return item
  }

  async delete(type: MasterDataType, id: string): Promise<void> {
    const { error } = await supabase
      .from(this.resolveTableName(type))
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  }
}

export const masterDataRepo = new MasterDataRepositoryImpl()
