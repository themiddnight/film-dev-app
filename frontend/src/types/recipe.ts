// types/recipe.ts
// Data model ตาม FLOW.md — รองรับ Phase 1 (Divided D-23) และ Phase 2+

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
  | 'raw_powder'
  | 'powder_concentrate'
  | 'liquid_concentrate'
  | 'ready_to_use'
  | 'diy'

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
  'N-1': number
  'N': number
  'N+1': number
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
  id: string                // "divided-d23"
  name: string              // "Divided D-23 + Borax"
  description: string
  author: { id: string; name: string }
  visibility: 'public' | 'private'
  tags: string[]            // ["two-bath", "low-contrast", "tropical"]
  film_types: string[]      // ["any"] หรือ ["Kodak Tri-X", "Ilford HP5"]
  base_volume_ml: number    // 1000 — ใช้ scale chemical amounts
  optimal_temp_range: { min: number; max: number }
  references?: string[]     // array of URLs — แสดงเป็น domain links
  baths: Bath[]             // สำหรับ Mixing Guide
  develop_steps: DevelopStep[]  // สำหรับ Develop Session
}
