// hooks/useRecipes.ts
// Data hook สำหรับ recipes — wraps RecipeRepository
// Components ใช้ hook นี้แทนการ import static data โดยตรง

import { useState, useEffect } from 'react'
import type { Recipe } from '../types/recipe'
import { recipeRepo } from '../repositories'

type RecipesState = {
  recipes: Recipe[]
  loading: boolean
  error: string | null
}

export function useRecipes(): RecipesState {
  const [state, setState] = useState<RecipesState>({
    recipes: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    recipeRepo.getAll().then((data) => {
      if (!cancelled) setState({ recipes: data, loading: false, error: null })
    }).catch((err: unknown) => {
      if (!cancelled) {
        setState({ recipes: [], loading: false, error: String(err) })
      }
    })
    return () => { cancelled = true }
  }, [])

  return state
}

type RecipeByIdState = {
  recipe: Recipe | null
  loading: boolean
  error: string | null
}

export function useRecipeById(id: string | undefined): RecipeByIdState {
  const [state, setState] = useState<RecipeByIdState & { resolvedId: string | undefined }>({
    recipe: null,
    loading: !!id,
    error: null,
    resolvedId: id ? undefined : id,
  })

  useEffect(() => {
    if (!id) return

    let cancelled = false
    recipeRepo.getById(id).then((data) => {
      if (!cancelled) setState({ recipe: data, loading: false, error: null, resolvedId: id })
    }).catch((err: unknown) => {
      if (!cancelled) setState({ recipe: null, loading: false, error: String(err), resolvedId: id })
    })

    return () => { cancelled = true }
  }, [id])

  const loading = state.loading || (!!id && state.resolvedId !== id)

  return { recipe: state.recipe, loading, error: state.error }
}
