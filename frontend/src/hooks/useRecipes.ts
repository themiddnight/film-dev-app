import { useCallback, useEffect, useState } from 'react'
import { recipeRepo } from '../repositories'
import type { Recipe, RecipeFilter, RecipeStepType } from '../types/recipe'

type UseRecipesState = {
  recipes: Recipe[]
  loading: boolean
  error: string | null
}

type RecipeByIdState = {
  recipe: Recipe | null
  loading: boolean
  error: string | null
}

export function useRecipes(filter: RecipeFilter): UseRecipesState {
  const [state, setState] = useState<UseRecipesState>({
    recipes: [],
    loading: true,
    error: null,
  })

  const { author_type, search, step_type, visibility, film } = filter

  useEffect(() => {
    let cancelled = false

    recipeRepo
      .getAll({ author_type, search, step_type, visibility, film })
      .then((recipes) => {
        if (!cancelled) setState({ recipes, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ recipes: [], loading: false, error: String(err) })
      })

    return () => {
      cancelled = true
    }
  }, [author_type, search, step_type, visibility, film])

  return state
}

export function useRecipeMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveRecipe = useCallback(async (recipe: Recipe) => {
    setLoading(true)
    setError(null)
    try {
      await recipeRepo.save(recipe)
    } catch (err: unknown) {
      setError(String(err))
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteRecipe = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await recipeRepo.delete(id)
    } catch (err: unknown) {
      setError(String(err))
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getByStepType = useCallback(async (type: RecipeStepType) => {
    return recipeRepo.getByStepType(type)
  }, [])

  return { saveRecipe, deleteRecipe, getByStepType, loading, error }
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
    recipeRepo
      .getById(id)
      .then((recipe) => {
        if (!cancelled) setState({ recipe, loading: false, error: null, resolvedId: id })
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ recipe: null, loading: false, error: String(err), resolvedId: id })
      })

    return () => {
      cancelled = true
    }
  }, [id])

  const loading = state.loading || (!!id && state.resolvedId !== id)
  return { recipe: state.recipe, loading, error: state.error }
}
