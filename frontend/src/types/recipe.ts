// types/recipe.ts
// Data model per FLOW.md — current model (with optional compatibility fields)

export type Chemical = {
  name: string
  amount_per_liter: number  // amount per 1 litre (always metric — convert at display time)
  unit: 'g' | 'ml'
  order: number             // addition order — do not change
  note?: string             // e.g. "add after Sodium Sulphite"
}

export type MixingStep = {
  instruction: string       // "Pour {volume_75pct} ml of water into the vessel" (template variables)
  warning?: string          // displayed prominently
  chemicals?: Chemical[]    // chemicals added in this step
}

export type ChemicalFormat =
  | 'powder_raw'
  | 'powder_concentrate'
  | 'liquid_concentrate'
  | 'ready_to_use'
  | 'diy'

export type RecipeStepType =
  | 'developer'
  | 'stop'
  | 'fixer'
  | 'wash_aid'
  | 'wetting_agent'

export type FilmCompatibility = {
  scope: 'general' | 'specific'
  films?: string[]
  iso_range?: { min: number; max: number }
  notes?: string
}

export type DilutionOption = {
  label?: string
  concentrate_parts: number
  water_parts: number
  notes?: string
}

export type DilutionSpec =
  | { type: 'fixed'; concentrate_parts: number; water_parts: number; label?: string }
  | { type: 'preset'; options: DilutionOption[]; default_label?: string }
  | {
      type: 'open'
      suggested_ratios: DilutionOption[]
      min_water_parts?: number
      max_water_parts?: number
    }

export type PushPull = 'N-2' | 'N-1' | 'N' | 'N+1' | 'N+2'

export type BathNVariation = {
  chemicals?: Chemical[]
  mixing_steps?: MixingStep[]
}

export type DevelopTiming = {
  type: 'fixed' | 'temp_table' | 'push_pull_table' | 'combined'
  fixed_seconds?: number
  temp_table?: Record<number, Partial<Record<PushPull, number>>>
  push_pull_table?: {
    base_temp_celsius: number
    entries: Partial<Record<PushPull, number>>
  }
}

export type AgitationSpec =
  | { type: 'inversion'; initial_seconds: number; interval_seconds: number; duration_seconds: number }
  | { type: 'stand' }
  | { type: 'semi_stand'; initial_seconds: number }
  | { type: 'rotary'; rpm?: number }
  | { type: 'custom'; description: string }

export type RecipeConstraints = {
  required_fixer_type?: 'standard' | 'alkaline'
  is_two_bath?: boolean
  fixer_grade?: 'film' | 'paper'
  reuse_compensation?: {
    max_rolls?: number
    time_increase_per_roll?: number
    notes?: string
  }
  agitation_time_multipliers?: {
    inversion?: number
    rotary?: number
    stand?: number
  }
  min_volume_ml?: {
    '35mm_1roll'?: number
    '35mm_2roll'?: number
    '120_1roll'?: number
    '4x5_1sheet'?: number
  }
}

export type StorageInfo = {
  shelf_life?: string
  container?: string
  notes?: string
}

export type BathRole =
  | 'developer'
  | 'stop'
  | 'fixer'
  | 'wash_aid'
  | 'wetting_agent'

export type Bath = {
  id: string                // "bath-a", "stop-bath", "fixer"
  name: string              // "Bath A — Developer"
  role: BathRole
  developer_bath_role?: 'bath_a' | 'bath_b'
  chemical_format: ChemicalFormat
  mixing_required: boolean
  chemicals?: Chemical[]
  mixing_steps?: MixingStep[]
  dilution_ratio?: string   // for liquid_concentrate only, e.g., "1:31"
  storage?: {
    shelf_life: string
    container: string
    notes?: string
  }
  n_variations?: Partial<Record<PushPull, BathNVariation>>
}

export type AgitationSchedule = {
  initial_seconds: number   // agitate for the first N seconds
  interval_seconds: number  // then every N seconds
  duration_seconds: number  // for N seconds each time
}

export type TempTableEntry = {
  'N-2'?: number
  'N-1': number
  'N': number
  'N+1': number
  'N+2'?: number
}

export type DevelopStep = {
  id: string
  name: string
  // type = functional role of the step in the film development process (not chemistry)
  // difference from Bath.role:
  //   Bath.role = "what is this chemical" (chemistry perspective)
  //   DevelopStep.type = "what does this step do" (process perspective)
  // example — Divided D-23 Bath B (Borax):
  //   Bath.role = 'developer' (it is a developer solution)
  //   DevelopStep.type = 'activator' (its role is to activate Bath A, not develop directly)
  type: 'developer' | 'activator' | 'rinse' | 'stop' | 'fixer' | 'wash' | 'dry'
  duration_seconds: number | 'variable'  // "variable" = user enters manually
  duration_override_key?: string          // localStorage key
  agitation?: AgitationSchedule
  warnings?: string[]         // shown throughout the step
  transition_warning?: string // shown at Step Complete before moving to the next step
  temp_table?: Record<number, TempTableEntry>  // temp_celsius → durations
  bath_ref?: string           // links to Bath.id — used by steps that require chemicals
  optional?: boolean          // marks step as skippable (wash_aid, wetting_agent)
  optional_note?: string      // explains how to skip (e.g., substitute with water wash)
}

export type Recipe = {
  id: string
  name: string
  description: string
  author: { id: string; name: string }
  visibility: 'public' | 'private' | 'published'
  tags: string[]
  film_types?: string[]
  base_volume_ml?: number
  optimal_temp_range?: { min: number; max: number }
  references?: string[]
  baths?: Bath[]
  develop_steps?: DevelopStep[]

  //  fields
  slug?: string
  step_type?: RecipeStepType
  film_compatibility?: FilmCompatibility
  chemical_format?: ChemicalFormat
  dilution?: DilutionSpec
  chemicals?: Chemical[]
  mixing_steps?: MixingStep[]
  optimal_temp?: { min: number; max: number }
  develop_timing?: DevelopTiming
  agitation?: AgitationSpec
  storage?: StorageInfo
  constraints?: RecipeConstraints
  author_id?: string
  author_type?: 'system' | 'personal' | 'community'
  status?: 'draft' | 'pending_review' | 'published'
  created_at?: string
  updated_at?: string
}

export type RecipeFilter = {
  step_type?: RecipeStepType
  author_type?: 'system' | 'personal' | 'community'
  visibility?: 'private' | 'published'
  film?: string
  search?: string
}
