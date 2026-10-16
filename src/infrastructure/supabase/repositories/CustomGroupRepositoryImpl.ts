import { supabase } from '@/infrastructure/supabase/client'
import type { CustomGroup } from '@/domain/entities/CustomGroup'

export class CustomGroupRepositoryImpl {
  async getAll(grupIndex: number): Promise<CustomGroup[]> {
    const tableName = `master_custom_grup_${grupIndex}`
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return data ?? []
  }

  async getById(grupIndex: number, id: string): Promise<CustomGroup | null> {
    const tableName = `master_custom_grup_${grupIndex}`
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return data
  }

  async create(grupIndex: number, data: Omit<CustomGroup, 'id' | 'created_at' | 'updated_at'>): Promise<CustomGroup> {
    const tableName = `master_custom_grup_${grupIndex}`
    const { data: created, error } = await supabase
      .from(tableName)
      .insert(data)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return created
  }

  async update(grupIndex: number, id: string, data: Partial<Omit<CustomGroup, 'id'>>): Promise<CustomGroup> {
    const tableName = `master_custom_grup_${grupIndex}`
    const { data: updated, error } = await supabase
      .from(tableName)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return updated
  }

  async delete(grupIndex: number, id: string): Promise<void> {
    const tableName = `master_custom_grup_${grupIndex}`
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  }
}

export const customGroupRepo = new CustomGroupRepositoryImpl()
