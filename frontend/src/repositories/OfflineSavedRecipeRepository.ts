import type { Recipe } from '../types/recipe'
import type { OfflineSavedRecipe } from '../types/recipeCollections'

export interface OfflineSavedRecipeRepository {
  getAll(): Promise<OfflineSavedRecipe[]>
  getAllIds(): Promise<string[]>
  getByRecipeId(recipeId: string): Promise<OfflineSavedRecipe | null>
  isSaved(recipeId: string): Promise<boolean>
  save(recipe: Recipe): Promise<void>
  delete(recipeId: string): Promise<void>
}
