// repositories/RecipeRepository.ts
// Interface สำหรับ data access layer ของ recipes
// Phase 1-2: LocalRecipeRepository (static data)
// Phase 3: ApiRecipeRepository (REST API)

import type { Recipe } from '../types/recipe'

export interface RecipeRepository {
  getAll(): Promise<Recipe[]>
  getById(id: string): Promise<Recipe | null>
}
