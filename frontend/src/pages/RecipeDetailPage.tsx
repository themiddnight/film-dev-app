import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useRecipeById, useRecipeMutations } from '../hooks/useRecipes'
import { useRecipeCollections } from '../hooks/useRecipeCollections'

export default function RecipeDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { recipe, loading } = useRecipeById(id)
  const { deleteRecipe, loading: mutating } = useRecipeMutations()
  const [deleting, setDeleting] = useState(false)
  const { isFavorite, isOfflineSaved, toggleFavorite, toggleOfflineSaved } = useRecipeCollections()

  const canDelete = useMemo(() => recipe?.author_type === 'personal', [recipe?.author_type])

  async function onDelete() {
    if (!recipe || !canDelete || deleting) return
    setDeleting(true)
    try {
      await deleteRecipe(recipe.id)
      navigate('/recipes')
    } finally {
      setDeleting(false)
    }
  }

  async function onToggleFavourite() {
    if (!recipe) return
    await toggleFavorite(recipe.id)
  }

  async function onToggleOfflineSaved() {
    if (!recipe) return
    await toggleOfflineSaved(recipe)
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar title="Recipe Detail" onBack={() => navigate('/recipes')} />

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {loading && <p className="text-sm text-sub">Loading...</p>}
        {!loading && !recipe && <p className="text-sm text-error">Recipe not found.</p>}

        {recipe && (
          <>
            <div className="space-y-1">
              <h1 className="text-xl font-bold">{recipe.name}</h1>
              <p className="text-sm text-sub capitalize">
                {(recipe.step_type ?? 'unknown')} · {(recipe.author_type ?? 'unknown')}
              </p>
            </div>

            {recipe.description && (
              <p className="text-sm text-base-content/90">{recipe.description}</p>
            )}

            {recipe.mixing_steps && recipe.mixing_steps.length > 0 && (
              <div className="card bg-base-200">
                <div className="card-body p-4 text-sm space-y-2">
                  <p className="font-semibold">Mixing instructions</p>
                  <ol className="list-decimal list-inside space-y-1 text-base-content/90">
                    {recipe.mixing_steps.map((step, index) => (
                      <li key={`${step.instruction}-${index}`}>{step.instruction}</li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            <div className="card bg-base-200">
              <div className="card-body p-4 text-sm space-y-2">
                <p>
                  <span className="font-semibold">Chemical format:</span>{' '}
                  <span className="capitalize">{recipe.chemical_format ?? '-'}</span>
                </p>
                <p>
                  <span className="font-semibold">Visibility:</span>{' '}
                  <span className="capitalize">{recipe.visibility ?? '-'}</span>
                </p>
                <p>
                  <span className="font-semibold">Status:</span>{' '}
                  <span className="capitalize">{recipe.status ?? '-'}</span>
                </p>
              </div>
            </div>

            {canDelete && (
              <div className="flex gap-2">
                <button
                  className="btn btn-outline flex-1"
                  onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
                >
                  Edit personal recipe
                </button>
                <button
                  className="btn btn-error btn-outline flex-1"
                  onClick={onDelete}
                  disabled={mutating || deleting}
                >
                  Delete
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                className={`btn ${isFavorite(recipe.id) ? 'btn-outline' : 'btn-primary'}`}
                onClick={() => void onToggleFavourite()}
                disabled={mutating}
              >
                {isFavorite(recipe.id) ? 'Remove favourite' : 'Add favourite'}
              </button>
              <button
                className={`btn ${isOfflineSaved(recipe.id) ? 'btn-outline' : 'btn-primary'}`}
                onClick={() => void onToggleOfflineSaved()}
                disabled={mutating}
              >
                {isOfflineSaved(recipe.id) ? 'Remove offline saved' : 'Save for offline'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
