import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Plus } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useRecipeMutations } from '../hooks/useRecipes'
import type { Chemical, MixingStep, RecipeStepType, ChemicalFormat } from '../types/recipe'

const STEP_TYPES: RecipeStepType[] = ['developer', 'stop', 'fixer', 'wash_aid', 'wetting_agent']
const CHEMICAL_FORMATS: ChemicalFormat[] = ['ready_to_use', 'powder_raw', 'powder_concentrate', 'liquid_concentrate', 'diy']
const FILM_TYPES = ['hp5', 'fp4', 'tri-x', 'delta-100', 'delta-400', 't-max-100', 'any']

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function CreateRecipeFullPage() {
  const navigate = useNavigate()
  const { saveRecipe, loading } = useRecipeMutations()

  // Basic info
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [stepType, setStepType] = useState<RecipeStepType>('developer')
  const [tags, setTags] = useState('')

  // Film compatibility
  const [filmScope, setFilmScope] = useState<'general' | 'specific'>('general')
  const [selectedFilms, setSelectedFilms] = useState<string[]>([])

  // Chemicals
  const [chemicalFormat, setChemicalFormat] = useState<ChemicalFormat>('ready_to_use')
  const [chemicals, setChemicals] = useState<Chemical[]>([])

  // Mixing steps
  const [mixingSteps, setMixingSteps] = useState<MixingStep[]>([])

  // Developer-specific
  const [optimalTempMin, setOptimalTempMin] = useState(20)
  const [optimalTempMax, setOptimalTempMax] = useState(24)

  const canSave = name.trim().length > 1

  function addChemical() {
    setChemicals([
      ...chemicals,
      { name: '', amount_per_liter: 0, unit: 'g' as const, order: chemicals.length + 1 },
    ])
  }

  function updateChemical<K extends keyof Chemical>(index: number, field: K, value: Chemical[K]) {
    const updated = [...chemicals]
    updated[index] = { ...updated[index], [field]: value }
    setChemicals(updated)
  }

  function removeChemical(index: number) {
    const updated = chemicals.filter((_, i) => i !== index)
    setChemicals(updated)
  }

  function addStep() {
    setMixingSteps([...mixingSteps, { instruction: '' }])
  }

  function updateStep(index: number, instruction: string) {
    const updated = [...mixingSteps]
    updated[index] = { instruction }
    setMixingSteps(updated)
  }

  function removeStep(index: number) {
    setMixingSteps(mixingSteps.filter((_, i) => i !== index))
  }

  function toggleFilm(film: string) {
    setSelectedFilms((prev) =>
      prev.includes(film) ? prev.filter((f) => f !== film) : [...prev, film]
    )
  }

  async function onSave() {
    if (!canSave) return

    const now = new Date().toISOString()
    const recipeId = crypto.randomUUID()

    await saveRecipe({
      id: recipeId,
      slug: toSlug(name),
      name: name.trim(),
      author: { id: 'personal', name: 'You' },
      description: description.trim() || 'Personal recipe',
      visibility: 'private',
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      film_types: filmScope === 'specific' ? selectedFilms : ['any'],
      base_volume_ml: 1000,
      optimal_temp_range: stepType === 'developer' ? { min: optimalTempMin, max: optimalTempMax } : undefined,
      baths: [],
      develop_steps: [],
      step_type: stepType,
      author_type: 'personal',
      status: 'draft',
      film_compatibility: {
        scope: filmScope,
        films: filmScope === 'specific' ? selectedFilms : undefined,
      },
      chemical_format: chemicalFormat,
      chemicals: chemicals.length > 0 ? chemicals : undefined,
      mixing_steps: mixingSteps.length > 0 ? mixingSteps : undefined,
      optimal_temp: stepType === 'developer' ? { min: optimalTempMin, max: optimalTempMax } : undefined,
      created_at: now,
      updated_at: now,
    })

    navigate('/recipes')
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar title="Create Recipe" onBack={() => navigate('/recipes')} />

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {/* Basic Info Section */}
        <div className="card bg-base-200">
          <div className="card-body p-4 space-y-3">
            <h3 className="font-semibold">Basic Info</h3>

            <div>
              <label className="text-xs text-sub block mb-1">Recipe name *</label>
              <input
                className="input input-bordered w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Rodinal 1:50"
              />
            </div>

            <div>
              <label className="text-xs text-sub block mb-1">Description</label>
              <textarea
                className="textarea textarea-bordered w-full"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes about this recipe"
              />
            </div>

            <div>
              <label className="text-xs text-sub block mb-1">Step type *</label>
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
              <label className="text-xs text-sub block mb-1">Tags (comma separated)</label>
              <input
                className="input input-bordered w-full"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., fine-grain, acutance, compensating"
              />
            </div>
          </div>
        </div>

        {/* Film Compatibility Section */}
        <div className="card bg-base-200">
          <div className="card-body p-4 space-y-3">
            <h3 className="font-semibold">Film Compatibility</h3>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  className="radio radio-sm"
                  checked={filmScope === 'general'}
                  onChange={() => setFilmScope('general')}
                />
                <span className="text-sm">Works with any film</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  className="radio radio-sm"
                  checked={filmScope === 'specific'}
                  onChange={() => setFilmScope('specific')}
                />
                <span className="text-sm">Specific films:</span>
              </label>
            </div>

            {filmScope === 'specific' && (
              <div className="grid grid-cols-2 gap-2">
                {FILM_TYPES.map((film) => (
                  film !== 'any' && (
                    <label key={film} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={selectedFilms.includes(film)}
                        onChange={() => toggleFilm(film)}
                      />
                      <span className="text-sm">{film.toUpperCase()}</span>
                    </label>
                  )
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chemical Format Section */}
        <div className="card bg-base-200">
          <div className="card-body p-4 space-y-3">
            <h3 className="font-semibold">Chemical Format</h3>
            <select
              className="select select-bordered w-full"
              value={chemicalFormat}
              onChange={(e) => setChemicalFormat(e.target.value as ChemicalFormat)}
            >
              {CHEMICAL_FORMATS.map((format) => (
                <option key={format} value={format}>
                  {format}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chemicals List Section */}
        {chemicalFormat !== 'ready_to_use' && (
          <div className="card bg-base-200">
            <div className="card-body p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Chemicals</h3>
                <button className="btn btn-ghost btn-xs" onClick={addChemical}>
                  <Plus size={14} />
                </button>
              </div>

              <div className="space-y-2">
                {chemicals.map((chem, idx) => (
                  <div key={idx} className="space-y-1.5 p-2 rounded-lg bg-base-100">
                    <input
                      className="input input-bordered input-sm w-full"
                      value={chem.name}
                      onChange={(e) => updateChemical(idx, 'name', e.target.value)}
                      placeholder="Chemical name"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        className="input input-bordered input-sm"
                        value={chem.amount_per_liter}
                        onChange={(e) => updateChemical(idx, 'amount_per_liter', parseFloat(e.target.value) || 0)}
                        placeholder="Amount"
                      />
                      <select
                        className="select select-bordered select-sm"
                        value={chem.unit}
                        onChange={(e) => updateChemical(idx, 'unit', e.target.value as 'g' | 'ml')}
                      >
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                      </select>
                      <button className="btn btn-ghost btn-sm" onClick={() => removeChemical(idx)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mixing Steps Section */}
        <div className="card bg-base-200">
          <div className="card-body p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Mixing Steps</h3>
              <button className="btn btn-ghost btn-xs" onClick={addStep}>
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-2">
              {mixingSteps.map((step, idx) => (
                <div key={idx} className="space-y-1 p-2 rounded-lg bg-base-100">
                  <div className="flex gap-2">
                    <textarea
                      className="textarea textarea-bordered textarea-sm flex-1"
                      rows={2}
                      value={step.instruction}
                      onChange={(e) => updateStep(idx, e.target.value)}
                      placeholder={`Step ${idx + 1}: Instruction...`}
                    />
                    <button className="btn btn-ghost btn-sm h-fit" onClick={() => removeStep(idx)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Developer-specific Section */}
        {stepType === 'developer' && (
          <div className="card bg-base-200">
            <div className="card-body p-4 space-y-3">
              <h3 className="font-semibold">Development Temperature</h3>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-sub block mb-1">Min (°C)</label>
                  <input
                    type="number"
                    className="input input-bordered input-sm w-full"
                    value={optimalTempMin}
                    onChange={(e) => setOptimalTempMin(parseFloat(e.target.value) || 20)}
                  />
                </div>
                <div>
                  <label className="text-xs text-sub block mb-1">Max (°C)</label>
                  <input
                    type="number"
                    className="input input-bordered input-sm w-full"
                    value={optimalTempMax}
                    onChange={(e) => setOptimalTempMax(parseFloat(e.target.value) || 24)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-base-300">
        <button className="btn btn-primary w-full" disabled={!canSave || loading} onClick={() => void onSave()}>
          Create Recipe
        </button>
      </div>
    </div>
  )
}
