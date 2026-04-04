// types/kit.ts
// Layer 2 — User's World: My Kit data types (Phase 1b+)
// Storage: localStorage key 'my-kit' (throwaway — no migration needed when backend arrives)

export type ChemicalBottle = {
  id: string                   // uuid — ไม่ใช้ array index
  developerName: string        // "Divided D-23 Bath A", "HC-110 Working Solution"
  role: 'developer' | 'stop' | 'fixer' | 'wash_aid' | 'wetting_agent'
                               // ใช้ filter slot ใน DevKit — ต้องตรงกับ Bath.role ของ recipe
  defaultDilution?: string     // "1:25" — default แต่ override ได้ต่อ session
  type: 'one-shot' | 'reusable'
  mixedAt: string              // ISO date string — วันที่ผสมหรือเปิดขวด
  shelfLifeDays?: number       // จาก recipe data — ใช้คำนวณ expiry warning
  rollsDeveloped: number       // track จาก sessions (0 เมื่อเพิ่งสร้าง)
  maxRolls?: number            // จาก recipe data — warn เมื่อใกล้ครบ
  notes?: string
  createdAt: string            // ISO date string
  updatedAt: string            // ISO date string
}

export type EquipmentProfile = {
  tankType: 'paterson' | 'stainless' | 'jobo' | 'other'
  tankLabel?: string           // เช่น "Paterson Super System 4"
  agitationMethod: 'inversion' | 'rotation' | 'rotary' | 'stand'
  waterHardness: 'soft' | 'medium' | 'hard'
  usesPreSoak: boolean
  // stopBathType removed — stop bath now always present via water-stop bath in recipe data
}

export type UserKit = {
  equipment: EquipmentProfile
  bottles: ChemicalBottle[]
  // devKits เก็บแยกใน localStorage key: `my-kit-devkits`
}

// ── Phase 1c: Kit Playlist ───────────────────────────────────────────────────

/**
 * KitSlot: mapping ระหว่าง DevelopStep 1 ตัว กับ ChemicalBottle 1 ขวด
 * stepId → FK ไป DevelopStep.id ใน recipe
 * bottleId → FK ไป ChemicalBottle.id, null ถ้ายังไม่ได้เลือก
 */
export type KitSlot = {
  stepId: string
  bottleId: string | null
}

/**
 * DevKit: preset สำหรับ session — user กำหนดล่วงหน้าว่าจะใช้ขวดไหนกับ step ไหน
 * ผูกกับ Recipe 1 ตัวเสมอ (ผ่าน recipeId)
 * เก็บใน localStorage key: `my-kit-devkits`
 */
export type DevKit = {
  id: string                // uuid
  name: string              // ชื่อที่ user ตั้ง เช่น "D-23 + Ilfosol Stop Set"
  recipeId: string          // FK ไป Recipe — Kit ผูกกับ recipe 1 ตัว
  slots: KitSlot[]          // mapping stepId → bottleId
  createdAt: string         // ISO date
  updatedAt: string         // ISO date
}

// Default equipment profile — used when no kit exists yet
export const DEFAULT_EQUIPMENT: EquipmentProfile = {
  tankType: 'paterson',
  agitationMethod: 'inversion',
  waterHardness: 'medium',
  usesPreSoak: false,
}

export const DEFAULT_USER_KIT: UserKit = {
  equipment: DEFAULT_EQUIPMENT,
  bottles: [],
}
