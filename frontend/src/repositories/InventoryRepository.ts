import type { InventoryFilter, InventoryItem } from '@/types/inventory'
import type { RecipeStepType } from '@/types/recipe'

export interface InventoryRepository {
  getAll(filter?: InventoryFilter): Promise<InventoryItem[]>
  getById(id: string): Promise<InventoryItem | null>
  getByStepType(type: RecipeStepType): Promise<InventoryItem[]>
  save(item: InventoryItem): Promise<void>
  updateUseCount(id: string, rolls_to_add: number): Promise<void>
  updateStatus(id: string, status: InventoryItem['status']): Promise<void>
  delete(id: string): Promise<void>
}
