import Dexie, { type Table } from 'dexie'
import type { FavoriteRecipe, OfflineSavedRecipe } from '../../types/recipeCollections'

class FilmDevDb extends Dexie {
  favoriteRecipes!: Table<FavoriteRecipe, string>
  offlineSavedRecipes!: Table<OfflineSavedRecipe, string>

  constructor() {
    super('FilmDevDB')

    this.version(1).stores({
      favoriteRecipes: '&recipe_id, created_at',
      offlineSavedRecipes: '&recipe_id, saved_at, source_updated_at',
    })
  }
}

export const filmDevDb = new FilmDevDb()
