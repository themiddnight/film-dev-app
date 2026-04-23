// repositories/local/LocalRecipeRepository.ts
// Local recipe repository: system recipes + personal localStorage recipes.
// Phase 3: swap out for ApiRecipeRepository without touching any component

import type { RecipeRepository } from '@/repositories/RecipeRepository'
import type { Recipe } from '@/types/recipe'
import type { RecipeFilter, RecipeStepType } from '@/types/recipe'
import { systemRecipes } from '@/data'

const RECIPES_KEY = 'recipes'

type LegacyRecipe = Omit<Recipe, 'visibility'> & {
  optimal_temp_range?: { min: number; max: number }
  visibility?: Recipe['visibility'] | 'public'
}

function asText(value: string | undefined): string {
  return (value ?? '').toLowerCase()
}

function normalizeLoadedRecipe(recipe: LegacyRecipe): Recipe {
  return {
    ...recipe,
    visibility: recipe.visibility === 'public' ? 'published' : (recipe.visibility ?? 'private'),
    optimal_temp: recipe.optimal_temp ?? recipe.optimal_temp_range,
  }
}

export class LocalRecipeRepository implements RecipeRepository {
  private loadPersonal(): Recipe[] {
    try {
      const raw = localStorage.getItem(RECIPES_KEY)
      if (!raw) return []
      return (JSON.parse(raw) as LegacyRecipe[]).map(normalizeLoadedRecipe)
    } catch {
      return []
    }
  }

  private savePersonal(recipes: Recipe[]): void {
    localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes))
  }

  private filterRecipes(recipes: Recipe[], filter?: RecipeFilter): Recipe[] {
    if (!filter) return recipes

    return recipes.filter((recipe) => {
      if (filter.step_type && recipe.step_type !== filter.step_type) return false
      if (filter.author_type && recipe.author_type !== filter.author_type) return false
      if (filter.visibility && recipe.visibility !== filter.visibility) return false

      if (filter.film) {
        const film = filter.film.toLowerCase()
        const byFilmTypes = recipe.film_types?.some((f) => f.toLowerCase().includes(film))
        const byCompatibility = recipe.film_compatibility?.films?.some((f) => f.toLowerCase().includes(film))
        if (!byFilmTypes && !byCompatibility) return false
      }

      if (filter.search) {
        const q = filter.search.toLowerCase()
        const haystack = [recipe.name, recipe.description, ...(recipe.tags ?? [])]
          .map((v) => asText(v))
          .join(' ')
        if (!haystack.includes(q)) return false
      }

      return true
    })
  }

  async getAll(filter?: RecipeFilter): Promise<Recipe[]> {
    const personal = this.loadPersonal()
    return this.filterRecipes([...systemRecipes, ...personal], filter)
  }

  private getAllRecipes(): Recipe[] {
    return [...systemRecipes, ...this.loadPersonal()]
  }

  async getById(id: string): Promise<Recipe | null> {
    return this.getAllRecipes().find((r) => r.id === id) ?? null
  }

  async getByStepType(type: RecipeStepType): Promise<Recipe[]> {
    return this.filterRecipes(this.getAllRecipes(), { step_type: type })
  }

  async save(recipe: Recipe): Promise<void> {
    const personal = this.loadPersonal()
    const now = new Date().toISOString()

    const normalized: Recipe = {
      ...recipe,
      author: recipe.author ?? { id: 'personal', name: 'You' },
      description: recipe.description || '',
      tags: recipe.tags ?? [],
      film_types: recipe.film_types ?? ['any'],
      base_volume_ml: recipe.base_volume_ml ?? 1000,
      optimal_temp: recipe.optimal_temp ?? { min: 20, max: 24 },
      baths: recipe.baths ?? [],
      develop_steps: recipe.develop_steps ?? [],
      author_type: recipe.author_type ?? 'personal',
      visibility: recipe.visibility ?? 'private',
      status: recipe.status ?? 'draft',
      created_at: recipe.created_at ?? now,
      updated_at: now,
    }

    const idx = personal.findIndex((r) => r.id === normalized.id)
    if (idx === -1) personal.push(normalized)
    else personal[idx] = normalized

    this.savePersonal(personal)
  }

  async delete(id: string): Promise<void> {
    const personal = this.loadPersonal()
    this.savePersonal(personal.filter((r) => r.id !== id))
  }
}
