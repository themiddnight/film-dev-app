// repositories/KitRepository.ts
// Interface สำหรับ data access layer ของ My Kit (Layer 2 — User's World)
// Phase 1b: LocalKitRepository (localStorage key: 'my-kit')
// Phase 1c: เพิ่ม DevKit CRUD (localStorage key: 'my-kit-devkits')
// Phase 3: ApiKitRepository (REST API tied to user account)

import type { ChemicalBottle, DevKit, EquipmentProfile, UserKit } from '../types/kit'

export interface KitRepository {
  /** โหลด kit ทั้งหมด (equipment + bottles) — คืน default ถ้าไม่มีข้อมูล */
  getKit(): Promise<UserKit>

  /** บันทึก equipment profile */
  saveEquipment(profile: EquipmentProfile): Promise<void>

  /** เพิ่ม bottle ใหม่ — id, createdAt, updatedAt สร้างอัตโนมัติ */
  addBottle(bottle: Omit<ChemicalBottle, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChemicalBottle>

  /** แก้ไข bottle — updatedAt อัปเดตอัตโนมัติ */
  updateBottle(id: string, updates: Partial<Omit<ChemicalBottle, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void>

  /** ลบ bottle */
  deleteBottle(id: string): Promise<void>

  /** เพิ่ม rollsDeveloped หลัง session เสร็จ (default count = 1) */
  incrementRolls(bottleId: string, count?: number): Promise<void>

  // ── Phase 1c: DevKit CRUD ────────────────────────────────────────────────

  /** บันทึก DevKit (create หรือ update ถ้า id ตรงกัน) */
  saveDevKit(kit: DevKit): Promise<void>

  /**
   * โหลด DevKits — ถ้าส่ง recipeId จะ filter เฉพาะ kit ของ recipe นั้น
   * ถ้าไม่ส่ง recipeId → คืนทั้งหมด
   */
  getDevKits(recipeId?: string): Promise<DevKit[]>

  /** ลบ DevKit */
  deleteDevKit(id: string): Promise<void>
}
