import { useCallback, useEffect, useRef, useState } from 'react'
import { favoriteRecipeRepo, offlineSavedRecipeRepo } from '@/repositories'
import type { Recipe } from '@/types/recipe'

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

  // Refs give toggle/check callbacks always-fresh Set access without making
  // the Sets themselves a useCallback dep (Sets are compared by reference,
  // so a new Set after each reload would recreate every callback every render).
  const favoriteIdsRef = useRef(state.favoriteIds)
  favoriteIdsRef.current = state.favoriteIds
  const offlineSavedIdsRef = useRef(state.offlineSavedIds)
  offlineSavedIdsRef.current = state.offlineSavedIds

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
      const isFavorite = favoriteIdsRef.current.has(recipeId)
      if (isFavorite) await favoriteRecipeRepo.delete(recipeId)
      else await favoriteRecipeRepo.save(recipeId)
      await reload()
    },
    [reload],
  )

  const toggleOfflineSaved = useCallback(
    async (recipe: Recipe) => {
      const isSaved = offlineSavedIdsRef.current.has(recipe.id)
      if (isSaved) await offlineSavedRecipeRepo.delete(recipe.id)
      else await offlineSavedRecipeRepo.save(recipe)
      await reload()
    },
    [reload],
  )

  const isFavorite = useCallback((recipeId: string) => favoriteIdsRef.current.has(recipeId), [])
  const isOfflineSaved = useCallback((recipeId: string) => offlineSavedIdsRef.current.has(recipeId), [])

  return {
    ...state,
    reload,
    toggleFavorite,
    toggleOfflineSaved,
    isFavorite,
    isOfflineSaved,
  }
}
