// repositories/local/LocalRecipeRepository.ts
// Phase 1-2 implementation: อ่านจาก static data ใน src/data/
// Phase 3: swap ออกเป็น ApiRecipeRepository โดยไม่แตะ component

import type { RecipeRepository } from '../RecipeRepository'
import type { Recipe } from '../../types/recipe'
import { recipes as allRecipes } from '../../data'

export class LocalRecipeRepository implements RecipeRepository {
  async getAll(): Promise<Recipe[]> {
    return [...allRecipes]
  }

  async getById(id: string): Promise<Recipe | null> {
    return allRecipes.find((r) => r.id === id) ?? null
  }
}
