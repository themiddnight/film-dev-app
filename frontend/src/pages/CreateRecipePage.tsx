import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useRecipeMutations } from '../hooks/useRecipes'
import type { RecipeStepType } from '../types/recipe'

const STEP_TYPES: RecipeStepType[] = ['developer', 'stop', 'fixer', 'wash_aid', 'wetting_agent']

function createId(): string {
  return crypto.randomUUID()
}

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function CreateRecipePage() {
  const navigate = useNavigate()
  const { saveRecipe, loading } = useRecipeMutations()

  const [name, setName] = useState('')
  const [stepType, setStepType] = useState<RecipeStepType>('developer')
  const [seconds, setSeconds] = useState(600)
  const [temp, setTemp] = useState(20)

  const canSave = name.trim().length > 1

  async function onSave() {
    if (!canSave) return

    const now = new Date().toISOString()
    const recipeId = createId()

    await saveRecipe({
      id: recipeId,
      slug: toSlug(name),
      name: name.trim(),
      author: { id: 'personal', name: 'You' },
      step_type: stepType,
      description: 'Quick personal recipe',
      tags: [],
      film_types: ['any'],
      base_volume_ml: 1000,
      optimal_temp_range: { min: temp, max: temp },
      baths: [],
      develop_steps: [],
      author_type: 'personal',
      visibility: 'private',
      status: 'draft',
      film_compatibility: { scope: 'general' },
      chemical_format: 'ready_to_use',
      develop_timing:
        stepType === 'developer'
          ? {
              type: 'fixed',
              fixed_seconds: seconds,
            }
          : undefined,
      optimal_temp: stepType === 'developer' ? { min: temp, max: temp } : undefined,
      created_at: now,
      updated_at: now,
    })

    navigate(`/recipes/${recipeId}`)
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar title="Quick Create Recipe" onBack={() => navigate('/recipes')} />

      <div className="p-4 space-y-4">
        <div>
          <label className="text-xs text-sub block mb-1">Recipe name</label>
          <input
            className="input input-bordered w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My Rodinal Test"
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

        {stepType === 'developer' && (
          <>
            <div>
              <label className="text-xs text-sub block mb-1">Time (seconds)</label>
              <input
                className="input input-bordered w-full"
                type="number"
                min={1}
                value={seconds}
                onChange={(e) => setSeconds(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs text-sub block mb-1">Temperature (C)</label>
              <input
                className="input input-bordered w-full"
                type="number"
                min={10}
                max={35}
                value={temp}
                onChange={(e) => setTemp(Number(e.target.value))}
              />
            </div>
          </>
        )}

        <button className="btn btn-primary w-full" disabled={!canSave || loading} onClick={onSave}>
          Save Recipe
        </button>
      </div>
    </div>
  )
}
