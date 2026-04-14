// types/recipe.ts
// Data model ตาม FLOW.md — current  model (with optional compatibility fields)

export type Chemical = {
  name: string
  amount_per_liter: number  // ปริมาณต่อ 1 ลิตร (metric เสมอ — แปลงตอน display)
  unit: 'g' | 'ml'
  order: number             // ลำดับการใส่ — ห้ามเปลี่ยน
  note?: string             // เช่น "ใส่หลัง Sodium Sulphite เสมอ"
}

export type MixingStep = {
  instruction: string       // "เทน้ำ {volume_75pct} ml ลงในภาชนะ" (template variables)
  warning?: string          // แสดงโดดเด่น
  chemicals?: Chemical[]    // สารที่ใส่ใน step นี้
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
}

export type AgitationSchedule = {
  initial_seconds: number   // เขย่า N วินาทีแรก
  interval_seconds: number  // จากนั้นทุก N วินาที
  duration_seconds: number  // ครั้งละ N วินาที
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
  // type = functional role ของ step ในกระบวนการล้างฟิล์ม (ไม่ใช่ chemistry)
  // ความต่างจาก Bath.role:
  //   Bath.role = "สารนี้คืออะไร" (chemistry perspective)
  //   DevelopStep.type = "step นี้ทำหน้าที่อะไร" (process perspective)
  // ตัวอย่าง Divided D-23 Bath B (Borax):
  //   Bath.role = 'developer' (เป็น developer solution)
  //   DevelopStep.type = 'activator' (ทำหน้าที่ activate Bath A ไม่ใช่ develop โดยตรง)
  type: 'developer' | 'activator' | 'rinse' | 'stop' | 'fixer' | 'wash' | 'dry'
  duration_seconds: number | 'variable'  // "variable" = user กรอกเอง
  duration_override_key?: string          // localStorage key
  agitation?: AgitationSchedule
  warnings?: string[]         // แสดงตลอด step
  transition_warning?: string // แสดงตอน Step Complete ก่อนไป step ถัดไป
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
