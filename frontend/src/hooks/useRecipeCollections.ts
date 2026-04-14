import { useCallback, useEffect, useState } from 'react'
import { favoriteRecipeRepo, offlineSavedRecipeRepo } from '../repositories'
import type { Recipe } from '../types/recipe'

type RecipeCollectionsState = {
  favoriteIds: Set<string>
  offlineSavedIds: Set<string>
  loading: boolean
  error: string | null
}

export function useRecipeCollections() {
  const [state, setState] = useState<RecipeCollectionsState>({
    favoriteIds: new Set(),
    offlineSavedIds: new Set(),
    loading: true,
    error: null,
  })

  const reload = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const [favoriteIds, offlineSavedIds] = await Promise.all([
        favoriteRecipeRepo.getAllIds(),
        offlineSavedRecipeRepo.getAllIds(),
      ])

      setState({
        favoriteIds: new Set(favoriteIds),
        offlineSavedIds: new Set(offlineSavedIds),
        loading: false,
        error: null,
      })
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, loading: false, error: String(err) }))
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const toggleFavorite = useCallback(
    async (recipeId: string) => {
      const isFavorite = state.favoriteIds.has(recipeId)
      if (isFavorite) await favoriteRecipeRepo.delete(recipeId)
      else await favoriteRecipeRepo.save(recipeId)
      await reload()
    },
    [reload, state.favoriteIds],
  )

  const toggleOfflineSaved = useCallback(
    async (recipe: Recipe) => {
      const isSaved = state.offlineSavedIds.has(recipe.id)
      if (isSaved) await offlineSavedRecipeRepo.delete(recipe.id)
      else await offlineSavedRecipeRepo.save(recipe)
      await reload()
    },
    [reload, state.offlineSavedIds],
  )

  const isFavorite = useCallback((recipeId: string) => state.favoriteIds.has(recipeId), [state.favoriteIds])
  const isOfflineSaved = useCallback((recipeId: string) => state.offlineSavedIds.has(recipeId), [state.offlineSavedIds])

  return {
    ...state,
    reload,
    toggleFavorite,
    toggleOfflineSaved,
    isFavorite,
    isOfflineSaved,
  }
}
