import type { Recipe } from '@/types/recipe'

export const systemCreated = '2026-04-14T00:00:00.000Z'

export function withRecipeDefaults(recipe: Partial<Recipe> & Pick<Recipe, 'id' | 'name' | 'description'>): Recipe {
  return {
    author: { id: 'system', name: 'Film Dev Guidance' },
    visibility: 'published',
    tags: [],
    film_types: ['any'],
    base_volume_ml: 1000,
    baths: [],
    develop_steps: [],
    ...recipe,
  }
}
