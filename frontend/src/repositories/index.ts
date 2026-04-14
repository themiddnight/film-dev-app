// repositories/index.ts
// Module-level singletons — swap only these 2 lines when Phase 3 is ready:
//   import { ApiRecipeRepository } from './api/ApiRecipeRepository'
//   import { ApiKitRepository } from './api/ApiKitRepository'
//   export const recipeRepo: RecipeRepository = new ApiRecipeRepository(httpClient)
//   export const kitRepo: KitRepository = new ApiKitRepository(httpClient)

import type { RecipeRepository } from './RecipeRepository'
import type { KitRepository } from './KitRepository'
import type { InventoryRepository } from './InventoryRepository'
import type { SessionRepository } from './SessionRepository'
import type { FavoriteRecipeRepository } from './FavoriteRecipeRepository'
import type { OfflineSavedRecipeRepository } from './OfflineSavedRecipeRepository'
import { LocalRecipeRepository } from './local/LocalRecipeRepository'
import { LocalKitRepository } from './local/LocalKitRepository'
import { LocalInventoryRepository } from './local/LocalInventoryRepository'
import { LocalSessionRepository } from './local/LocalSessionRepository'
import { LocalFavoriteRecipeRepository } from './local/LocalFavoriteRecipeRepository'
import { LocalOfflineSavedRecipeRepository } from './local/LocalOfflineSavedRecipeRepository'

export const recipeRepo: RecipeRepository = new LocalRecipeRepository()
export const kitRepo: KitRepository = new LocalKitRepository()
export const inventoryRepo: InventoryRepository = new LocalInventoryRepository()
export const sessionRepo: SessionRepository = new LocalSessionRepository()
export const favoriteRecipeRepo: FavoriteRecipeRepository = new LocalFavoriteRecipeRepository()
export const offlineSavedRecipeRepo: OfflineSavedRecipeRepository = new LocalOfflineSavedRecipeRepository()

// Re-export interfaces for consumers that need them
export type { RecipeRepository } from './RecipeRepository'
export type { KitRepository } from './KitRepository'
export type { InventoryRepository } from './InventoryRepository'
export type { SessionRepository } from './SessionRepository'
export type { FavoriteRecipeRepository } from './FavoriteRecipeRepository'
export type { OfflineSavedRecipeRepository } from './OfflineSavedRecipeRepository'
