import type { FavoriteRecipe } from '@/types/recipeCollections'

export interface FavoriteRecipeRepository {
  getAll(): Promise<FavoriteRecipe[]>
  getAllIds(): Promise<string[]>
  isFavorite(recipeId: string): Promise<boolean>
  save(recipeId: string): Promise<void>
  delete(recipeId: string): Promise<void>
}
