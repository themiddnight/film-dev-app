// repositories/index.ts
// Module-level singletons — เปลี่ยนแค่ 2 บรรทัดนี้เมื่อ Phase 3 พร้อม:
//   import { ApiRecipeRepository } from './api/ApiRecipeRepository'
//   import { ApiKitRepository } from './api/ApiKitRepository'
//   export const recipeRepo: RecipeRepository = new ApiRecipeRepository(httpClient)
//   export const kitRepo: KitRepository = new ApiKitRepository(httpClient)

import type { RecipeRepository } from './RecipeRepository'
import type { KitRepository } from './KitRepository'
import { LocalRecipeRepository } from './local/LocalRecipeRepository'
import { LocalKitRepository } from './local/LocalKitRepository'

export const recipeRepo: RecipeRepository = new LocalRecipeRepository()
export const kitRepo: KitRepository = new LocalKitRepository()

// Re-export interfaces for consumers that need them
export type { RecipeRepository } from './RecipeRepository'
export type { KitRepository } from './KitRepository'
