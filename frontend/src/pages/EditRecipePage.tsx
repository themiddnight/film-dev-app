import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useRecipeById, useRecipeMutations } from '../hooks/useRecipes'
import type { RecipeStepType } from '../types/recipe'

const STEP_TYPES: RecipeStepType[] = ['developer', 'stop', 'fixer', 'wash_aid', 'wetting_agent']

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function EditRecipePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { recipe, loading } = useRecipeById(id)
  const { saveRecipe, loading: saving } = useRecipeMutations()

  const [name, setName] = useState('')
  const [stepType, setStepType] = useState<RecipeStepType>('developer')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!recipe) return
    setName(recipe.name)
    setDescription(recipe.description ?? '')
    setStepType((recipe.step_type ?? 'developer') as RecipeStepType)
  }, [recipe])

  async function onSave() {
    if (!recipe || recipe.author_type !== 'personal') return

    await saveRecipe({
      ...recipe,
      name: name.trim(),
      slug: toSlug(name),
      description: description.trim() || 'Quick personal recipe',
      step_type: stepType,
      updated_at: new Date().toISOString(),
    })

    navigate(`/recipes/${recipe.id}`)
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Navbar title="Edit Recipe" onBack={() => navigate('/recipes')} />
        <div className="p-4 text-sm text-sub">Loading...</div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="flex flex-col h-full">
        <Navbar title="Edit Recipe" onBack={() => navigate('/recipes')} />
        <div className="p-4 text-sm text-error">Recipe not found.</div>
      </div>
    )
  }

  if (recipe.author_type !== 'personal') {
    return (
      <div className="flex flex-col h-full">
        <Navbar title="Edit Recipe" onBack={() => navigate(`/recipes/${recipe.id}`)} />
        <div className="p-4 text-sm text-warning">Only personal recipes can be edited.</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar title="Edit Recipe" onBack={() => navigate(`/recipes/${recipe.id}`)} />

      <div className="p-4 space-y-4">
        <div>
          <label className="text-xs text-sub block mb-1">Recipe name</label>
          <input
            className="input input-bordered w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-sub block mb-1">Step type</label>
          <select
            className="select select-bordered w-full"
            value={stepType}
            onChange={(e) => setStepType(e.target.value as RecipeStepType)}
          >
            {STEP_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-sub block mb-1">Description</label>
          <textarea
            className="textarea textarea-bordered w-full"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button className="btn btn-primary w-full" onClick={() => void onSave()} disabled={!name.trim() || saving}>
          Save changes
        </button>
      </div>
    </div>
  )
}
