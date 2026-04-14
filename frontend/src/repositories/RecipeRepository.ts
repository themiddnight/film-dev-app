// repositories/RecipeRepository.ts
// Interface สำหรับ data access layer ของ recipes
// Current: LocalRecipeRepository (system + personal)
// Phase 3: ApiRecipeRepository (REST API)

import type { Recipe } from '../types/recipe'
import type { RecipeFilter, RecipeStepType } from '../types/recipe'

export interface RecipeRepository {
  getAll(filter?: RecipeFilter): Promise<Recipe[]>
  getById(id: string): Promise<Recipe | null>
  getByStepType(type: RecipeStepType): Promise<Recipe[]>
  save(recipe: Recipe): Promise<void>
  delete(id: string): Promise<void>
}
