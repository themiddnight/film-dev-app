import type { FavoriteRecipeRepository } from '@/repositories/FavoriteRecipeRepository'
import type { FavoriteRecipe } from '@/types/recipeCollections'
import { filmDevDb } from './localDb'

export class LocalFavoriteRecipeRepository implements FavoriteRecipeRepository {
  async getAll(): Promise<FavoriteRecipe[]> {
    return filmDevDb.favoriteRecipes.orderBy('created_at').reverse().toArray()
  }

  async getAllIds(): Promise<string[]> {
    const entries = await this.getAll()
    return entries.map((entry) => entry.recipe_id)
  }

  async isFavorite(recipeId: string): Promise<boolean> {
    const found = await filmDevDb.favoriteRecipes.get(recipeId)
    return !!found
  }

  async save(recipeId: string): Promise<void> {
    await filmDevDb.favoriteRecipes.put({
      recipe_id: recipeId,
      created_at: new Date().toISOString(),
    })
  }

  async delete(recipeId: string): Promise<void> {
    await filmDevDb.favoriteRecipes.delete(recipeId)
  }
}
