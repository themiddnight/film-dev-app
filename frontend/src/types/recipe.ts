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

export type Bath = {
  id: string                // "bath-a", "stop-bath", "fixer"
  name: string              // "Bath A — Developer"
  developer_type: 'raw' | 'concentrate'
  chemicals: Chemical[]
  mixing_steps: MixingStep[]
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
  type: 'developer' | 'activator' | 'rinse' | 'stop' | 'fixer' | 'wash' | 'dry'
  duration_seconds: number | 'variable'  // "variable" = user กรอกเอง
  duration_override_key?: string          // localStorage key
  agitation?: AgitationSchedule
  warnings?: string[]         // แสดงตลอด step
  transition_warning?: string // แสดงตอน Step Complete ก่อนไป step ถัดไป
  temp_table?: Record<number, TempTableEntry>  // temp_celsius → durations
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
