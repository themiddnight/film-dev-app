import type { OfflineSavedRecipeRepository } from '@/repositories/OfflineSavedRecipeRepository'
import type { Recipe } from '@/types/recipe'
import type { OfflineSavedRecipe } from '@/types/recipeCollections'
import { filmDevDb } from './localDb'

export class LocalOfflineSavedRecipeRepository implements OfflineSavedRecipeRepository {
  async getAll(): Promise<OfflineSavedRecipe[]> {
    return filmDevDb.offlineSavedRecipes.orderBy('saved_at').reverse().toArray()
  }

  async getAllIds(): Promise<string[]> {
    const entries = await this.getAll()
    return entries.map((entry) => entry.recipe_id)
  }

  async getByRecipeId(recipeId: string): Promise<OfflineSavedRecipe | null> {
    return (await filmDevDb.offlineSavedRecipes.get(recipeId)) ?? null
  }

  async isSaved(recipeId: string): Promise<boolean> {
    const found = await this.getByRecipeId(recipeId)
    return !!found
  }

  async save(recipe: Recipe): Promise<void> {
    await filmDevDb.offlineSavedRecipes.put({
      recipe_id: recipe.id,
      recipe_snapshot: recipe,
      saved_at: new Date().toISOString(),
      source_updated_at: recipe.updated_at,
    })
  }

  async delete(recipeId: string): Promise<void> {
    await filmDevDb.offlineSavedRecipes.delete(recipeId)
  }
}
