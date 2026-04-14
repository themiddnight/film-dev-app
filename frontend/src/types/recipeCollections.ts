import type { Recipe } from './recipe'

export type FavoriteRecipe = {
  recipe_id: string
  created_at: string
}

export type OfflineSavedRecipe = {
  recipe_id: string
  recipe_snapshot: Recipe
  saved_at: string
  source_updated_at?: string
}
