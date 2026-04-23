import type { InventoryRepository } from '@/repositories/InventoryRepository'
import type { InventoryFilter, InventoryItem } from '@/types/inventory'
import type { RecipeStepType } from '@/types/recipe'

const STORAGE_KEY = 'inventory'

function nowIso(): string {
  return new Date().toISOString()
}

function startOfDay(isoDate: string): number {
  const d = new Date(isoDate)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function deriveStatus(item: InventoryItem): InventoryItem['status'] {
  if (item.status === 'exhausted') return 'exhausted'
  if (!item.shelf_life_days) return item.status

  const ageDays = Math.floor((startOfDay(nowIso()) - startOfDay(item.mixed_date)) / (1000 * 60 * 60 * 24))
  if (ageDays >= item.shelf_life_days) return 'expired'
  return 'active'
}

export class LocalInventoryRepository implements InventoryRepository {
  private load(): InventoryItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []

      const parsed = JSON.parse(raw) as InventoryItem[]
      return parsed.map((item) => ({ ...item, status: deriveStatus(item) }))
    } catch {
      return []
    }
  }

  private persist(items: InventoryItem[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }

  async getAll(filter?: InventoryFilter): Promise<InventoryItem[]> {
    const items = this.load()
    if (!filter) return items

    return items.filter((item) => {
      if (filter.step_type && item.step_type !== filter.step_type) return false
      if (filter.status && item.status !== filter.status) return false
      if (filter.search) {
        const q = filter.search.toLowerCase()
        const text = `${item.name} ${item.notes ?? ''}`.toLowerCase()
        if (!text.includes(q)) return false
      }
      return true
    })
  }

  async getById(id: string): Promise<InventoryItem | null> {
    return this.load().find((item) => item.id === id) ?? null
  }

  async getByStepType(type: RecipeStepType): Promise<InventoryItem[]> {
    return this.getAll({ step_type: type })
  }

  async save(item: InventoryItem): Promise<void> {
    const items = this.load()
    const now = nowIso()
    const normalized: InventoryItem = {
      ...item,
      created_at: item.created_at || now,
      updated_at: now,
      status: deriveStatus(item),
    }

    const idx = items.findIndex((it) => it.id === normalized.id)
    if (idx === -1) items.push(normalized)
    else items[idx] = normalized
    this.persist(items)
  }

  async updateUseCount(id: string, rolls_to_add: number): Promise<void> {
    const items = this.load()
    const idx = items.findIndex((item) => item.id === id)
    if (idx === -1) throw new Error(`Inventory item not found: ${id}`)

    items[idx] = {
      ...items[idx],
      use_count: Math.max(0, items[idx].use_count + rolls_to_add),
      updated_at: nowIso(),
    }

    this.persist(items)
  }

  async updateStatus(id: string, status: InventoryItem['status']): Promise<void> {
    const items = this.load()
    const idx = items.findIndex((item) => item.id === id)
    if (idx === -1) throw new Error(`Inventory item not found: ${id}`)

    items[idx] = {
      ...items[idx],
      status,
      updated_at: nowIso(),
    }

    this.persist(items)
  }

  async delete(id: string): Promise<void> {
    const items = this.load()
    this.persist(items.filter((item) => item.id !== id))
  }
}
