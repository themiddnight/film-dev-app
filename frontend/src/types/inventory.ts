import type { PushPull, RecipeStepType } from './recipe'

export type DeveloperBathRole = 'single' | 'bath_a' | 'bath_b'

export type InventoryItem = {
  id: string
  name: string
  recipe_id: string
  recipe_snapshot?: {
    name: string
    step_type: RecipeStepType
  }
  step_type: RecipeStepType
  developer_bath_role?: DeveloperBathRole
  bath_id?: string           // FK → Bath.id ใน recipe.baths[] JSONB — two-bath only
  n_level?: PushPull
  bottle_type: 'one-shot' | 'reusable'
  mixed_date: string
  shelf_life_days?: number
  use_count: number
  max_rolls?: number
  status: 'active' | 'exhausted' | 'expired'
  notes?: string
  created_at: string
  updated_at: string
}

export type InventoryFilter = {
  step_type?: RecipeStepType
  status?: InventoryItem['status']
  search?: string
}
